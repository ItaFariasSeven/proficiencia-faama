import pandas as pd


def ler_planilha_moodle(caminho_arquivo):
    df = pd.read_excel(caminho_arquivo)

    # Remove a linha de "Média geral" (não é um aluno real)
    df = df[df["Sobrenome"] != "Média geral"]

    # Remove linhas totalmente vazias, por garantia
    df = df.dropna(subset=["Endereço de e-mail"])

    alunos = []
    for _, linha in df.iterrows():
        nota_bruta = str(linha["Nota/10,00"]).replace(",", ".")

        alunos.append({
            "nome_completo": f"{linha['Nome']} {linha['Sobrenome']}".strip(),
            "email": str(linha["Endereço de e-mail"]).strip().lower(),
            "nota": float(nota_bruta),
        })

    return alunos