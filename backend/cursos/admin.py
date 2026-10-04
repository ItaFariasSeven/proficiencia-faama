from django.contrib import admin

from .models import Curso

# Register your models here.
@admin.register(Curso)
class ImportacaoAdmin(admin.ModelAdmin):
    list_display = ("nome", "duracao_periodos")
    search_fields = ("nome", "duracao_periodos")