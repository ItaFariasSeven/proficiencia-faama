from django.shortcuts import render
from rest_framework import viewsets, filters
from .models import Curso
from .serializers import CursoSerializer

# Create your views here.
class CursoViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de Curso.
    GET /cursos/            -> listar (?search=nome)
    POST /cursos/           -> criar
    GET /cursos/{id}/       -> detalhar
    PUT/PATCH /cursos/{id}/ -> editar
    DELETE /cursos/{id}/    -> remover
    """
    queryset = Curso.objects.all()
    serializer_class = CursoSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["nome"]