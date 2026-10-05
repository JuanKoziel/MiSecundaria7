"""Garantiza la existencia de los estados de asistencia base del sistema.

El registro de asistencias (de alumnos y de docentes) resuelve el estado por
NOMBRE EXACTO — la lógica está cableada en `views.py` y no acepta cualquier
texto. Si falta alguno de esos cinco nombres, el registro falla con:

    400 "Estado de asistencia <nombre> no encontrado."

Estos estados son catálogo del sistema, no datos de negocio, así que se crean
con un seed idempotente en lugar de depender de un INSERT SQL manual.

Uso:
    python manage.py seed_estados_asistencia

Es idempotente: se puede ejecutar tantas veces como haga falta. No duplica
los estados que ya existen ni modifica los que ya estaban cargados. Además,
la migración ``0008_seed_estados_asistencia`` ejecuta el mismo helper, de modo
que un `migrate` normal también garantiza su existencia.
"""

from django.core.management.base import BaseCommand

from escuela.utils import (
    ESTADOS_ASISTENCIA_BASE,
    seed_estados_asistencia_base,
)


class Command(BaseCommand):
    help = (
        'Crea idempotentemente los estados de asistencia base '
        '(Presente, Ausente, Tarde, Retirado, Justificado).'
    )

    def handle(self, *args, **options):
        self.stdout.write('Verificando estados de asistencia base...\n')

        existentes_antes = self._nombres_existentes()
        creados = seed_estados_asistencia_base()

        faltan = [n for n in ESTADOS_ASISTENCIA_BASE if n not in self._nombres_existentes()]
        if faltan:
            self.stderr.write(
                self.style.ERROR(
                    'No se pudieron crear los estados: %s. '
                    '¿La tabla `estados_asistencia` existe?' % ', '.join(faltan)
                )
            )
            return

        if creados:
            self.stdout.write(self.style.SUCCESS(
                '  Estados de asistencia creados: %s' % ', '.join(creados)
            ))
        else:
            self.stdout.write('  No hizo falta crear nada: ya existían todos.')

        self.stdout.write('\nEstados de asistencia base (total %d):' % len(existentes_antes))
        for nombre in ESTADOS_ASISTENCIA_BASE:
            self.stdout.write('  - %s' % nombre)
        self.stdout.write(self.style.SUCCESS('\nListo.'))

    def _nombres_existentes(self):
        from escuela.models import EstadoAsistencia

        try:
            return set(
                EstadoAsistencia.objects.values_list('nombre_estado', flat=True),
            )
        except Exception:
            # La tabla puede no existir todavía (base sin provisionar).
            return set()