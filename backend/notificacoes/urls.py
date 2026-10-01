from django.urls import path
from . import views

urlpatterns = [
    path("disparar-avisos/", views.disparar_avisos, name="disparar_avisos"),
]