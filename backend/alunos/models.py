from django.db import models

# Create your models here.
class Aluno(models.Model):
    ra = models.CharField(max_length=20, unique=True, null=True, blank=True, db_index=True)
    nome = models.CharField(max_length=200)
    email = models.EmailField(unique=True, db_index=True)

    aprovado_geral = models.BooleanField(default=False)
    data_aprovacao_geral = models.DateField(null=True, blank=True)

    nota_matematica = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    nota_portugues = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["nome"]

    def __str__(self):
        return f"{self.nome} ({self.email})"