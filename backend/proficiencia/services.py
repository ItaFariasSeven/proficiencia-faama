# notificacoes/services.py
import pandas as pd
from decimal import Decimal
from django.db import IntegrityError, transaction
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
    erros_integridade =0

    with transaction.atomic():
        for index, row in df.iterrows():
            email = str(row.get('EMAIL', '')).strip()
            if not email or email == 'nan':
                continue # Pula linhas sem e-mail

            nome = str(row.get('NOME', '')).strip()

            ra_bruto = row.get('RA')
            if pd.isna(ra_bruto) or str(ra_bruto).strip().lower() == 'nan' or str(ra_bruto).strip() == '':
                ra = None
            else:
                # Se for número no excel (ex: 81379.0), converte pra string e tira o decimal
                ra = str(ra_bruto).replace('.0', '').strip()

            # 1. Busca ou Cria o Aluno
            aluno = None
            try:
                # Este transaction.atomic interno cria um "Savepoint". 
                # Se der erro aqui dentro, ele anula só esse aluno e continua o loop!
                with transaction.atomic():
                    # Tenta buscar pelo RA primeiro (chave mais forte)
                    if ra:
                        aluno = Aluno.objects.filter(ra=ra).first()
                    
                    # Se não achou pelo RA, tenta pelo Email
                    if not aluno:
                        aluno = Aluno.objects.filter(email=email).first()

                    # Lógica de Criar ou Atualizar
                    if aluno:
                        atualizou = False
                        # Atualiza o RA se a planilha tiver um e no banco estiver vazio/diferente
                        if ra and aluno.ra != ra:
                            aluno.ra = ra
                            atualizou = True
                        # Atualiza o e-mail se a planilha tiver o email mais recente
                        if email and aluno.email != email:
                            aluno.email = email
                            atualizou = True
                        
                        if atualizou:
                            aluno.save()
                    else:
                        # Nao achou por RA nem por email, cria novo!
                        aluno = Aluno.objects.create(email=email, nome=nome, ra=ra)
                        alunos_criados += 1

            except IntegrityError as e:
                print(f"⚠️ Erro ao salvar aluno {nome} (RA: {ra}, Email: {email}): {e}")
                erros_integridade += 1
                continue # Pula para a próxima linha da planilha

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
            
            turno_bruto = row.get('TURNO')
            if pd.isna(turno_bruto) or str(turno_bruto).strip().lower() == 'nan' or str(turno_bruto).strip() == '':
                turno = 'MANHA' # Se vier vazio no Excel, joga MANHA (ou NOTURNO) como padrão
            else:
                turno = str(turno_bruto).strip().upper()
            periodo = row.get('PERIODO_CURSO')
            
            # Se periodo for vazio no excel, joga 1 como padrão
            if pd.isna(periodo) or str(periodo).strip().lower() == 'nan': 
                periodo = 1 
            else:
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
            nota_mat_str = str(row.get('NOTA_MATEMATICA', '')).strip().replace(',', '.')
            if nota_mat_str and nota_mat_str.lower() != 'nan':
                try:
                    nota_mat = float(nota_mat_str) # Tenta converter para número
                    HistoricoProva.objects.update_or_create(
                        aluno=aluno,
                        disciplina="MATEMATICA",
                        semestre_prova=semestre_ref,
                        defaults={
                            'nota': nota_mat,
                            'matricula': matricula,
                            'origem_dados': 'PLANILHA',
                            'importacao': importacao
                        }
                    )
                    provas_importadas += 1
                except ValueError:
                    print(f"⚠️ Nota de Matemática ignorada para {nome}: '{nota_mat_str}' não é um número válido.")

            nota_port_str = str(row.get('NOTA_PORTUGUES', '')).strip().replace(',', '.')
            if nota_port_str and nota_port_str.lower() != 'nan':
                try:
                    nota_port = float(nota_port_str) # Tenta converter para número
                    HistoricoProva.objects.update_or_create(
                        aluno=aluno,
                        disciplina="PORTUGUES",
                        semestre_prova=semestre_ref,
                        defaults={
                            'nota': nota_port,
                            'matricula': matricula,
                            'origem_dados': 'PLANILHA',
                            'importacao': importacao
                        }
                    )
                    provas_importadas += 1
                except ValueError:
                    print(f"⚠️ Nota de Português ignorada para {nome}: '{nota_port_str}' não é um número válido.")

    return {
        "status": "sucesso",
        "alunos_novos": alunos_criados,
        "provas_registradas": provas_importadas,
        "erros_pulados": erros_integridade,
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