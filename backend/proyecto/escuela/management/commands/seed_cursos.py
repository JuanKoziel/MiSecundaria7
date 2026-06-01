"""
Comando para crear automáticamente la estructura fija de cursos:
6 años (1° a 6°) x 3 divisiones (1 a 3) = 18 cursos por ciclo lectivo.

Uso:
    python manage.py seed_cursos

Es idempotente: se puede correr varias veces sin duplicar cursos.
Crea los 18 cursos para cada ciclo lectivo con estado activo. Si no existe
ningún ciclo, crea uno para el año actual.
"""

from datetime import date
from django.core.management.base import BaseCommand

from escuela.models import CicloLectivo, Curso


class Command(BaseCommand):
    help = 'Crea los 18 cursos fijos (6 años x 3 divisiones) por ciclo activo'

    def handle(self, *args, **options):
        ciclos = list(CicloLectivo.objects.filter(estado=True))
        if not ciclos:
            anio = date.today().year
            ciclo, _ = CicloLectivo.objects.get_or_create(
                anio=anio,
                defaults={
                    'fecha_inicio': date(anio, 3, 1),
                    'fecha_fin': date(anio, 12, 15),
                    'estado': True,
                },
            )
            ciclos = [ciclo]

        total = 0
        for ciclo in ciclos:
            for anio in range(1, 7):
                for div in range(1, 4):
                    nombre = f'{anio}°{div}'
                    _, created = Curso.objects.get_or_create(
                        nombre_curso=nombre,
                        id_ciclo=ciclo,
                        defaults={'turno': 'Mañana'},
                    )
                    if created:
                        total += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'  Ciclo {ciclo.anio}: 18 cursos asegurados'
                )
            )

        self.stdout.write(
            self.style.SUCCESS(f'Cursos nuevos creados: {total}')
        )
