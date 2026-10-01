from django.db import models

# Create your models here.
class Curso(models.Model):
    nome = models.CharField(max_length=100, unique=True)
    duracao_periodos = models.PositiveSmallIntegerField(
        help_text="Quantidade total de períodos/semestres do curso"
    )

    class Meta:
        ordering = ["nome"]

    def __str__(self):
        return self.nome