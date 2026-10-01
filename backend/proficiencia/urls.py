# notificações/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("upload-moodle/", views.upload_planilha_moodle, name="upload_planilha_moodle"),
]