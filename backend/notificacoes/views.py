from django.http import JsonResponse
from django.shortcuts import render

from .services import enviar_avisos_prova

# Create your views here.

def disparar_avisos(request):
    semestre = request.GET.get("semestre")  # ex: ?semestre=2026.2&turno=NOITE
    turno = request.GET.get("turno")

    if not semestre:
        return JsonResponse({"erro": "parâmetro 'semestre' é obrigatório"}, status=400)

    enviar_avisos_prova(semestre=semestre, turno=turno)
    return JsonResponse({"status": "enviado", "semestre": semestre, "turno": turno})