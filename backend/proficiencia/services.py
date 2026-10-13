# notificacoes/services.py
import pandas as pd
from decimal import Decimal
from django.db import transaction
from alunos.models import Aluno
from cursos.models import Curso
from .models import HistoricoProva, ImportacaoPlanilha
from matricula.models import MatriculaSemestre





def buscar_ou_criar_aluno(nome: str, email: str):
    """
    Tenta encontrar o aluno pelo e-mail (chave mais confiável).
    Se não encontrar, cria um novo cadastro.

    Retorna: (aluno, foi_criado)
    """
    aluno, foi_criado = Aluno.objects.get_or_create(
        email=email,
        defaults={"nome": nome}
    )
    return aluno, foi_criado


def importar_planilha_padrao(arquivo):
    # Lê a aba principal do Excel
    df = pd.read_excel(arquivo)
    
    # Remove espaços em branco dos nomes das colunas para evitar erros bobos
    df.columns = df.columns.str.strip().str.upper()

    # Cria o registro da importação
    importacao = ImportacaoPlanilha.objects.create(
        origem="PADRAO",
        nome_arquivo=arquivo.name,
        semestre_referencia="MULTIPLOS" # Como a planilha pode ter vários, deixamos genérico
    )

    alunos_criados = 0
    provas_importadas = 0

    with transaction.atomic():
        for index, row in df.iterrows():
            email = str(row.get('EMAIL', '')).strip()
            if not email or email.lower() == 'nan':
                continue # Pula linhas sem e-mail

            nome = str(row.get('NOME', '')).strip()
            ra = str(row.get('RA', '')).strip()
            if ra.lower() == 'nan': ra = None

            # 1. Busca ou Cria o Aluno
            aluno, created = Aluno.objects.get_or_create(
                email=email,
                defaults={'nome': nome, 'ra': ra}
            )
            if created:
                alunos_criados += 1

            # 2. Busca ou Cria o Curso
            nome_curso = str(row.get('CURSO', '')).strip()
            curso = None
            if nome_curso and nome_curso.lower() != 'nan':
                curso, _ = Curso.objects.get_or_create(
                    nome=nome_curso,
                    defaults={'duracao_periodos': 8} # Valor padrão se for curso novo
                )

            # 3. Resolve a Matrícula
            semestre_ref = str(row.get('SEMESTRE_REFERENCIA', '')).strip()
            if not semestre_ref or semestre_ref.lower() == 'nan':
                continue
            turno = str(row.get('TURNO', 'MANHA')).strip().upper()
            periodo = row.get('PERIODO_CURSO')
            
            # Se periodo for vazio no excel, joga 1 como padrão
            if pd.isna(periodo): 
                periodo = 1 
            periodo = int(float(periodo))

            matricula = None
            if semestre_ref and semestre_ref.lower() != 'nan':
                
                # Período que veio da planilha e divide pela duração oficial do curso no Banco de Dados
                percentual_calculado = 0
                if curso and curso.duracao_periodos:
                    percentual_calculado = round((periodo / curso.duracao_periodos) * 100, 2)
                
                matricula, _ = MatriculaSemestre.objects.update_or_create(
                    aluno=aluno,
                    semestre_referencia=semestre_ref,
                    defaults={
                        'curso': curso,
                        'turno': turno,
                        'periodo_no_semestre': periodo,
                        'percentual_curso': percentual_calculado,
                        'importacao': importacao
                    }
                )

            # Salva Notas (Ignora se a célula no Excel estiver vazia)
            nota_mat = str(row.get('NOTA_MATEMATICA', '')).strip().replace(',', '.')
            if nota_mat and nota_mat.lower() != 'nan':
                if pd.notna(nota_mat) and str(nota_mat).strip() != '':
                    HistoricoProva.objects.update_or_create(
                        aluno=aluno,
                        disciplina="MATEMATICA",
                        semestre_prova=semestre_ref,
                        defaults={
                            'nota': float(nota_mat),
                            'matricula': matricula,
                            'origem_dados': 'PLANILHA',
                            'importacao': importacao
                        }
                    )
                    provas_importadas += 1

            nota_port = str(row.get('NOTA_PORTUGUES', '')).strip().replace(',', '.')
            if nota_port and nota_port.lower() != 'nan':
                if pd.notna(nota_port) and str(nota_port).strip() != '':
                    HistoricoProva.objects.update_or_create(
                        aluno=aluno,
                        disciplina="PORTUGUES",
                        semestre_prova=semestre_ref,
                        defaults={
                            'nota': float(nota_port),
                            'matricula': matricula,
                            'origem_dados': 'PLANILHA',
                            'importacao': importacao
                        }
                    )
                    provas_importadas += 1

    return {
        "status": "sucesso",
        "alunos_novos": alunos_criados,
        "provas_registradas": provas_importadas,
        "arquivo": arquivo.name
    }

def enviar_avisos_prova(historico_prova):
    """
    Envia um aviso (e-mail/notificação) ao aluno sobre o resultado
    da prova registrada em HistoricoProva.
    """
    aluno = historico_prova.aluno
    # TODO: integrar com envio real de e-mail/notificação
    print(f"Aviso enviado para {aluno.email}: nota {historico_prova.nota}")