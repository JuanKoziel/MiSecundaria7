from rest_framework import permissions

from escuela.auth_backend import get_roles_for_usuario


class IsAdminOrDirectorForWrite(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        username = request.user.username if request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        return 'admin' in roles or 'director' in roles


class PuedeVerHistorial(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        username = request.user.username if request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        return 'admin' in roles or 'director' in roles or 'jefe_preceptores' in roles
