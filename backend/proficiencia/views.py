from django.http import JsonResponse
from django.shortcuts import render
from alunos.models import Aluno
from notificacoes.services import enviar_avisos_prova
import pandas as pd
from rest_framework import viewsets, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from rest_framework.decorators import api_view

from .models import ImportacaoPlanilha, HistoricoProva
from .serializers import (ImportacaoPlanilhaSerializer,HistoricoProvaSerializer,UploadPlanilhaSerializer,)
from .services import importar_planilha_padrao


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
    search_fields = ["aluno__nome", "aluno__email", "aluno__ra"]


    def get_queryset(self):
        qs = super().get_queryset()
        disciplina = self.request.query_params.get("disciplina")
        semestre = self.request.query_params.get("semestre_prova")
        aluno_id = self.request.query_params.get("aluno")

        status_param = self.request.query_params.get("status")
        curso_param = self.request.query_params.get("curso")

        if disciplina:
            qs = qs.filter(disciplina=disciplina.upper())
        if semestre:
            qs = qs.filter(semestre_prova=semestre)
        if aluno_id:
            qs = qs.filter(aluno_id=aluno_id)

        if status_param:
            if status_param.lower() == "aprovado":
                qs = qs.filter(nota__gte=7)
            elif status_param.lower() == "reprovado":
                qs = qs.filter(nota__lt=7)

        if curso_param:
            qs = qs.filter(matricula__curso__nome__icontains=curso_param)

        return qs   
        


class UploadPlanilhaView(APIView):
    """
    POST /proficiencia/upload-planilha/
    multipart/form-data: arquivo
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = UploadPlanilhaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Agora passamos apenas o arquivo. O Python descobre o resto lendo as colunas.
        resumo = importar_planilha_padrao(serializer.validated_data["arquivo"])
        
        return Response(resumo, status=status.HTTP_200_OK)


class AlunoListView(APIView):
    def get(self, request):
        # Aqui busca os alunos e formata os dados para o frontend
        alunos = Aluno.objects.all().values(
            'id', 'ra', 'nome', 'email', 'nota_matematica', 'nota_portugues', 'aprovado_geral'
        )
        
        # Formatar a resposta para casar exatamente com o que o React espera
        dados_formatados = []
        for aluno in alunos:
            dados_formatados.append({
                "id": aluno["id"],
                "ra": aluno["ra"],
                "nome": aluno["nome"],
                "email": aluno["email"],
                "notaMatematica": aluno["nota_matematica"] or "-",
                "notaPortugues": aluno["nota_portugues"] or "-",
                "status": "Aprovado" if aluno["aprovado_geral"] else "Reprovado",
                # Adicione os outros campos como 'curso' e 'percentualCurso' conforme sua lógica
            })
            
        return Response(dados_formatados)

@api_view(['GET'])
def listar_periodos(request):
    # Usamos o HistoricoProva, que já está importado lá no topo e não vai dar erro
    # Isso vai listar os semestres exatos de quem fez a prova
    periodos = HistoricoProva.objects.exclude(
        semestre_prova__isnull=True
    ).exclude(
        semestre_prova=""
    ).values_list('semestre_prova', flat=True).distinct().order_by('-semestre_prova')
    
    return Response(periodos)