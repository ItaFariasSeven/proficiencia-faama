# notificações/urls.py
from django.urls import path
from . import views
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ImportacaoPlanilhaViewSet, HistoricoProvaViewSet, UploadPlanilhaMoodleView

router = DefaultRouter()
router.register(r"importacoes", ImportacaoPlanilhaViewSet, basename="importacao")
router.register(r"historico", HistoricoProvaViewSet, basename="historico-prova")

urlpatterns = [
    path("upload-planilha-moodle/", UploadPlanilhaMoodleView.as_view(), name="upload_planilha_moodle"),
    path("", include(router.urls)),
]