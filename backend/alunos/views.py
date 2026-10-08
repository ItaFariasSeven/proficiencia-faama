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
    queryset = Aluno.objects.all()
    serializer_class = AlunoSerializer

    filter_backends = [filters.SearchFilter]
    search_fields = ["nome", "email"]  # ?search=termo busca em ambos

    def get_serializer_class(self):
        if self.action == "retrieve":
            return AlunoDetalheSerializer
        return AlunoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get("status")
        if status_param:
            status_param = status_param.lower()
            if status_param == "aprovado":
                qs = qs.filter(aprovado_geral=True)
            elif status_param == "reprovado":
                qs = qs.filter(aprovado_geral=False)
        return qs

    # def perform_update(self, serializer):
    #     aluno = serializer.save()

    #     # Puxa os históricos usando a relação direta da sua model
    #     meus_historicos = aluno.historico_provas.all()

    #     # 1. Atualiza Matemática (busca por qualquer coisa que contenha 'matem')
    #     if getattr(aluno, 'nota_matematica', None) is not None:
    #         historicos_mat = meus_historicos.filter(disciplina__icontains='matem')
    #         if historicos_mat.exists():
    #             historicos_mat.update(nota=aluno.nota_matematica)

    #     # 2. Atualiza Português (busca por qualquer coisa que contenha 'portug')
    #     if getattr(aluno, 'nota_portugues', None) is not None:
    #         historicos_port = meus_historicos.filter(disciplina__icontains='portug')
    #         if historicos_port.exists():
    #             historicos_port.update(nota=aluno.nota_portugues)

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