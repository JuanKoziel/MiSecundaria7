from django.db import models, transaction
from django.utils import timezone

from escuela.models import Usuario


def aplicar_programaciones_usuario(now=None):
    now = now or timezone.now()

    usuarios = Usuario.objects.filter(
        models.Q(
            estado=True,
            fecha_deshabilitacion_programada__isnull=False,
            fecha_deshabilitacion_programada__lte=now,
        )
        | models.Q(
            estado=False,
            fecha_habilitacion_programada__isnull=False,
            fecha_habilitacion_programada__lte=now,
        )
    )

    with transaction.atomic():
        for usuario in usuarios:
            update_fields = []

            if usuario.estado and usuario.fecha_deshabilitacion_programada and usuario.fecha_deshabilitacion_programada <= now:
                usuario.estado = False
                usuario.fecha_deshabilitacion_programada = None
                update_fields.extend(['estado', 'fecha_deshabilitacion_programada'])

            if (not usuario.estado) and usuario.fecha_habilitacion_programada and usuario.fecha_habilitacion_programada <= now:
                usuario.estado = True
                usuario.fecha_habilitacion_programada = None
                update_fields.extend(['estado', 'fecha_habilitacion_programada'])

            if update_fields:
                usuario.save(update_fields=update_fields)

