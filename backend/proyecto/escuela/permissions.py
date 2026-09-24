from rest_framework import permissions

from escuela.auth_backend import get_roles_for_usuario
from escuela.models import Usuario, Alumno, Docente, PadreTutor, CursoMateria, TutorAlumno


# ---------------------------------------------------------------------------
# Resolución del actor autenticado y autorización a nivel de objeto.
# El backend de autenticación resuelve `request.user` a un django.contrib.auth.User
# cuyo `username` es el campo `usuario` de la tabla `usuarios`. A partir de ahí se
# derivan los vínculos Alumno / Familia (PadreTutor) / Docente.
# ---------------------------------------------------------------------------

ROLES_AMPLIOS = {'admin', 'director', 'jefe_preceptores', 'preceptor'}


def alumno_ids_de_tutor(tutor):
    """Ids de alumnos vinculados a un tutor/familia (relación N:M)."""
    if tutor is None:
        return []
    return list(TutorAlumno.objects.filter(id_tutor=tutor).values_list('id_alumno_id', flat=True))


def tutor_ids_de_alumno(alumno):
    """Ids de tutores/familia vinculados a un alumno (relación N:M).

    Incluye el tutor principal legado (``alumnos.id_tutor``) por compatibilidad."""
    ids = set()
    if alumno is not None:
        ids |= set(
            TutorAlumno.objects.filter(id_alumno=alumno).values_list('id_tutor_id', flat=True)
        )
        if alumno.id_tutor_id:
            ids.add(alumno.id_tutor_id)
    return list(ids)


def get_usuario(request):
    username = getattr(request.user, 'username', None)
    if not username:
        return None
    return Usuario.objects.filter(usuario=username).first()


def roles_de_request(request):
    u = get_usuario(request)
    if not u:
        return set()
    return set(get_roles_for_usuario(u.usuario))


def es_rol_amplio(request):
    return bool(roles_de_request(request) & ROLES_AMPLIOS)


def alumno_del_usuario(request):
    u = get_usuario(request)
    if not u:
        return None
    return Alumno.objects.filter(id_usuario=u).first()


def alumno_ids_familia(request):
    u = get_usuario(request)
    if not u:
        return []
    tutor = PadreTutor.objects.filter(id_usuario=u).first()
    if not tutor:
        return []
    return alumno_ids_de_tutor(tutor)


def docente_del_usuario(request):
    u = get_usuario(request)
    if not u:
        return None
    return Docente.objects.filter(id_usuario=u).first()


def alumnos_permitidos(request):
    """Queryset de Alumno que el usuario puede consultar.

    Devuelve ``None`` cuando no hay restricción (roles amplios: admin/director/
    jefe_preceptores/preceptor). En otro caso devuelve únicamente los alumnos
    permitidos según el rol: el propio (alumno), los vinculados a su tutor
    (familia) o los que cursan materias asignadas al docente.
    """
    if es_rol_amplio(request):
        return None
    al = alumno_del_usuario(request)
    if al:
        return Alumno.objects.filter(id_alumno=al.id_alumno)
    ids = alumno_ids_familia(request)
    if ids:
        return Alumno.objects.filter(id_alumno__in=ids)
    doc = docente_del_usuario(request)
    if doc:
        cursos = CursoMateria.objects.filter(
            id_docente=doc, activo=True, estado=True
        ).values_list('id_curso', flat=True)
        return Alumno.objects.filter(id_curso__in=cursos)
    return Alumno.objects.none()


class IsAdminOrDirectorForWrite(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        username = request.user.username if request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        return 'admin' in roles or 'director' in roles


class PuedeGestionarCurso(permissions.BasePermission):
    """Escritura de cursos: admin/director para cualquier cambio; los jefes de
    preceptores solo pueden actualizar (PUT/PATCH) la asignación de preceptor.
    La validación de que el curso ya tenga preceptor se resuelve en el viewset."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        username = request.user.username if request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'admin' in roles or 'director' in roles:
            return True
        return 'jefe_preceptores' in roles and request.method in ('PUT', 'PATCH')


class PuedeGestionarHorarios(permissions.BasePermission):
    """Escritura de horarios para admin/director/preceptor.

    El alcance fino (curso a cargo del preceptor) se resuelve en el
    `perform_*` del viewset (`_check_preceptor_curso_access`), de la misma
    forma que el resto de la gestión por preceptor.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        username = request.user.username if request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        return any(rol in roles for rol in ('admin', 'director', 'preceptor'))


class PuedeVerHistorial(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        username = request.user.username if request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        return 'admin' in roles or 'director' in roles or 'jefe_preceptores' in roles


def _puede_escribir(request, roles_permitidos):
    """Lectura abierta a cualquier autenticado; escritura solo para roles_permitidos."""
    if request.method in permissions.SAFE_METHODS:
        return request.user.is_authenticated
    username = request.user.username if request.user.is_authenticated else None
    roles = get_roles_for_usuario(username) if username else []
    return any(rol in roles for rol in roles_permitidos)


class PuedeEscribirCalificaciones(permissions.BasePermission):
    """Escritura de calificaciones solo para admin/director/docente.

    El docente además solo puede escribir sobre sus CursoMateria activos;
    esa verificación fina sigue en `_verificar_docente_activo_materia`
    dentro del viewset. Alumno y familia nunca escriben.
    """

    def has_permission(self, request, view):
        return _puede_escribir(request, ('admin', 'director', 'docente'))


class PuedeGestionarPersonas(permissions.BasePermission):
    """Escritura de alumnos/docentes/preceptores/tutores solo para roles de gestión.

    Los alcances finos (cursos asignados del preceptor, jefes bloqueados
    según la operación) siguen resolviéndose en los perform_* de cada viewset.
    """

    def has_permission(self, request, view):
        return _puede_escribir(
            request,
            ('admin', 'director', 'preceptor', 'jefe_preceptores'),
        )


class PuedeGestionarActas(permissions.BasePermission):
    """Puerta gruesa de escritura de actas: alumno y familia quedan afuera.

    Quién crea/edita/elimina exactamente lo resuelven `ROLES_CREAR_ACTA`,
    `ActaPropiedadMixin` y los perform_* del viewset.
    """

    def has_permission(self, request, view):
        return _puede_escribir(
            request,
            ('admin', 'director', 'jefe_preceptores', 'preceptor', 'docente'),
        )


class PuedeRegistrarAsistencias(permissions.BasePermission):
    """Escritura de asistencias por admin/director/preceptor/docente.

    Espeja el chequeo de rol que ya hacía `AsistenciaViewSet.create`;
    el alcance por materia/curso sigue en las verificaciones del viewset.
    """

    def has_permission(self, request, view):
        return _puede_escribir(request, ('admin', 'director', 'preceptor', 'docente'))


class PuedeGestionarPlanificaciones(permissions.BasePermission):
    """Escritura de planificaciones por admin/director/docente."""

    def has_permission(self, request, view):
        return _puede_escribir(request, ('admin', 'director', 'docente'))


class PuedeGestionarAmbitoDocente(permissions.BasePermission):
    """Escritura directa o delegada de directivos sobre recursos del ámbito
    docente (DDJJ, libro de temas, diagnósticos grupales, materias adeudadas).

    El alcance fino (dueño del registro, docente activo de la materia)
    se valida en cada viewset.
    """

    def has_permission(self, request, view):
        return _puede_escribir(request, ('admin', 'director', 'docente'))


class PuedeGestionarCursoMateria(permissions.BasePermission):
    """Escritura de asignaciones curso-materia para admin/director/preceptor.

    Los preceptores pueden asignar materias a docentes de sus propios cursos
    (los usa el alta de docente). El alcance fino (curso a cargo del preceptor)
    se resuelve en los `perform_*` del viewset, igual que en horarios.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        username = request.user.username if request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        return any(rol in roles for rol in ('admin', 'director', 'preceptor'))


class PuedePublicarComunicados(permissions.BasePermission):
    """Creación/gestión de comunicados: admin/director/jefe_preceptores.

    La lectura queda abierta a cualquier usuario autenticado.
    """

    def has_permission(self, request, view):
        return _puede_escribir(request, ('admin', 'director', 'jefe_preceptores'))


class PuedeGestionarAdelantos(permissions.BasePermission):
    """Permite gestionar (crear/modificar/eliminar) adelantos de horas.

    Roles habilitados: preceptor, jefe de preceptores, director y
    administrador. La lectura queda restringida a los mismos roles; el
    alcance por curso se valida a nivel de objeto en el viewset.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        username = request.user.username if request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        return any(
            rol in roles
            for rol in ('admin', 'director', 'jefe_preceptores', 'preceptor')
        )
