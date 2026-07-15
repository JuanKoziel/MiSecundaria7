from django.core.management.base import BaseCommand

from escuela.views import limpiar_eventos_temporales_vencidos


class Command(BaseCommand):
    help = 'Elimina eventos institucionales temporales cuya fecha ya pasó.'

    def handle(self, *args, **options):
        count = limpiar_eventos_temporales_vencidos()
        self.stdout.write(self.style.SUCCESS(f'Se eliminaron {count} evento(s) temporal(es) vencido(s).'))
