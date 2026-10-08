from django.urls import path
from . import views
from rest_framework.routers import DefaultRouter
from .views import CursoViewSet

app_name = "cursos"

router = DefaultRouter()
router.register(r"", CursoViewSet, basename="curso")

urlpatterns = router.urls