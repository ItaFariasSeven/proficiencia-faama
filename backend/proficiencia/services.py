# notificacoes/services.py
import re
import unicodedata
import pandas as pd
from decimal import Decimal
from django.db import IntegrityError, transaction
from difflib import SequenceMatcher
from alunos.models import Aluno
from cursos.models import Curso
from .models import HistoricoProva, ImportacaoPlanilha
from matricula.models import MatriculaSemestre
from django.db.models import Q


def comparar_semestres(a: str, b: str) -> int:
    """
    Compara semestres no formato 'AAAA.N'.
    Retorna -1 (a < b), 0 (a == b) ou 1 (a > b).
    """
    def to_tuple(s):
        try:
            ano, num = str(s).split('.')
            return (int(ano), int(num))
        except (ValueError, AttributeError):
            return (0, 0)

    ta, tb = to_tuple(a), to_tuple(b)
    if ta < tb:
        return -1
    if ta > tb:
        return 1
    return 0


def calcular_periodo(aluno, semestre_referencia: str, periodo_planilha=None) -> int:
    """
    Define o período do aluno para o semestre de referência.
    Prioridade:
      1. Período informado na planilha
      2. Cálculo pelo histórico do aluno
      3. Período 1 (novo aluno)
    """
    # 1. Se a planilha informou, usa ela
    if periodo_planilha is not None:
        return int(periodo_planilha)

    # 2. Aluno novo
    if not aluno or not aluno.pk:
        return 1

    ultima_matricula = aluno.matriculas.order_by('-semestre_referencia').first()
    if not ultima_matricula:
        return 1

    # 3. Mesmo semestre ou anterior ao último cadastrado
    if comparar_semestres(semestre_referencia, ultima_matricula.semestre_referencia) <= 0:
        return ultima_matricula.periodo_no_semestre

    # 4. Semestre posterior: avança se aprovado, senão repete
    if aluno.aprovado_geral:
        novo_periodo = ultima_matricula.periodo_no_semestre + 1
        if ultima_matricula.curso and ultima_matricula.curso.duracao_periodos:
            return min(novo_periodo, ultima_matricula.curso.duracao_periodos)
        return novo_periodo

    return ultima_matricula.periodo_no_semestre


def atualizar_status_aprovacao_geral(aluno, semestre_referencia):
    """
    Atualiza aprovado_geral baseado nas notas de matemática e português
    do semestre informado. Considera nota de corte 7.0.
    """
    NOTA_CORTE = 7.0

    provas = HistoricoProva.objects.filter(aluno=aluno, semestre_prova=semestre_referencia)
    notas = {p.disciplina: float(p.nota) for p in provas if p.nota is not None}

    aprovado_mat = notas.get('MATEMATICA', 0) >= NOTA_CORTE
    aprovado_port = notas.get('PORTUGUES', 0) >= NOTA_CORTE

    aluno.aprovado_geral = aprovado_mat and aprovado_port
    if aluno.aprovado_geral:
        aluno.data_aprovacao_geral = semestre_referencia
    aluno.save(update_fields=['aprovado_geral', 'data_aprovacao_geral'])


def classificar_aluno(dados_planilha):
    nome = dados_planilha['nome']
    email = dados_planilha['email']
    ra = dados_planilha['ra']

    # 1. Nome exato (sem diferenciar maiúsculas/minúsculas)
    alunos_nome = Aluno.objects.filter(nome__iexact=nome)
    if alunos_nome.count() == 1:
        aluno = alunos_nome.first()
        # Se RA ou e-mail também batem, vincula automaticamente
        if (ra and aluno.ra == ra) or (email and aluno.email == email):
            return {'acao': 'vincular', 'aluno_existente': aluno, 'candidatos': [], 'dados_planilha': dados_planilha}
        # Só o nome bate: pede conferência (pode ser homônimo)
        return {'acao': 'conferir', 'aluno_existente': aluno, 'candidatos': [aluno], 'dados_planilha': dados_planilha}

    # Mais de um aluno com o mesmo nome -> obriga conferir
    if alunos_nome.count() > 1:
        return {'acao': 'conferir', 'aluno_existente': None, 'candidatos': list(alunos_nome), 'dados_planilha': dados_planilha}

    # 2. Nome parecido (fuzzy)
    candidatos = []
    for aluno in buscar_candidatos_por_nome(nome, limite=10):
        score = similaridade_nomes(aluno.nome, nome)
        if score >= 0.85:
            candidatos.append((aluno, score))

    if candidatos:
        candidatos.sort(key=lambda x: x[1], reverse=True)
        return {
            'acao': 'conferir',
            'aluno_existente': None,
            'candidatos': [c[0] for c in candidatos],
            'dados_planilha': dados_planilha
        }

    # 3. RA exato (fallback)
    if ra:
        aluno = Aluno.objects.filter(ra=ra).first()
        if aluno:
            return {'acao': 'vincular', 'aluno_existente': aluno, 'candidatos': [], 'dados_planilha': dados_planilha}

    # 4. E-mail exato (fallback)
    if email:
        aluno = Aluno.objects.filter(email=email).first()
        if aluno:
            return {'acao': 'vincular', 'aluno_existente': aluno, 'candidatos': [], 'dados_planilha': dados_planilha}

    # 5. Não encontrou nada -> novo aluno
    return {'acao': 'criar', 'aluno_existente': None, 'candidatos': [], 'dados_planilha': dados_planilha}




def normalizar_nome(nome: str) -> str:
    """
    Padroniza o nome para comparação: maiúsculas, sem acentos,
    sem pontuação e sem espaços duplos.
    """
    nome = str(nome or '').strip().upper()
    # Remove acentos
    nome = ''.join(
        c for c in unicodedata.normalize('NFD', nome)
        if unicodedata.category(c) != 'Mn'
    )
    # Remove pontuação comum em nomes (hífen, apóstrofo)
    nome = re.sub(r"[^\w\s]", " ", nome)
    # Remove espaços duplos
    nome = re.sub(r"\s+", " ", nome).strip()
    return nome


def similaridade_nomes(a: str, b: str) -> float:
    """Retorna um valor entre 0 e 1 indicando quão parecidos são os nomes."""
    return SequenceMatcher(None, normalizar_nome(a), normalizar_nome(b)).ratio()


def buscar_candidatos_por_nome(nome: str, limite=5):
    """Busca alunos cujo nome normalizado contenha as mesmas palavras-chave."""
    nome_norm = normalizar_nome(nome)
    palavras = [p for p in nome_norm.split(' ') if len(p) > 2]

    if not palavras:
        return Aluno.objects.none()

    # Usa Q para fazer OR entre as palavras
    filtro = Q()
    for palavra in palavras:
        filtro |= Q(nome__icontains=palavra)

    return Aluno.objects.filter(filtro)[:limite]



def parsear_planilha_preview(arquivo):
    """
    Lê o Excel e retorna um preview com a classificação de cada linha.
    Não salva nada no banco.
    """
    df = pd.read_excel(arquivo)
    df.columns = df.columns.str.strip().str.upper()

    preview = []

    for _, row in df.iterrows():
        email = str(row.get('EMAIL', '')).strip()
        if email.lower() == 'nan':
            email =''

        nome = str(row.get('NOME', '')).strip()
        if not nome or nome.lower() == 'nan':
            continue

        ra_bruto = row.get('RA')
        if pd.isna(ra_bruto) or str(ra_bruto).strip().lower() == 'nan' or str(ra_bruto).strip() == '':
            ra = None
        else:
            ra = str(ra_bruto).replace('.0', '').strip()

        nome_curso = str(row.get('CURSO', '')).strip()
        semestre_ref = str(row.get('SEMESTRE_REFERENCIA', '')).strip()
        turno_bruto = row.get('TURNO')
        periodo = row.get('PERIODO_CURSO')

        dados_planilha = {
            'nome': nome,
            'email': email,
            'ra': ra,
            'curso': nome_curso,
            'semestre_referencia': semestre_ref,
            'turno': str(turno_bruto).strip().upper() if pd.notna(turno_bruto) else 'MANHA',
            'periodo': int(float(periodo)) if pd.notna(periodo) else None,
            'nota_matematica': str(row.get('NOTA_MATEMATICA', '')).strip().replace(',', '.'),
            'nota_portugues': str(row.get('NOTA_PORTUGUES', '')).strip().replace(',', '.'),
        }

        classificacao = classificar_aluno(dados_planilha)
        preview.append(classificacao)

    return preview


def salvar_importacao_confirmada(itens, arquivo_name):
    """
    Recebe os itens já revisados pelo frontend e salva no banco.
    cada item deve conter:
      - dados_planilha
      - acao: 'criar' ou 'vincular'
      - aluno_id (apenas quando acao='vincular')
    """
    importacao = ImportacaoPlanilha.objects.create(
        origem="PADRAO",
        nome_arquivo=arquivo_name,
        semestre_referencia="MULTIPLOS"
    )

    resumo = {"alunos_novos": 0, "provas_registradas": 0, "erros": 0, "vinculados": 0}

    with transaction.atomic():
        for item in itens:
            try:
                dados = item['dados_planilha']
                acao = item['acao']

                if acao == 'vincular':
                    aluno = Aluno.objects.get(id=item['aluno_id'])
                    resumo['vinculados'] += 1
                else:
                    aluno = Aluno.objects.create(
                        nome=dados['nome'],
                        email=dados['email'],
                        ra=dados['ra']
                    )
                    resumo['alunos_novos'] += 1

                # Atualiza RA/email se a planilha tiver dados mais recentes
                if dados['ra'] and aluno.ra != dados['ra']:
                    aluno.ra = dados['ra']
                if dados['email'] and aluno.email != dados['email']:
                    aluno.email = dados['email']
                aluno.save()

                # Curso
                curso = None
                if dados['curso'] and dados['curso'].lower() != 'nan':
                    curso, _ = Curso.objects.get_or_create(
                        nome=dados['curso'],
                        defaults={'duracao_periodos': 8}
                    )

                # Calcula o período (planilha ou histórico)
                periodo = calcular_periodo(aluno, dados['semestre_referencia'], dados.get('periodo'))

                # Calcula percentual do curso
                percentual = 0
                if curso and curso.duracao_periodos:
                    percentual = round((periodo / curso.duracao_periodos) * 100, 2)

                matricula, _ = MatriculaSemestre.objects.update_or_create(
                    aluno=aluno,
                    semestre_referencia=dados['semestre_referencia'],
                    defaults={
                        'curso': curso,
                        'turno': dados['turno'],
                        'periodo_no_semestre': periodo,
                        'percentual_curso': percentual,
                        'importacao': importacao,
                    }
                )

                # Notas
                for campo, disciplina in [
                    ('nota_matematica', 'MATEMATICA'),
                    ('nota_portugues', 'PORTUGUES')
                ]:
                    nota_str = dados[campo]
                    if nota_str and nota_str.lower() != 'nan':
                        try:
                            nota = float(nota_str)
                            HistoricoProva.objects.update_or_create(
                                aluno=aluno,
                                disciplina=disciplina,
                                semestre_prova=dados['semestre_referencia'],
                                defaults={
                                    'nota': nota,
                                    'matricula': matricula,
                                    'origem_dados': 'PLANILHA',
                                    'importacao': importacao,
                                }
                            )
                            resumo['provas_registradas'] += 1
                        except ValueError:
                            resumo['erros'] += 1

            # Atualiza status geral do aluno com base nas notas importadas
            
                atualizar_status_aprovacao_geral(aluno, dados['semestre_referencia'])
            except Exception as e:
                print(f"Erro ao processar item {item}: {e}")
                resumo['erros'] += 1

            return resumo

def enviar_avisos_prova(historico_prova):
    """
    Envia um aviso (e-mail/notificação) ao aluno sobre o resultado
    da prova registrada em HistoricoProva.
    """
    aluno = historico_prova.aluno
    # TODO: integrar com envio real de e-mail/notificação
    print(f"Aviso enviado para {aluno.email}: nota {historico_prova.nota}")