from django.http import JsonResponse
from django.shortcuts import render
from .services import enviar_avisos_prova
import pandas as pd


# Create your views here.


from django.http import JsonResponse
from .services import importar_planilha_moodle

def upload_planilha_moodle(request):
    if request.method == "POST" and request.FILES.get("arquivo"):
        arquivo = request.FILES["arquivo"]
        disciplina = request.POST.get("disciplina")
        semestre = request.POST.get("semestre")
        resumo = importar_planilha_moodle(arquivo, disciplina, semestre)
        return JsonResponse(resumo)
    return JsonResponse({"erro": "método ou arquivo inválido"}, status=400)