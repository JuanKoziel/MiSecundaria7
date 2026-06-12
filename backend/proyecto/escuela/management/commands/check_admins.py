from django.core.management.base import BaseCommand
from escuela.models import Rol, Usuario, UsuarioRol, Directivo


class Command(BaseCommand):
    help = 'Check the state of admins in the database'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== ROLES ==='))
        for rol in Rol.objects.all():
            self.stdout.write(f"  id_rol: {rol.id_rol}, nombre_rol: {rol.nombre_rol}")

        self.stdout.write('\n=== USUARIOS ===')
        for usuario in Usuario.objects.all():
            self.stdout.write(f"  id_usuario: {usuario.id_usuario}, usuario: {usuario.usuario}, estado: {usuario.estado}")

        self.stdout.write('\n=== USUARIO_ROLES ===')
        for ur in UsuarioRol.objects.all():
            self.stdout.write(f"  id_usuario: {ur.id_usuario_id}, id_rol: {ur.id_rol_id}")

        self.stdout.write('\n=== DIRECTIVOS ===')
        for directivo in Directivo.objects.all():
            self.stdout.write(f"  id_directivo: {directivo.id_directivo}, id_usuario: {directivo.id_usuario_id}, nombre: {directivo.nombre}, apellido: {directivo.apellido}, dni: {directivo.dni}")

        self.stdout.write('\n=== USUARIOS CON ROL ADMIN ===')
        admin_users = Usuario.objects.filter(
            usuariorol__id_rol__nombre_rol='admin'
        ).distinct()
        self.stdout.write(f"  Cantidad: {admin_users.count()}")
        for usuario in admin_users:
            self.stdout.write(f"  id_usuario: {usuario.id_usuario}, usuario: {usuario.usuario}")
