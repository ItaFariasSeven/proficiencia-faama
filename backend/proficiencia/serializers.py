from rest_framework import serializers

from .models import Aluno
from .models import ImportacaoPlanilha, HistoricoProva
from matricula.models import MatriculaSemestre


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
    aluno_email = serializers.CharField(source="aluno.email", read_only=True)
    aluno_ra = serializers.CharField(source="aluno.ra", read_only=True)
    curso_nome = serializers.CharField(source="matricula.curso.nome", read_only=True, default="-")
    percentual_curso = serializers.DecimalField(source="matricula.percentual_curso", max_digits=5, decimal_places=2, read_only=True, default=0)

    disciplina_display = serializers.CharField(source="get_disciplina_display", read_only=True)
    origem_dados_display = serializers.CharField(source="get_origem_dados_display", read_only=True)
    status = serializers.CharField(source="status_disciplina", read_only=True)

    class Meta:
        model = HistoricoProva
        fields = [
            "id", "aluno","aluno_ra", "aluno_nome", "aluno_email", "matricula", "importacao",
            "curso_nome", "percentual_curso",
            "disciplina", "disciplina_display", "semestre_prova", "nota",
            "status", "origem_dados", "origem_dados_display", "criado_em",
        ]
        read_only_fields = [
            "criado_em", "aluno", "matricula", "importacao",
            "disciplina", "origem_dados"
        ]


class UploadPlanilhaSerializer(serializers.Serializer):
    """Serializer só para validar o payload do upload da Planilha Padrão."""
    arquivo = serializers.FileField()

# class AlunoSerializer(serializers.ModelSerializer):
#     status = serializers.SerializerMethodField()
#     matricula_id = serializers.SerializerMethodField()
#     curso_id = serializers.SerializerMethodField()
#     curso_nome = serializers.SerializerMethodField()
#     curso = serializers.SerializerMethodField()
#     percentual_curso = serializers.SerializerMethodField()
#     periodo_no_semestre = serializers.SerializerMethodField()

#     class Meta:
#         model = Aluno
#         fields = [
#             'id', 'ra', 'nome', 'email',
#             'nota_matematica', 'nota_portugues',
#             'aprovado_geral', 'data_aprovacao_geral',
#             'status',
#             'matricula_id', 'curso_id', 'curso_nome', 'curso',
#             'percentual_curso', 'periodo_no_semestre',
#         ]

#     def get_status(self, obj):
#         return 'Aprovado' if obj.aprovado_geral else 'Reprovado'

#     def _ultima_matricula(self, obj):
#         if not hasattr(obj, '_cached_matricula'):
#             matriculas = list(obj.matriculas.all())
#             obj._cached_matricula = (
#                 max(matriculas, key=lambda m: m.semestre_referencia or '')
#                 if matriculas else None
#             )
#         return obj._cached_matricula

#     def get_matricula_id(self, obj):
#         m = self._ultima_matricula(obj)
#         return m.id if m else None

#     def get_curso_id(self, obj):
#         m = self._ultima_matricula(obj)
#         return m.curso.id if m and m.curso else ''

#     def get_curso_nome(self, obj):
#         m = self._ultima_matricula(obj)
#         return m.curso.nome if m and m.curso else '-'

#     def get_curso(self, obj):
#         return self.get_curso_nome(obj)

#     def get_percentual_curso(self, obj):
#         m = self._ultima_matricula(obj)
#         return m.percentual_curso if m else 0

#     def get_periodo_no_semestre(self, obj):
#         m = self._ultima_matricula(obj)
#         return m.periodo_no_semestre if m else ''