from rest_framework import serializers
from .models import Curso


class CursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curso
        fields = ["id", "nome", "duracao_periodos"]