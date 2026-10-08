from django.http import JsonResponse
from django.shortcuts import render
from notificacoes.services import enviar_avisos_prova
import pandas as pd
from rest_framework import viewsets, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from .models import ImportacaoPlanilha, HistoricoProva
from .serializers import (ImportacaoPlanilhaSerializer,HistoricoProvaSerializer,UploadPlanilhaSerializer,)
from .services import importar_planilha_moodle


# Create your views here.

class ImportacaoPlanilhaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Somente leitura — histórico de importações feitas.
    GET /proficiencia/importacoes/
    GET /proficiencia/importacoes/{id}/
    """
    queryset = ImportacaoPlanilha.objects.all()
    serializer_class = ImportacaoPlanilhaSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["nome_arquivo", "semestre_referencia"]


class HistoricoProvaViewSet(viewsets.ModelViewSet):
    """
    CRUD de notas (permite edição manual de notas também).
    GET /proficiencia/historico/?disciplina=MATEMATICA&semestre_prova=2026.1&aluno=5
    """
    queryset = HistoricoProva.objects.select_related("aluno", "importacao").all()
    serializer_class = HistoricoProvaSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["aluno__nome", "aluno__email"]

    def get_queryset(self):
        qs = super().get_queryset()
        disciplina = self.request.query_params.get("disciplina")
        semestre = self.request.query_params.get("semestre_prova")
        aluno_id = self.request.query_params.get("aluno")

        if disciplina:
            qs = qs.filter(disciplina=disciplina.upper())
        if semestre:
            qs = qs.filter(semestre_prova=semestre)
        if aluno_id:
            qs = qs.filter(aluno_id=aluno_id)

        return qs


class UploadPlanilhaMoodleView(APIView):
    """
    POST /proficiencia/upload-planilha-moodle/
    multipart/form-data: arquivo, disciplina, semestre
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = UploadPlanilhaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        resumo = importar_planilha_moodle(
            serializer.validated_data["arquivo"],
            serializer.validated_data["disciplina"],
            serializer.validated_data["semestre"],
        )
        return Response(resumo, status=status.HTTP_200_OK)