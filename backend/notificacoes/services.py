from django.core.mail import send_mail

from django.conf import settings
from matricula.models import MatriculaSemestre


def enviar_avisos_prova(semestre: str, turno: str | None = None):
    filtros = {"semestre_referencia": semestre}
    if turno:
        filtros["turno"] = turno

    matriculas = MatriculaSemestre.objects.filter(**filtros).select_related("aluno", "curso")

    for matricula in matriculas:
        send_mail(
            subject=f"Prova de Nivelamento - {matricula.curso.nome}",
            message=(
                f"Olá {matricula.aluno.nome},\n\n"
                f"Você está no turno {matricula.get_turno_display()} "
                f"e precisa realizar a prova de nivelamento.\n"
                f"Curso: {matricula.curso.nome}"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[matricula.aluno.email],
        )