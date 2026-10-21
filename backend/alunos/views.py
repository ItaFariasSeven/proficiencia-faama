from django.shortcuts import render
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.views.generic import UpdateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy

from .models import Aluno
from proficiencia.models import HistoricoProva
from .serializers import AlunoSerializer, AlunoDetalheSerializer, HistoricoProvaSerializer

# Create your views here.

class AlunoViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de Aluno + ação extra de histórico de provas.

    Endpoints gerados automaticamente:
      GET    /alunos/              -> listar (com filtros)
      POST   /alunos/              -> criar
      GET    /alunos/{id}/         -> detalhar (com histórico)
      PUT    /alunos/{id}/         -> editar completo
      PATCH  /alunos/{id}/         -> editar parcial
      DELETE /alunos/{id}/         -> remover
      GET    /alunos/{id}/historico/ -> apenas histórico de provas
    """
    queryset = Aluno.objects.prefetch_related('matriculas__curso').all()
    serializer_class = AlunoSerializer

    filter_backends = [filters.SearchFilter]
    search_fields = ["nome", "email", "ra"]  # ?search=termo busca em ambos

    def get_serializer_class(self):
        if self.action == "retrieve":
            return AlunoDetalheSerializer
        return AlunoSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        status_param = self.request.query_params.get('status')
        curso_param = self.request.query_params.get('curso')
        semestre_param = self.request.query_params.get('semestre')

        if status_param:
            if status_param.lower() == 'aprovado':
                qs = qs.filter(aprovado_geral=True)
            elif status_param.lower() == 'reprovado':
                qs = qs.filter(aprovado_geral=False)
                
        # Cruza com as matrículas para filtrar curso e semestre
        if curso_param:
            qs = qs.filter(matriculas__curso__nome__icontains=curso_param).distinct()
            
        if semestre_param:
            qs = qs.filter(matriculas__semestre_referencia=semestre_param).distinct()
            
        return qs

    @action(detail=True, methods=["get"])
    def historico(self, request, pk=None):
        aluno = self.get_object()
        provas = aluno.historico_provas.all()
        from .serializers import HistoricoProvaSerializer
        serializer = HistoricoProvaSerializer(provas, many=True)
        return Response(
            {"aluno": aluno.nome, "total": provas.count(), "provas": serializer.data},
            status=status.HTTP_200_OK,
        )


class AlunoUpdateView(LoginRequiredMixin ,UpdateView):
    model = Aluno
    fields = ['ra', 'nome', 'email', 'nota_matematica', 'nota_portugues']
    template_name = 'GeneralTable.jsx'
    success_url = reverse_lazy('visaogeral')