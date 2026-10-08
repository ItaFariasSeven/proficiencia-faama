from rest_framework import serializers
from .models import ImportacaoPlanilha, HistoricoProva


class ImportacaoPlanilhaSerializer(serializers.ModelSerializer):
    origem_display = serializers.CharField(source="get_origem_display", read_only=True)

    class Meta:
        model = ImportacaoPlanilha
        fields = [
            "id", "origem", "origem_display", "nome_arquivo",
            "semestre_referencia", "importado_em",
        ]
        read_only_fields = ["importado_em"]


class HistoricoProvaSerializer(serializers.ModelSerializer):
    aluno_nome = serializers.CharField(source="aluno.nome", read_only=True)
    disciplina_display = serializers.CharField(source="get_disciplina_display", read_only=True)
    origem_dados_display = serializers.CharField(source="get_origem_dados_display", read_only=True)
    status = serializers.CharField(source="status_disciplina", read_only=True)

    class Meta:
        model = HistoricoProva
        fields = [
            "id", "aluno", "aluno_nome", "matricula", "importacao",
            "disciplina", "disciplina_display", "semestre_prova", "nota",
            "status", "origem_dados", "origem_dados_display", "criado_em",
        ]
        read_only_fields = ["criado_em"]


class UploadPlanilhaSerializer(serializers.Serializer):
    """Serializer só para validar o payload do upload (não é um ModelSerializer)."""
    arquivo = serializers.FileField()
    disciplina = serializers.ChoiceField(choices=HistoricoProva.DISCIPLINA_CHOICES)
    semestre = serializers.CharField(max_length=10)