from django.http import JsonResponse
from django.shortcuts import render
from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from .models import ImportacaoPlanilha, HistoricoProva
from .serializers import ImportacaoPlanilhaSerializer, HistoricoProvaSerializer
from .services import parsear_planilha_preview, salvar_importacao_confirmada
from django.db.models import Q


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

        if curso_param:
            qs = qs.filter(matricula__curso__nome__icontains=curso_param)

        if status_param:
            sp = status_param.lower()
            # Regra de corte: até 2025.2 = 6.0 | a partir de 2026.1 = 7.0
            if sp == "aprovado":
                qs = qs.filter(
                    Q(semestre_prova__lte="2025.2", nota__gte=6) |
                    Q(semestre_prova__gte="2026.1", nota__gte=7)
                )
            elif sp == "reprovado":
                qs = qs.filter(
                    Q(semestre_prova__lte="2025.2", nota__lt=6) |
                    Q(semestre_prova__gte="2026.1", nota__lt=7)
                )

        return qs   

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


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_planilha_preview(request):
    """
    POST /proficiencia/upload-planilha/
    Recebe o arquivo Excel e retorna o preview para conferência.
    """
    arquivo = request.FILES.get('arquivo')
    if not arquivo:
        return Response({'erro': 'Nenhum arquivo enviado.'}, status=status.HTTP_400_BAD_REQUEST)

    preview = parsear_planilha_preview(arquivo)

    return Response({
        'arquivo_name': arquivo.name,
        'total': len(preview),
        'para_conferir': len([p for p in preview if p['acao'] == 'conferir']),
        'preview': [
            {
                'acao': p['acao'],
                'aluno_existente': {
                    'id': p['aluno_existente'].id,
                    'nome': p['aluno_existente'].nome,
                    'email': p['aluno_existente'].email,
                    'ra': p['aluno_existente'].ra,
                } if p['aluno_existente'] else None,
                'candidatos': [
                    {
                        'id': c.id,
                        'nome': c.nome,
                        'email': c.email,
                        'ra': c.ra,
                    }
                    for c in p['candidatos']
                ],
                'dados_planilha': p['dados_planilha'],
            }
            for p in preview
        ]
    })


@api_view(['POST'])
def confirmar_importacao(request):
    """
    POST /proficiencia/confirmar-importacao/
    Recebe a lista revisada pelo frontend e salva no banco.
    """
    itens = request.data.get('itens', [])
    arquivo_name = request.data.get('arquivo_name', 'planilha.xlsx')

    if not itens:
        return Response({'erro': 'Nenhum item para importar.'}, status=status.HTTP_400_BAD_REQUEST)

    resumo = salvar_importacao_confirmada(itens, arquivo_name)

    return Response({
        'status': 'sucesso',
        'resumo': resumo,
    })