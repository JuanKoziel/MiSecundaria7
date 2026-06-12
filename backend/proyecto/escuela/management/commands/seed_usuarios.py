"""
Comando para crear usuarios de prueba (uno por cada rol).

Uso:
    python manage.py seed_usuarios

Crea los siguientes usuarios en la tabla 'usuarios' y les asigna el rol
correspondiente en 'usuario_roles'. Si los roles no existen, los crea.

    usuario: admin_test      | contraseña: admin123      | rol: admin
    usuario: docente_test    | contraseña: docente123    | rol: docente
    usuario: preceptor_test  | contraseña: preceptor123  | rol: preceptor
    usuario: familia_test    | contraseña: familia123    | rol: familia
    usuario: director_test   | contraseña: director123   | rol: director
"""

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand

from escuela.models import Rol, Usuario, UsuarioRol, Directivo


USUARIOS_PRUEBA = [
    {'usuario': 'admin_test', 'contrasena': 'admin123', 'rol': 'admin'},
    {'usuario': 'docente_test', 'contrasena': 'docente123', 'rol': 'docente'},
    {'usuario': 'preceptor_test', 'contrasena': 'preceptor123', 'rol': 'preceptor'},
    {'usuario': 'familia_test', 'contrasena': 'familia123', 'rol': 'familia'},
    {'usuario': 'alumno_test', 'contrasena': 'alumno123', 'rol': 'alumno'},
    {'usuario': 'director_test', 'contrasena': 'director123', 'rol': 'director'},
    {'usuario': 'gperez', 'contrasena': 'director123', 'rol': 'director', 'nombre': 'Guillermo', 'apellido': 'Pérez'},
]


class Command(BaseCommand):
    help = 'Crea usuarios de prueba con sus roles asignados'

    def handle(self, *args, **options):
        for data in USUARIOS_PRUEBA:
            rol, _ = Rol.objects.get_or_create(nombre_rol=data['rol'])

            usuario, created = Usuario.objects.get_or_create(
                usuario=data['usuario'],
                defaults={
                    'contrasena': make_password(data['contrasena']),
                    'estado': True,
                },
            )

            if created:
                self.stdout.write(self.style.SUCCESS(
                    f"  Creado: {data['usuario']} (contraseña: {data['contrasena']})"
                ))
            else:
                self.stdout.write(f"  Ya existe: {data['usuario']}")

            if not UsuarioRol.objects.filter(
                id_usuario=usuario, id_rol=rol,
            ).exists():
                UsuarioRol.objects.create(id_usuario=usuario, id_rol=rol)
                self.stdout.write(f"    Rol asignado: {data['rol']}")

            # Create Directivo profile for director role if nombre and apellido are provided
            if data['rol'] == 'director' and 'nombre' in data and 'apellido' in data:
                Directivo.objects.get_or_create(
                    id_usuario=usuario,
                    defaults={
                        'nombre': data['nombre'],
                        'apellido': data['apellido'],
                        'dni': data['usuario'],  # Use username as placeholder DNI
                        'cargo': 'Director',
                    }
                )
                self.stdout.write(f"    Perfil Directivo creado: {data['nombre']} {data['apellido']}")

        self.stdout.write(self.style.SUCCESS('\nUsuarios de prueba listos.'))
