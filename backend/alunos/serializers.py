from rest_framework import serializers
from .models import Aluno
from proficiencia.models import HistoricoProva
from rest_framework.validators import UniqueValidator


class HistoricoProvaSerializer(serializers.ModelSerializer):
    disciplina = serializers.CharField(source="get_disciplina_display", read_only=True)
    origem_dados = serializers.CharField(source="get_origem_dados_display", read_only=True)
    status = serializers.CharField(source="status_disciplina", read_only=True)

    class Meta:
        model = HistoricoProva
        fields = [
            "id", "disciplina", "semestre_prova", "nota",
            "status", "origem_dados", "criado_em",
        ]


class AlunoSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        validators=[UniqueValidator(
            queryset=Aluno.objects.all(),
            message="Já existe um aluno com esse e-mail."
        )]
    )

    class Meta:
        model = Aluno
        fields = [
            "id", "ra", "nome", "email", "aprovado_geral",'nota_matematica', 'nota_portugues',
            "data_aprovacao_geral", "criado_em", "atualizado_em",
        ]
        read_only_fields = ["criado_em", "atualizado_em"]


class AlunoDetalheSerializer(AlunoSerializer):
    """Usado em retrieve: inclui histórico de provas."""
    historico_provas = HistoricoProvaSerializer(many=True, read_only=True)

    class Meta(AlunoSerializer.Meta):
        fields = AlunoSerializer.Meta.fields + ["historico_provas"]