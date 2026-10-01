from django.db import models

from alunos.models import Aluno
from cursos.models import Curso
from proficiencia.models import ImportacaoPlanilha

# Create your models here.
class MatriculaSemestre(models.Model):
    TURNO_CHOICES = [
        ("MANHA", "Manhã"),
        ("TARDE", "Tarde"),
        ("NOITE", "Noite"),
    ]

    aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE, related_name="matriculas")
    curso = models.ForeignKey(Curso, on_delete=models.SET_NULL, null=True, blank=True)
    importacao = models.ForeignKey(ImportacaoPlanilha, on_delete=models.SET_NULL, null=True, blank=True)

    semestre_referencia = models.CharField(max_length=10, help_text="Ex: 2026.1")
    periodo_no_semestre = models.PositiveSmallIntegerField(
        help_text="Período do curso que o aluno cursava nesse semestre"
    )
    turno = models.CharField(max_length=10, choices=TURNO_CHOICES)

    percentual_curso = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="Calculado: periodo_no_semestre / curso.duracao_periodos"
    )

    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["aluno", "semestre_referencia"]
        constraints = [
            models.UniqueConstraint(
                fields=["aluno", "semestre_referencia"],
                name="unique_matricula_por_semestre"
            )
        ]

    def __str__(self):
        return f"{self.aluno.nome} - {self.semestre_referencia} - {self.get_turno_display()}"

    def calcular_percentual(self):
        if self.curso and self.curso.duracao_periodos:
            return round((self.periodo_no_semestre / self.curso.duracao_periodos) * 100, 2)
        return None