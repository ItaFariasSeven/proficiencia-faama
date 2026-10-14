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

    curso_nome = serializers.SerializerMethodField()
    percentual_curso = serializers.SerializerMethodField()

    class Meta:
        model = Aluno
        fields = [
            "id", "ra", "nome", "email", "aprovado_geral",'nota_matematica', 'nota_portugues',
            "data_aprovacao_geral", "criado_em", "atualizado_em",
            "curso_nome", "percentual_curso"
        ]
        read_only_fields = ["criado_em", "atualizado_em"]

    def get_curso_nome(self, obj):
        # Pega a matrícula mais recente do aluno
        ultima_matricula = obj.matriculas.order_by('-semestre_referencia').first()
        if ultima_matricula and ultima_matricula.curso:
            return ultima_matricula.curso.nome
        return "-"

    # FUNÇÃO QUE BUSCA A PORCENTAGEM NA TABELA DE MATRÍCULA
    def get_percentual_curso(self, obj):
        ultima_matricula = obj.matriculas.order_by('-semestre_referencia').first()
        if ultima_matricula and ultima_matricula.percentual_curso:
            return ultima_matricula.percentual_curso
        return 0


class AlunoDetalheSerializer(AlunoSerializer):
    """Usado em retrieve: inclui histórico de provas."""
    historico_provas = HistoricoProvaSerializer(many=True, read_only=True)

    class Meta(AlunoSerializer.Meta):
        fields = AlunoSerializer.Meta.fields + ["historico_provas"]