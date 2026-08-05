from django.apps import AppConfig


class EscuelaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'escuela'

    def ready(self):
        from escuela.utils import seed_tipos_accion
        seed_tipos_accion()
