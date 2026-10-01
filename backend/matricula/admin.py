from django.contrib import admin
from .models import MatriculaSemestre

# Register your models here.
@admin.register(MatriculaSemestre)
class ImportacaoAdmin(MatriculaSemestre):
    list_display = ("aluno", "curso", "semestre_referencia", "periodo_no_semestre", "turno", "percentual_curso")
    search_fields = ("aluno", "curso", "semestre_referencia", "periodo_no_semestre", "turno", "percentual_curso")