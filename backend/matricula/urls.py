from django.urls import path
from . import views
from rest_framework.routers import DefaultRouter
from .views import MatriculaSemestreViewSet

app_name = "matricula"

router = DefaultRouter()
router.register(r"", MatriculaSemestreViewSet, basename="matricula")

urlpatterns = router.urls