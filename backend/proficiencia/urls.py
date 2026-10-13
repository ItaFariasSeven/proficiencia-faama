# notificações/urls.py
from django.urls import path
from . import views
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ImportacaoPlanilhaViewSet, HistoricoProvaViewSet, UploadPlanilhaView

router = DefaultRouter()
router.register(r"importacoes", ImportacaoPlanilhaViewSet, basename="importacao")
router.register(r"historico", HistoricoProvaViewSet, basename="historico-prova")

urlpatterns = [
    path("upload-planilha/", UploadPlanilhaView.as_view(), name="upload_moodle"),
    path("", include(router.urls)),
]