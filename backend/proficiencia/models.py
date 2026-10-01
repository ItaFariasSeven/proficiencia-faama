from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

from alunos.models import Aluno

# Create your models here.
class ImportacaoPlanilha(models.Model):
    ORIGEM_CHOICES = [
        ("MOODLE", "Moodle"),
        ("TOTVS", "TOTVS"),
        ("HISTORICO", "Planilha histórica (migração)"),
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
        ("MOODLE", "Moodle"),
        ("MANUAL", "Manual"),
        ("HISTORICO_ANTIGO", "Histórico antigo (sem % calculado)"),
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

    def __str__(self):
        return f"{self.aluno.nome} - {self.disciplina} - {self.semestre_prova}"

    @property
    def status_disciplina(self):
        return "Aprovado" if self.nota >= 7 else "Reprovado"