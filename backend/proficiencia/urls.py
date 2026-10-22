# notificações/urls.py
from django.urls import path
from . import views
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ImportacaoPlanilhaViewSet, HistoricoProvaViewSet, listar_periodos

router = DefaultRouter()
router.register(r"importacoes", ImportacaoPlanilhaViewSet, basename="importacao")
router.register(r"historico", HistoricoProvaViewSet, basename="historico-prova")

urlpatterns = [
    path('upload-planilha/', views.upload_planilha_preview, name='upload-planilha-preview'),
    path('confirmar-importacao/', views.confirmar_importacao, name='confirmar-importacao'),
    # path("alunos/", AlunoListView.as_view(), name="listar-alunos"),
    path("periodos/", listar_periodos, name="listar-periodos"),
    path("", include(router.urls)),
]