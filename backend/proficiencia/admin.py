from django.contrib import admin
from .models import ImportacaoPlanilha, HistoricoProva

# Register your models here.

@admin.register(ImportacaoPlanilha)
class ImportacaoAdmin(ImportacaoPlanilha):
    list_display = ("origem", "semestre_referencia", "importado_em")
    search_fields = ("origem", "semestre_referencia")


@admin.register(HistoricoProva)
class HistoricoAdmin(HistoricoProva):
    list_display = ("aluno", "matricula", "disciplina", "semestre_prova", "nota")
    search_fields = ("aluno", "matricula", "disciplina", "semestre_prova", "nota")