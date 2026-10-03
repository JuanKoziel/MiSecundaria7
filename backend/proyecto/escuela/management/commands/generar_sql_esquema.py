"""`manage.py generar_sql_esquema` — emite el SQL de actualización idempotente.

El esquema de las tablas `managed=False` no lo crea Django: hay que
provisionarlo con SQL. Este comando genera ese SQL a partir de la MISMA
especificación declarativa que usa la migración 0007, para que una instalación
nueva y una actualización de una base existente no puedan divergir.

Salida por defecto: stdout. Con ``--salida RUTA`` escribe el archivo.

    python manage.py generar_sql_esquema --salida ../deploy/sql/002_esquema.sql
"""
import os

from django.core.management.base import BaseCommand

from escuela import schema


class Command(BaseCommand):
    help = 'Genera el script SQL idempotente que sincroniza el esquema físico.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--salida', default=None,
            help='Ruta del archivo a escribir (por defecto, stdout).',
        )

    def handle(self, *args, **options):
        sql = schema.sql_esquema()
        destino = options['salida']
        if not destino:
            self.stdout.write(sql)
            return
        directorio = os.path.dirname(os.path.abspath(destino))
        if directorio:
            os.makedirs(directorio, exist_ok=True)
        with open(destino, 'w', encoding='utf-8') as fh:
            fh.write(sql)
        self.stdout.write(self.style.SUCCESS(
            f'Escritas {len(sql.splitlines())} líneas en {destino}'
        ))
