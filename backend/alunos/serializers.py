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
    # email = serializers.EmailField(
    #     validators=[UniqueValidator(
    #         queryset=Aluno.objects.all(),
    #         message="Já existe um aluno com esse e-mail."
    #     )]
    # )

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

    def validate_email(self, value):
        qs = Aluno.objects.filter(email=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Já existe um aluno com esse e-mail.")
        return value

    def _ultima_matricula(self, obj):
        if not hasattr(obj, '_cached_matricula'):
            matriculas = list(obj.matriculas.all())
            obj._cached_matricula = (
                max(matriculas, key=lambda m: m.semestre_referencia or '')
                if matriculas else None
            )
        return obj._cached_matricula

    def get_curso_nome(self, obj):
        m = self._ultima_matricula(obj)
        return m.curso.nome if m and m.curso else '-'

    def get_percentual_curso(self, obj):
        m = self._ultima_matricula(obj)
        return m.percentual_curso if m else 0


class AlunoDetalheSerializer(AlunoSerializer):
    """Usado em retrieve: inclui histórico de provas."""
    historico_provas = HistoricoProvaSerializer(source='historico_provas.all', many=True, read_only=True)

    class Meta(AlunoSerializer.Meta):
        fields = AlunoSerializer.Meta.fields + ["historico_provas"]