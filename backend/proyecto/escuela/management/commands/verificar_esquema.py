"""`manage.py verificar_esquema` — detecta desvíos entre modelos y base física.

Los modelos de `escuela` son `managed=False`, por lo que `migrate` no crea ni
altera sus tablas: si el esquema físico no coincide con el mapeo, los
endpoints fallan con HTTP 500 y `Unknown column '...' in 'SELECT'`.

Salida:
  0  el esquema coincide con la especificación
  1  hay diferencias (imprime el detalle)
  2  error de conexión

Uso típico antes de un despliegue o en un pipeline de CI:

    docker compose -f deploy/compose.yml run --rm api \
        python manage.py verificar_esquema
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import connections

from escuela import schema


class Command(BaseCommand):
    help = 'Compara el esquema físico de la base con los modelos managed=False.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--database', default='default',
            help='Alias de la conexión a verificar (default: default).',
        )
        parser.add_argument(
            '--aplicar', action='store_true',
            help=(
                'Ejecuta el DDL declarativo que falte en lugar de solo '
                'informar. Es idempotente y no destructivo.'
            ),
        )

    def handle(self, *args, **options):
        alias = options['database']
        try:
            connection = connections[alias]
            connection.ensure_connection()
        except Exception as exc:  # noqa: BLE001
            raise CommandError(
                f'No se pudo conectar a la base "{alias}": {exc}'
            ) from exc

        db = connection.settings_dict.get('NAME')
        engine = connection.settings_dict.get('ENGINE')
        self.stdout.write(f'Base: {db} (motor: {engine})')

        if options['aplicar']:
            informe = schema.aplicar_esquema(
                connection, log=lambda msg: self.stdout.write('  ' + msg),
            )
            self.stdout.write('')
            for clave in ('agregadas', 'endurecidas', 'relajadas', 'indices',
                          'rellenos'):
                for item in informe.get(clave, []):
                    self.stdout.write(f'  {clave}: {item}')
            if informe['pendientes']:
                for tabla, columna, motivo in informe['pendientes']:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  PENDIENTE {tabla}.{columna}: {motivo}'
                        )
                    )
            self.stdout.write('')

        resultado = schema.verificar_esquema(connection)
        total = sum(len(v) for v in resultado.values())

        for clave, items in resultado.items():
            for item in items:
                self.stdout.write(self.style.ERROR(f'  {clave}: {item}'))

        if total:
            self.stdout.write(self.style.ERROR(
                f'Esquema desalineado: {total} diferencia(s). '
                'Ejecutá `manage.py migrate` (o `verificar_esquema --aplicar`).'
            ))
            raise SystemExit(1)

        self.stdout.write(self.style.SUCCESS('Esquema alineado con los modelos.'))
