from django.contrib.auth.models import User
from django.contrib.auth.hashers import check_password, make_password

from escuela.models import Usuario, UsuarioRol


class UsuarioBackend:
    """
    Backend de autenticación que valida contra la tabla 'usuarios'
    de la base de datos sistema_escolar.

    Busca el usuario en la tabla custom, verifica la contraseña hasheada,
    y devuelve (o crea) un django.contrib.auth.User para que DRF/JWT
    funcionen correctamente.
    """

    def authenticate(self, request, username=None, password=None):
        try:
            usuario = Usuario.objects.get(usuario=username, estado=True)
        except Usuario.DoesNotExist:
            return None

        if not check_password(password, usuario.contrasena):
            return None

        django_user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'is_active': True,
            },
        )
        return django_user

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None


def get_roles_for_usuario(username):
    """Devuelve los nombres de roles asignados a un usuario."""
    try:
        usuario = Usuario.objects.get(usuario=username)
    except Usuario.DoesNotExist:
        return []
    roles = UsuarioRol.objects.filter(id_usuario=usuario).select_related('id_rol')
    return [ur.id_rol.nombre_rol for ur in roles]
