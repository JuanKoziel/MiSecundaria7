from rest_framework.permissions import BasePermission


def get_role(user):
    if not user.is_authenticated:
        return None
    perfil = getattr(user, 'perfil', None)
    return perfil.role if perfil else None


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return get_role(request.user) == 'admin'


class IsStaffEscuela(BasePermission):
    """Admin, preceptor o docente."""

    def has_permission(self, request, view):
        return get_role(request.user) in ('admin', 'preceptor', 'docente')


class IsPreceptorOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return get_role(request.user) in ('admin', 'preceptor')


class IsDocenteOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return get_role(request.user) in ('admin', 'docente')
