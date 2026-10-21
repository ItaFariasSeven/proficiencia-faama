from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

from alunos.models import Aluno

# Create your models here.
class ImportacaoPlanilha(models.Model):
    ORIGEM_CHOICES = [
        ("PADRAO", "Planilha Padrão Unificada"),
    ]
    origem = models.CharField(max_length=20, choices=ORIGEM_CHOICES)
    nome_arquivo = models.CharField(max_length=255)
    semestre_referencia = models.CharField(max_length=10, help_text="Ex: 2026.1")
    importado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-importado_em"]

    def __str__(self):
        return f"{self.get_origem_display()} - {self.nome_arquivo}"


class HistoricoProva(models.Model):
    DISCIPLINA_CHOICES = [
        ("PORTUGUES", "Português"),
        ("MATEMATICA", "Matemática"),
    ]
    ORIGEM_DADOS_CHOICES = [
        ("PLANILHA", "Importação via Planilha"),
        ("MANUAL", "Manual"),
    ]

    aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE, related_name="historico_provas")
    matricula = models.ForeignKey(
        "matricula.MatriculaSemestre",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="provas",
        help_text="Snapshot acadêmico (curso/período/turno) daquele semestre",
    )
    importacao = models.ForeignKey(ImportacaoPlanilha, on_delete=models.SET_NULL, null=True, blank=True)

    disciplina = models.CharField(max_length=20, choices=DISCIPLINA_CHOICES)
    semestre_prova = models.CharField(max_length=10, help_text="Ex: 2026.1")

    nota = models.DecimalField(
        max_digits=4, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(10)]
    )

    origem_dados = models.CharField(max_length=20, choices=ORIGEM_DADOS_CHOICES)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["aluno", "semestre_prova"]
        constraints = [
            models.UniqueConstraint(
                fields=["aluno", "disciplina", "semestre_prova"],
                name="unique_prova_por_semestre"
            )
        ]

    def nota_de_corte(self):
        """
        Retorna a nota mínima de aprovação conforme o semestre da prova.
        Até 2025.2: 6.0 | A partir de 2026.1: 7.0
        """
        try:
            ano, semestre = map(int, self.semestre_prova.split("."))
        except (ValueError, AttributeError):
            return 7.0  # padrão seguro se o semestre vier mal formatado

        if (ano, semestre) <= (2025, 2):
            return 6.0
        return 7.0
    
    def save(self, *args, **kwargs):
        # 1. Salva a nova nota da prova primeiro na base de dados
        super().save(*args, **kwargs)

        # 2. Puxa o aluno associado a esta prova
        aluno = self.aluno

        # 3. Atualiza a nota global do aluno
        if self.disciplina == 'MATEMATICA':
            aluno.nota_matematica = self.nota
        elif self.disciplina == 'PORTUGUES':
            aluno.nota_portugues = self.nota

        # 4. Verifica aprovação geral usando a nota de corte de cada disciplina
        prova_mat = aluno.historico_provas.filter(
            disciplina="MATEMATICA"
        ).order_by("-semestre_prova").first()

        prova_port = aluno.historico_provas.filter(
            disciplina="PORTUGUES"
        ).order_by("-semestre_prova").first()

        if prova_mat and prova_port:
            mat_aprovado = prova_mat.nota >= prova_mat.nota_de_corte()
            port_aprovado = prova_port.nota >= prova_port.nota_de_corte()
            aluno.aprovado_geral = mat_aprovado and port_aprovado
        else:
            aluno.aprovado_geral = False

        # 5. Salva o aluno
        aluno.save()


    def __str__(self):
        return f"{self.aluno.nome} - {self.disciplina} - {self.semestre_prova}"

    @property
    def status_disciplina(self):
        return "Aprovado" if self.nota >= self.nota_de_corte() else "Reprovado"