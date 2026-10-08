from django.urls import include, path
from . import views
from rest_framework.routers import DefaultRouter
from .views import AlunoViewSet, AlunoUpdateView

app_name = "alunos"

router = DefaultRouter()
router.register(r"", AlunoViewSet, basename="aluno"),

urlpatterns = [
    path('', include(router.urls)),
    path('<int:pk>/update/', AlunoUpdateView.as_view(), name='aluno-update'),
]