from rest_framework import serializers
from .models import MatriculaSemestre
from alunos.models import Aluno
from cursos.models import Curso


class MatriculaSemestreSerializer(serializers.ModelSerializer):
    aluno_nome = serializers.CharField(source="aluno.nome", read_only=True)
    curso_nome = serializers.CharField(source="curso.nome", read_only=True, default=None)
    turno_display = serializers.CharField(source="get_turno_display", read_only=True)

    class Meta:
        model = MatriculaSemestre
        fields = [
            "id", "aluno", "aluno_nome", "curso", "curso_nome",
            "importacao", "semestre_referencia", "periodo_no_semestre",
            "turno", "turno_display", "percentual_curso", "criado_em",
        ]
        read_only_fields = ["percentual_curso", "criado_em"]

    def validate(self, dados):
        """Calcula o percentual_curso automaticamente antes de salvar."""
        curso = dados.get("curso") or getattr(self.instance, "curso", None)
        periodo = dados.get("periodo_no_semestre") or getattr(self.instance, "periodo_no_semestre", None)

        if curso and periodo:
            dados["percentual_curso"] = round((periodo / curso.duracao_periodos) * 100, 2)

        return dados