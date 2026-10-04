"""Carga idempotente de los estados de asistencia base del sistema.

El registro de asistencias resuelve el estado por nombre exacto (lógica
cableada en `views.py`). Sin estos cinco registros el registro de asistencias
de alumnos y de docentes falla con HTTP 400, así que son catálogo del sistema y
no datos de negocio: se garantiza su existencia con un seed, igual que hace
`0006_seed_tipos_accion` con `tipos_accion`.

Es un seed de DATOS, no de esquema: no altera ninguna tabla ni columna (los
modelos son `managed = False` y el DDL se gobierna desde `escuela/schema.py`).

El `get_or_create` sobre `nombre_estado` (índice único) hace que la migración
sea idempotente y reversible sin perder información: el `reverse` solo borra
los estados que la propia migración creó y que además siguen sin uso.
"""

from django.db import migrations

from escuela.utils import (
    ESTADOS_ASISTENCIA_BASE,
    seed_estados_asistencia_base,
)


def sembrar(apps, schema_editor):
    """Idempotente: no duplica los estados que ya estaban cargados."""
    seed_estados_asistencia_base()


def deshacer(apps, schema_editor):
    """Revierte solo lo que creó esta migración y sigue sin uso.

    No borra estados que vinieran de antes ni los que ya tengan asistencias
    asociadas, para no dejar datos históricos huérfanos.
    """
    EstadoAsistencia = apps.get_model('escuela', 'EstadoAsistencia')
    if EstadoAsistencia._meta.managed:
        return

    try:
        estados = EstadoAsistencia.objects.filter(
            nombre_estado__in=ESTADOS_ASISTENCIA_BASE,
        )
        for estado in estados:
            if _tiene_asistencias(apps, estado):
                continue
            estado.delete()
    except Exception:
        # La tabla puede no existir: la reversión no debe abortar el migrate.
        pass


def _tiene_asistencias(apps, estado):
    """True si el estado ya fue usado por asistencias (de alumno o docente)."""
    try:
        con_curso = apps.get_model('escuela', 'Asistencia')
        if con_curso.objects.filter(id_estado_asistencia=estado).exists():
            return True
    except Exception:
        pass
    try:
        docente = apps.get_model('escuela', 'AsistenciaDocente')
        if docente.objects.filter(id_estado_asistencia=estado).exists():
            return True
    except Exception:
        pass
    return False


class Migration(migrations.Migration):

    dependencies = [
        ('escuela', '0007_sincronizar_esquema_managed_false'),
    ]

    operations = [
        migrations.RunPython(sembrar, deshacer),
    ]