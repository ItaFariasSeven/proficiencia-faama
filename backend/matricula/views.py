from django.shortcuts import render
from rest_framework import viewsets, filters
from .models import MatriculaSemestre
from .serializers import MatriculaSemestreSerializer

# Create your views here.
class MatriculaSemestreViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de Matrícula por semestre.

    GET /matricula/                        -> listar
    GET /matricula/?semestre_referencia=2026.1  -> filtra por semestre
    GET /matricula/?aluno=5                -> filtra por id do aluno
    POST /matricula/                       -> criar (percentual calculado automático)
    GET /matricula/{id}/                   -> detalhar
    PUT/PATCH /matricula/{id}/             -> editar
    DELETE /matricula/{id}/                -> remover
    """
    queryset = MatriculaSemestre.objects.select_related("aluno", "curso").all()
    serializer_class = MatriculaSemestreSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["aluno__nome", "aluno__email"]

    def get_queryset(self):
        qs = super().get_queryset()
        semestre = self.request.query_params.get("semestre_referencia")
        aluno_id = self.request.query_params.get("aluno")
        turno = self.request.query_params.get("turno")

        if semestre:
            qs = qs.filter(semestre_referencia=semestre)
        if aluno_id:
            qs = qs.filter(aluno_id=aluno_id)
        if turno:
            qs = qs.filter(turno=turno.upper())

        return qs