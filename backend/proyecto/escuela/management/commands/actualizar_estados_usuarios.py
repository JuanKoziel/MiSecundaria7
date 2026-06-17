from django.core.management.base import BaseCommand

from escuela.usuario_estado import aplicar_programaciones_usuario


class Command(BaseCommand):
    help = 'Aplica las programaciones de habilitacion y deshabilitacion de usuarios.'

    def handle(self, *args, **options):
        aplicar_programaciones_usuario()
        self.stdout.write(self.style.SUCCESS('Estados de usuarios actualizados correctamente.'))

