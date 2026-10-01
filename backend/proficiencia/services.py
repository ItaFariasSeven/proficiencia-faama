# notificacoes/services.py

from decimal import Decimal
from django.db import transaction
from alunos.models import Aluno
from .models import HistoricoProva, ImportacaoPlanilha
from .parsers.moodle import ler_planilha_moodle





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


@transaction.atomic
def importar_planilha_moodle(caminho_arquivo, disciplina, semestre_prova):
    """
    Processa a planilha do Moodle e cria/atualiza os registros.

    @transaction.atomic garante que, se der erro no meio do processo,
    NADA é salvo (evita importação "pela metade").
    """
    registro_importacao = ImportacaoPlanilha.objects.create(
        origem="MOODLE",
        nome_arquivo=caminho_arquivo.name,
        semestre_referencia=semestre_prova,
    )

    dados_alunos = ler_planilha_moodle(caminho_arquivo)

    resumo = {"novos": 0, "atualizados": 0, "erros": []}

    for dado in dados_alunos:
        try:
            aluno, foi_criado = buscar_ou_criar_aluno(
                nome=dado["nome_completo"],
                email=dado["email"],
            )

            HistoricoProva.objects.update_or_create(
                aluno=aluno,
                disciplina=disciplina,
                semestre_prova=semestre_prova,
                defaults={
                    "nota": Decimal(str(dado["nota"])),
                    "importacao": registro_importacao,
                    "origem_dados": "MOODLE",
                }
            )

            resumo["novos" if foi_criado else "atualizados"] += 1

        except Exception as erro:
            resumo["erros"].append({"aluno": dado["email"], "erro": str(erro)})

    return resumo