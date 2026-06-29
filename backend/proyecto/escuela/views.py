from datetime import datetime, date, time
from django.contrib.auth import authenticate
from django.db import models
from django.http import FileResponse
import re
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from escuela.auth_backend import get_roles_for_usuario
from escuela.models import (
    Acta,
    ActaAlumno,
    ActaCurso,
    ActaDocente,
    Alumno,
    Asistencia,
    ActividadDocente,
    ActividadDocenteArchivo,
    Calificacion,
    CicloLectivo,
    Comunicado,
    ComunicadoAlcance,
    ComunicadoArchivo,
    Curso,
    CursoMateria,
    DdjjDocente,
    DiagnosticoGrupal,
    Directivo,
    Docente,
    EstadoAsistencia,
    HistorialCambio,
    Horario,
    HorariosEspeciales,
    InscripcionMateria,
    Materia,
    Modulos,
    Notificacion,
    PadreTutor,
    PeriodoEvaluacion,
    Planificacion,
    Preceptor,
    Rol,
    TipoAccion,
    TipoActa,
    Usuario,
    UsuarioRol,
)
from escuela.serializers import (
    ActaAlumnoSerializer,
    ActaCursoSerializer,
    ActaDocenteSerializer,
    ActaSerializer,
    ActividadDocenteSerializer,
    ActividadDocenteArchivoSerializer,
    ComunicadoArchivoSerializer,
    ComunicadoAlcanceSerializer,
    ComunicadoSerializer,
    AlumnoSerializer,
    AsistenciaSerializer,
    CalificacionSerializer,
    CicloLectivoSerializer,
    CursoMateriaSerializer,
    CursoSerializer,
    DiagnosticoGrupalSerializer,
    DirectivoSerializer,
    DocenteSerializer,
    EstadoAsistenciaSerializer,
    HistorialCambioSerializer,
    HorarioSerializer,
    HorarioEspecialSerializer,
    InscripcionMateriaSerializer,
    ModuloSerializer,
    LoginSerializer,
    MateriaSerializer,
    NotificacionSerializer,
    PadreTutorSerializer,
    PeriodoEvaluacionSerializer,
    PlanificacionSerializer,
    DdjjDocenteSerializer,
    PreceptorSerializer,
    RolSerializer,
    TipoAccionSerializer,
    TipoActaSerializer,
    UsuarioSerializer,
)


def _usuario_context(request):
    username = request.user.username if request.user.is_authenticated else None
    if not username:
        return {
            'username': None,
            'roles': [],
            'usuario_obj': None,
            'alumno': None,
            'padre': None,
            'docente': None,
            'preceptor': None,
        }

    roles = get_roles_for_usuario(username)
    usuario_obj = Usuario.objects.filter(usuario=username).first()
    return {
        'username': username,
        'roles': roles,
        'usuario_obj': usuario_obj,
        'alumno': Alumno.objects.filter(id_usuario=usuario_obj).first() if usuario_obj else None,
        'padre': PadreTutor.objects.filter(id_usuario=usuario_obj).first() if usuario_obj else None,
        'docente': Docente.objects.filter(id_usuario=usuario_obj).first() if usuario_obj else None,
        'preceptor': Preceptor.objects.filter(id_usuario=usuario_obj).first() if usuario_obj else None,
    }


def _preceptor_actual(request):
    username = request.user.username if request.user.is_authenticated else None
    if not username:
        return None
    usuario_obj = Usuario.objects.filter(usuario=username).first()
    if not usuario_obj:
        return None
    return Preceptor.objects.filter(id_usuario=usuario_obj).first()


def _preceptor_cursos_ids(request):
    preceptor = _preceptor_actual(request)
    if not preceptor:
        return set()
    return set(
        Curso.objects.filter(id_preceptor=preceptor).values_list('id_curso', flat=True),
    )


def _alumno_curso(request):
    username = request.user.username if request.user.is_authenticated else None
    if not username:
        return None
    usuario = Usuario.objects.filter(usuario=username).first()
    if not usuario:
        return None
    alumno = Alumno.objects.filter(id_usuario=usuario).first()
    if not alumno or not alumno.id_curso_id:
        return None
    return alumno.id_curso_id


def _familia_cursos_ids(request):
    username = request.user.username if request.user.is_authenticated else None
    if not username:
        return set()
    usuario = Usuario.objects.filter(usuario=username).first()
    if not usuario:
        return set()
    tutor = PadreTutor.objects.filter(id_usuario=usuario).first()
    if not tutor:
        return set()
    return set(
        Alumno.objects.filter(id_tutor=tutor)
        .values_list('id_curso', flat=True)
        .distinct()
    )


def _docente_ids_en_cursos(cursos_ids):
    if not cursos_ids:
        return set()
    return set(
        CursoMateria.objects.filter(id_curso__in=cursos_ids).values_list('id_docente', flat=True).distinct(),
    )


def _resolve_course_id(value):
    if value is None:
        return None
    if hasattr(value, 'id_curso'):
        return value.id_curso
    if hasattr(value, 'pk'):
        return value.pk
    return value


def _parse_curso_nombre(nombre_curso):
    if not nombre_curso:
        return {'anio': None, 'division': None}
    texto = str(nombre_curso).strip()
    match = re.match(r'^(\d+)\s*[°º]?\s*(\d*)', texto)
    if match:
        return {
            'anio': int(match.group(1)),
            'division': int(match.group(2)) if match.group(2) else None,
        }
    nums = re.findall(r'\d+', texto)
    if not nums:
        return {'anio': None, 'division': None}
    if len(nums) >= 2:
        return {'anio': int(nums[0]), 'division': int(nums[1])}
    digits = nums[0]
    if len(digits) >= 2:
        return {'anio': int(digits[0]), 'division': int(digits[1:])}
    return {'anio': int(digits), 'division': None}


def _get_comunicado_alcances(comunicado):
    alcances = getattr(comunicado, 'alcances', None)
    if alcances is None:
        return []
    if hasattr(alcances, 'all'):
        return list(alcances.all())
    if isinstance(alcances, (list, tuple)):
        return list(alcances)
    return []


def _curso_matches_alcance(curso_obj, alcance):
    if not alcance or not curso_obj:
        return False
    if (
        alcance.id_ciclo_id is None
        and alcance.curso is None
        and alcance.division is None
        and alcance.id_materia_id is None
    ):
        return True

    if alcance.id_ciclo_id and curso_obj.id_ciclo_id != alcance.id_ciclo_id:
        return False

    parts = _parse_curso_nombre(curso_obj.nombre_curso)
    if alcance.curso is not None and parts['anio'] != int(alcance.curso):
        return False
    if alcance.division is not None and parts['division'] != int(alcance.division):
        return False
    return True


def _docente_tiene_materia_en_curso(docente_id, curso_obj, materia_id):
    if not curso_obj or not materia_id:
        return False
    return CursoMateria.objects.filter(
        id_docente=docente_id,
        id_curso=curso_obj.id_curso,
        id_materia=materia_id,
    ).exists()


def _comunicado_visible_para_ctx(comunicado, ctx):
    if 'admin' in ctx['roles'] or 'director' in ctx['roles']:
        return True

    alcances = _get_comunicado_alcances(comunicado)
    if not alcances:
        return True

    if 'alumno' in ctx['roles'] and ctx['alumno']:
        return any(_curso_matches_alcance(ctx['alumno'].id_curso, alcance) for alcance in alcances)

    if 'familia' in ctx['roles'] and ctx['padre']:
        hijos = Alumno.objects.filter(id_tutor=ctx['padre'].id_tutor).select_related('id_curso')
        return any(
            _curso_matches_alcance(hijo.id_curso, alcance)
            for hijo in hijos if hijo.id_curso
            for alcance in alcances
        )

    if 'preceptor' in ctx['roles'] and ctx['preceptor']:
        cursos = Curso.objects.filter(id_preceptor=ctx['preceptor'].id_preceptor).select_related('id_ciclo')
        return any(
            _curso_matches_alcance(curso, alcance)
            for curso in cursos
            for alcance in alcances
        )

    if 'docente' in ctx['roles'] and ctx['docente']:
        asignaciones = CursoMateria.objects.filter(
            id_docente=ctx['docente'].id_docente,
        ).select_related('id_curso')
        for asignacion in asignaciones:
            curso_obj = asignacion.id_curso
            if not curso_obj:
                continue
            for alcance in alcances:
                if not _curso_matches_alcance(curso_obj, alcance):
                    continue
                if alcance.id_materia_id and int(alcance.id_materia_id) != int(asignacion.id_materia_id):
                    continue
                return True
        return False

    return False


def _filter_visible_comunicados(request, qs):
    ctx = _usuario_context(request)
    if not ctx['username']:
        return qs.none()
    if 'admin' in ctx['roles'] or 'director' in ctx['roles']:
        return qs

    visible_ids = [
        comunicado.id_comunicado
        for comunicado in qs
        if _comunicado_visible_para_ctx(comunicado, ctx)
    ]
    return qs.filter(id_comunicado__in=visible_ids).distinct()

# ============================================================
# Login / Autenticación
# ============================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Autentica contra la tabla 'usuarios' y devuelve tokens JWT + roles.
    Body: { "usuario": "...", "contrasena": "..." }
    """
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    username = serializer.validated_data['usuario']
    password = serializer.validated_data['contrasena']

    usuario_obj = Usuario.objects.filter(usuario=username).first()
    if usuario_obj and not usuario_obj.estado:
        return Response(
            {'error': 'Su usuario se encuentra deshabilitado. ComunÃ­quese con la administraciÃ³n.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response(
            {'error': 'Credenciales invÃ¡lidas'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    roles = get_roles_for_usuario(username)

    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'id_usuario': usuario_obj.id_usuario if usuario_obj else None,
        'usuario': username,
        'roles': roles,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """Devuelve info del usuario autenticado y sus roles."""
    username = request.user.username
    roles = get_roles_for_usuario(username)
    usuario_obj = Usuario.objects.filter(usuario=username).first()
    return Response({
        'id_usuario': usuario_obj.id_usuario if usuario_obj else None,
        'usuario': username,
        'roles': roles,
    })


# ============================================================
# ViewSets CRUD
# ============================================================

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()

        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            return qs.none()

        roles = get_roles_for_usuario(username)
        if 'director' in roles or 'admin' in roles:
            return qs.filter(
                usuariorol__id_rol__nombre_rol='admin',
            ).distinct()

        usuario = Usuario.objects.filter(usuario=username).first()
        if usuario:
            return qs.filter(
                id_usuario=usuario.id_usuario,
                usuariorol__id_rol__nombre_rol='admin',
            ).distinct()

        return qs.none()

    def perform_create(self, serializer):
        from escuela.auth_backend import get_roles_for_usuario
        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            raise PermissionDenied("Usuario no autenticado")

        roles = get_roles_for_usuario(username)

        # Only directors can create admin users
        if 'director' not in roles:
            raise PermissionDenied("Solo directores pueden crear administradores")

        # Check if trying to create an admin user
        requested_roles = self.request.data.get('roles', [])
        if 'admin' in requested_roles and 'director' not in roles:
            raise PermissionDenied("Solo directores pueden crear usuarios con rol administrador")

        serializer.save()

    def perform_update(self, serializer):
        from escuela.auth_backend import get_roles_for_usuario
        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            raise PermissionDenied("Usuario no autenticado")

        roles = get_roles_for_usuario(username)

        # Only directors can update admin users
        if 'director' not in roles:
            raise PermissionDenied("Solo directores pueden modificar administradores")

        # Check if trying to assign admin role
        requested_roles = self.request.data.get('roles', [])
        if 'admin' in requested_roles and 'director' not in roles:
            raise PermissionDenied("Solo directores pueden asignar rol administrador")

        serializer.save()

    def perform_destroy(self, instance):
        from escuela.auth_backend import get_roles_for_usuario
        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            raise PermissionDenied("Usuario no autenticado")

        roles = get_roles_for_usuario(username)

        # Only directors can delete admin users
        if 'director' not in roles:
            raise PermissionDenied("Solo directores pueden eliminar administradores")

        # Check if the user being deleted has admin role
        user_roles = UsuarioRol.objects.filter(id_usuario=instance).select_related('id_rol')
        has_admin_role = any(ur.id_rol.nombre_rol == 'admin' for ur in user_roles)

        if has_admin_role and 'director' not in roles:
            raise PermissionDenied("Solo directores pueden eliminar administradores")

        instance.delete()


class RolViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer


class AlumnoViewSet(viewsets.ModelViewSet):
    queryset = Alumno.objects.select_related(
        'id_curso', 'id_tutor', 'id_usuario',
    ).all()
    serializer_class = AlumnoSerializer
    filterset_fields = ['id_curso', 'dni']

    def get_queryset(self):
        qs = super().get_queryset()
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        usuario_obj = Usuario.objects.filter(usuario=username).first() if username else None

        if 'preceptor' in roles and usuario_obj:
            cursos_ids = _preceptor_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            qs = qs.filter(id_curso__in=cursos_ids)

        curso_id = self.request.query_params.get('curso')
        if curso_id:
            qs = qs.filter(id_curso=curso_id)
        return qs

    def _require_preceptor_course_access(self, curso_id):
        cursos_ids = _preceptor_cursos_ids(self.request)
        if not cursos_ids:
            raise PermissionDenied('No tienes cursos asignados para gestionar alumnos.')
        resolved_curso_id = _resolve_course_id(curso_id)
        if resolved_curso_id is None:
            raise PermissionDenied('Debes asignar un curso dentro de tus cursos habilitados.')
        if int(resolved_curso_id) not in {int(c) for c in cursos_ids}:
            raise PermissionDenied('No tienes permiso para gestionar alumnos de ese curso.')

    def perform_create(self, serializer):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'preceptor' in roles:
            self._require_preceptor_course_access(serializer.validated_data.get('id_curso'))
        serializer.save()

    def perform_update(self, serializer):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'preceptor' in roles:
            instance = serializer.instance
            self._require_preceptor_course_access(
                serializer.validated_data.get('id_curso', instance.id_curso_id if instance else None),
            )
        serializer.save()

    def perform_destroy(self, instance):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'preceptor' in roles:
            self._require_preceptor_course_access(instance.id_curso_id)
        instance.delete()


class DocenteViewSet(viewsets.ModelViewSet):
    queryset = Docente.objects.select_related('id_usuario').all()
    serializer_class = DocenteSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'preceptor' in roles:
            cursos_ids = _preceptor_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            docente_ids = _docente_ids_en_cursos(cursos_ids)
            if not docente_ids:
                return qs.none()
            qs = qs.filter(id_docente__in=docente_ids)
        return qs

    def _require_preceptor_access(self, docente):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'preceptor' not in roles:
            return
        cursos_ids = _preceptor_cursos_ids(self.request)
        if not cursos_ids:
            raise PermissionDenied('No tienes cursos asignados para gestionar docentes.')
        docente_ids = _docente_ids_en_cursos(cursos_ids)
        if docente.id_docente not in docente_ids:
            raise PermissionDenied('No tienes permiso para gestionar este docente.')

    def perform_update(self, serializer):
        self._require_preceptor_access(serializer.instance)
        serializer.save()

    def perform_destroy(self, instance):
        self._require_preceptor_access(instance)
        instance.delete()


class DdjjDocenteViewSet(viewsets.ModelViewSet):
    queryset = DdjjDocente.objects.select_related('id_docente', 'id_docente__id_usuario').all()
    serializer_class = DdjjDocenteSerializer
    parser_classes = [MultiPartParser, FormParser]

    def _roles(self):
        username = self.request.user.username if self.request.user.is_authenticated else None
        return get_roles_for_usuario(username) if username else []

    def _docente_actual(self):
        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            return None
        usuario_obj = Usuario.objects.filter(usuario=username).first()
        if not usuario_obj:
            return None
        return Docente.objects.filter(id_usuario=usuario_obj).first()

    def _can_view_all(self):
        roles = self._roles()
        return 'admin' in roles or 'director' in roles

    def get_queryset(self):
        qs = super().get_queryset()
        if self._can_view_all():
            return qs
        docente = self._docente_actual()
        if docente:
            return qs.filter(id_docente=docente)
        return qs.none()

    def _can_manage(self, docente=None):
        if self._can_view_all():
            return True
        docente_actual = self._docente_actual()
        return bool(docente_actual and docente and docente_actual.id_docente == docente.id_docente)

    def _get_docente_from_request(self):
        if self._can_view_all():
            docente_id = self.request.data.get('id_docente') or self.request.query_params.get('id_docente')
            if docente_id:
                return Docente.objects.filter(id_docente=docente_id).first()
        return self._docente_actual()

    @action(detail=False, methods=['get', 'post', 'delete'], url_path='mi-ddjj')
    def mi_ddjj(self, request):
        docente = self._get_docente_from_request()
        if not docente:
            raise PermissionDenied('No se encontrÃ³ un perfil de docente asociado al usuario.')

        ddjj = DdjjDocente.objects.filter(id_docente=docente).first()

        if request.method == 'GET':
            if not ddjj:
                return Response({
                    'id_ddjj': None,
                    'id_docente': docente.id_docente,
                    'docente_nombre': docente.nombre,
                    'docente_apellido': docente.apellido,
                    'archivo_url': None,
                    'nombre_archivo': None,
                    'fecha_carga': None,
                    'presentada': False,
                })
            return Response(self.get_serializer(ddjj).data)

        if request.method == 'DELETE':
            if not self._can_view_all():
                raise PermissionDenied('No tienes permiso para eliminar esta DDJJ.')
            if not ddjj:
                return Response({'error': 'No existe una D.D.J.J. para eliminar.'}, status=status.HTTP_404_NOT_FOUND)
            if ddjj.ruta_archivo and ddjj.ruta_archivo.storage.exists(ddjj.ruta_archivo.name):
                ddjj.ruta_archivo.storage.delete(ddjj.ruta_archivo.name)
            ddjj.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        if ddjj:
            return Response(
                {'archivo': ['Ya posee una D.D.J.J. presentada.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        archivo = request.FILES.get('archivo')
        if archivo is None:
            return Response(
                {
                    'archivo': [
                        'No se recibiÃ³ un archivo en request.FILES. '
                        'EnvÃ­alo como FormData con el campo "archivo".'
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        incoming_data = {
            'id_docente': docente.id_docente,
            'archivo': archivo,
        }
        serializer = self.get_serializer(ddjj, data=incoming_data, partial=bool(ddjj))
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        instance = serializer.save(id_docente=docente)
        return Response(self.get_serializer(instance).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        return Response(
            {'error': 'No se permite reemplazar una D.D.J.J. presentada.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def partial_update(self, request, *args, **kwargs):
        return Response(
            {'error': 'No se permite reemplazar una D.D.J.J. presentada.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=True, methods=['get'], url_path='archivo')
    def archivo(self, request, pk=None):
        ddjj = self.get_object()
        if not ddjj.ruta_archivo:
            return Response({'error': 'La DDJJ no tiene archivo cargado.'}, status=status.HTTP_404_NOT_FOUND)
        download = str(request.query_params.get('download', '')).lower() in {'1', 'true', 'yes'}
        return FileResponse(
            ddjj.ruta_archivo.open('rb'),
            as_attachment=download,
            filename=ddjj.ruta_archivo.name.split('/')[-1],
        )

    def perform_create(self, serializer):
        docente = serializer.validated_data.get('id_docente')
        if not self._can_manage(docente):
            raise PermissionDenied('No tienes permiso para cargar esta DDJJ.')
        serializer.save()

    def perform_update(self, serializer):
        docente = serializer.validated_data.get('id_docente') or serializer.instance.id_docente
        if not self._can_manage(docente):
            raise PermissionDenied('No tienes permiso para modificar esta DDJJ.')
        serializer.save()

    def perform_destroy(self, instance):
        if not self._can_view_all():
            raise PermissionDenied('No tienes permiso para eliminar esta DDJJ.')
        if instance.ruta_archivo and instance.ruta_archivo.storage.exists(instance.ruta_archivo.name):
            instance.ruta_archivo.storage.delete(instance.ruta_archivo.name)
        instance.delete()


class ActividadDocenteViewSet(viewsets.ModelViewSet):
    queryset = ActividadDocente.objects.select_related(
        'id_docente',
        'id_curso_materia__id_curso',
        'id_curso_materia__id_materia',
    ).prefetch_related('archivos_adjuntos').all()
    serializer_class = ActividadDocenteSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def _docente_actual(self):
        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            return None
        usuario_obj = Usuario.objects.filter(usuario=username).first()
        if not usuario_obj:
            return None
        return Docente.objects.filter(id_usuario=usuario_obj).first()

    def get_queryset(self):
        qs = super().get_queryset()
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        usuario_obj = Usuario.objects.filter(usuario=username).first() if username else None

        if 'docente' in roles:
            docente = self._docente_actual()
            if docente:
                qs = qs.filter(id_docente=docente)
            else:
                return qs.none()
        elif 'alumno' in roles and usuario_obj:
            alumno = Alumno.objects.filter(id_usuario=usuario_obj).first()
            if alumno and alumno.id_curso_id:
                curso_materias = CursoMateria.objects.filter(
                    id_curso=alumno.id_curso_id,
                ).values_list('id_curso_materia', flat=True)
                qs = qs.filter(id_curso_materia__in=curso_materias)
            else:
                return qs.none()
        elif 'familia' in roles and usuario_obj:
            tutor = PadreTutor.objects.filter(id_usuario=usuario_obj).first()
            if tutor:
                hijos = Alumno.objects.filter(id_tutor=tutor).values_list('id_curso', flat=True)
                curso_ids = [h for h in hijos if h is not None]
                if curso_ids:
                    curso_materias = CursoMateria.objects.filter(
                        id_curso__in=curso_ids,
                    ).values_list('id_curso_materia', flat=True)
                    qs = qs.filter(id_curso_materia__in=curso_materias)
                else:
                    return qs.none()
            else:
                return qs.none()
        elif not roles:
            return qs.none()

        curso = self.request.query_params.get('curso')
        if curso:
            qs = qs.filter(id_curso_materia__id_curso=curso)

        curso_materia = self.request.query_params.get('curso_materia')
        if curso_materia:
            qs = qs.filter(id_curso_materia=curso_materia)
        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        uploaded_files = []
        if hasattr(self.request, 'FILES'):
            uploaded_files.extend(self.request.FILES.getlist('archivos'))
            uploaded_files.extend(self.request.FILES.getlist('archivo'))
            if not uploaded_files and self.request.FILES.get('archivo'):
                uploaded_files.append(self.request.FILES.get('archivo'))
        context['uploaded_files'] = uploaded_files
        return context

    def _delete_file_object(self, archivo_obj):
        if archivo_obj and archivo_obj.ruta_archivo and archivo_obj.ruta_archivo.name:
            storage = archivo_obj.ruta_archivo.storage
            if storage.exists(archivo_obj.ruta_archivo.name):
                storage.delete(archivo_obj.ruta_archivo.name)

    def _promote_primary_if_needed(self, actividad, archivo_eliminado):
        current_name = getattr(actividad.ruta_archivo, 'name', None)
        if not current_name:
            return
        if not archivo_eliminado or not archivo_eliminado.ruta_archivo:
            return
        if current_name != archivo_eliminado.ruta_archivo.name:
            return
        siguiente = actividad.archivos_adjuntos.exclude(id_archivo=archivo_eliminado.id_archivo).order_by('id_archivo').first()
        if siguiente:
            actividad.ruta_archivo = siguiente.ruta_archivo.name
        else:
            actividad.ruta_archivo = ''
        actividad.save(update_fields=['ruta_archivo'])

    def perform_create(self, serializer):
        docente = self._docente_actual()
        if not docente:
            raise PermissionDenied('No se pudo identificar el docente autenticado.')
        serializer.save(id_docente=docente)

    def perform_update(self, serializer):
        docente = self._docente_actual()
        if not docente or serializer.instance.id_docente_id != docente.id_docente:
            raise PermissionDenied('No tienes permiso para modificar esta actividad.')
        serializer.save()

    def perform_destroy(self, instance):
        docente = self._docente_actual()
        if not docente or instance.id_docente_id != docente.id_docente:
            raise PermissionDenied('No tienes permiso para eliminar esta actividad.')
        archivos = list(instance.archivos_adjuntos.all().order_by('id_archivo'))
        if archivos:
            for archivo in archivos:
                self._delete_file_object(archivo)
        elif instance.ruta_archivo and instance.ruta_archivo.name:
            if instance.ruta_archivo.storage.exists(instance.ruta_archivo.name):
                instance.ruta_archivo.storage.delete(instance.ruta_archivo.name)
        instance.delete()

    @action(detail=True, methods=['delete'], url_path=r'archivos/(?P<archivo_id>[^/.]+)')
    def borrar_archivo(self, request, pk=None, archivo_id=None):
        actividad = self.get_object()
        docente = self._docente_actual()
        if not docente or actividad.id_docente_id != docente.id_docente:
            raise PermissionDenied('No tienes permiso para modificar esta actividad.')

        archivo = actividad.archivos_adjuntos.filter(id_archivo=archivo_id).first()
        if not archivo:
            return Response({'error': 'El archivo no existe.'}, status=status.HTTP_404_NOT_FOUND)

        self._promote_primary_if_needed(actividad, archivo)
        self._delete_file_object(archivo)
        archivo.delete()

        actividad.refresh_from_db()
        serializer = self.get_serializer(actividad)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PreceptorViewSet(viewsets.ModelViewSet):
    queryset = Preceptor.objects.select_related('id_usuario').all()
    serializer_class = PreceptorSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'admin' in roles or 'director' in roles:
            return qs
        if 'preceptor' in roles and username:
            return qs.filter(id_usuario__usuario=username)
        return qs.none()

    def _require_admin_or_director(self):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'admin' not in roles and 'director' not in roles:
            raise PermissionDenied("Solo administradores o directores pueden gestionar preceptores")

    def perform_create(self, serializer):
        self._require_admin_or_director()
        serializer.save()

    def perform_update(self, serializer):
        self._require_admin_or_director()
        serializer.save()

    def perform_destroy(self, instance):
        self._require_admin_or_director()
        usuario = instance.id_usuario
        Curso.objects.filter(id_preceptor=instance).update(id_preceptor=None)
        if usuario:
            UsuarioRol.objects.filter(id_usuario=usuario).delete()
        instance.delete()


class DirectivoViewSet(viewsets.ModelViewSet):
    queryset = Directivo.objects.select_related('id_usuario').all()
    serializer_class = DirectivoSerializer


class PadreTutorViewSet(viewsets.ModelViewSet):
    queryset = PadreTutor.objects.select_related('id_usuario').all()
    serializer_class = PadreTutorSerializer


class CicloLectivoViewSet(viewsets.ModelViewSet):
    queryset = CicloLectivo.objects.all()
    serializer_class = CicloLectivoSerializer


class CursoViewSet(viewsets.ModelViewSet):
    queryset = Curso.objects.select_related('id_preceptor', 'id_ciclo').all()
    serializer_class = CursoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        usuario_obj = Usuario.objects.filter(usuario=username).first() if username else None

        if 'preceptor' in roles and usuario_obj:
            preceptor = Preceptor.objects.filter(id_usuario=usuario_obj).first()
            if not preceptor:
                return qs.none()
            qs = qs.filter(id_preceptor=preceptor)

        if 'alumno' in roles:
            curso_id = _alumno_curso(self.request)
            if not curso_id:
                return qs.none()
            qs = qs.filter(id_curso=curso_id)

        if 'familia' in roles:
            cursos_ids = _familia_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            qs = qs.filter(id_curso__in=cursos_ids)

        ciclo = self.request.query_params.get('ciclo')
        if ciclo:
            qs = qs.filter(id_ciclo=ciclo)
        return qs


class MateriaViewSet(viewsets.ModelViewSet):
    queryset = Materia.objects.all()
    serializer_class = MateriaSerializer


class CursoMateriaViewSet(viewsets.ModelViewSet):
    queryset = CursoMateria.objects.select_related(
        'id_curso', 'id_materia',
    ).prefetch_related('id_docente').all()
    serializer_class = CursoMateriaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'preceptor' in roles:
            cursos_ids = _preceptor_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            qs = qs.filter(id_curso__in=cursos_ids)
        if 'alumno' in roles:
            curso_id = _alumno_curso(self.request)
            if not curso_id:
                return qs.none()
            qs = qs.filter(id_curso=curso_id)
        if 'familia' in roles:
            cursos_ids = _familia_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            qs = qs.filter(id_curso__in=cursos_ids)
        curso = self.request.query_params.get('curso')
        docente = self.request.query_params.get('docente')
        
        if curso:
            qs = qs.filter(id_curso=curso)
        if docente:
            qs = qs.filter(id_docente=docente)
        
        return qs

    def _require_preceptor_course_access(self, curso_id):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'preceptor' not in roles:
            return
        cursos_ids = _preceptor_cursos_ids(self.request)
        if not cursos_ids:
            raise PermissionDenied('No tienes cursos asignados para gestionar asignaciones.')
        resolved_curso_id = _resolve_course_id(curso_id)
        if resolved_curso_id is None or int(resolved_curso_id) not in {int(c) for c in cursos_ids}:
            raise PermissionDenied('No tienes permiso para gestionar asignaciones de ese curso.')

    def perform_create(self, serializer):
        self._require_preceptor_course_access(serializer.validated_data.get('id_curso'))
        serializer.save()

    def perform_update(self, serializer):
        curso_obj = serializer.validated_data.get('id_curso') or serializer.instance.id_curso
        self._require_preceptor_course_access(curso_obj.id_curso if curso_obj else None)
        serializer.save()

    def perform_destroy(self, instance):
        self._require_preceptor_course_access(instance.id_curso_id)
        instance.delete()


class ModuloViewSet(viewsets.ModelViewSet):
    queryset = Modulos.objects.all()
    serializer_class = ModuloSerializer


class HorarioEspecialViewSet(viewsets.ModelViewSet):
    queryset = HorariosEspeciales.objects.select_related('id_curso_materia').all()
    serializer_class = HorarioEspecialSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'preceptor' in roles:
            cursos_ids = _preceptor_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            qs = qs.filter(id_curso_materia__id_curso__in=cursos_ids)
        if 'alumno' in roles:
            curso_id = _alumno_curso(self.request)
            if not curso_id:
                return qs.none()
            qs = qs.filter(id_curso_materia__id_curso=curso_id)
        if 'familia' in roles:
            cursos_ids = _familia_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            qs = qs.filter(id_curso_materia__id_curso__in=cursos_ids)

        curso = self.request.query_params.get('curso')
        if curso:
            qs = qs.filter(id_curso_materia__id_curso=curso)
        return qs

    def _check_preceptor_curso_access(self, instance):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'preceptor' not in roles:
            return
        curso_id = instance.id_curso_materia.id_curso_id
        cursos_ids = _preceptor_cursos_ids(self.request)
        if not cursos_ids or int(curso_id) not in {int(c) for c in cursos_ids}:
            raise PermissionDenied('No tienes permiso para modificar horarios de este curso.')

    def perform_create(self, serializer):
        instance = serializer.save()
        self._check_preceptor_curso_access(instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        self._check_preceptor_curso_access(instance)

    def perform_destroy(self, instance):
        self._check_preceptor_curso_access(instance)
        instance.delete()


class HorarioViewSet(viewsets.ModelViewSet):
    queryset = Horario.objects.select_related('id_curso_materia', 'id_modulo').all()
    serializer_class = HorarioSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []

        if 'preceptor' in roles:
            cursos_ids = _preceptor_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            qs = qs.filter(id_curso_materia__id_curso__in=cursos_ids)

        if 'alumno' in roles:
            curso_id = _alumno_curso(self.request)
            if not curso_id:
                return qs.none()
            qs = qs.filter(id_curso_materia__id_curso=curso_id)

        if 'familia' in roles:
            cursos_ids = _familia_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            qs = qs.filter(id_curso_materia__id_curso__in=cursos_ids)

        curso = self.request.query_params.get('curso')
        if curso:
            qs = qs.filter(id_curso_materia__id_curso=curso)

        curso_materia = self.request.query_params.get('curso_materia')
        if curso_materia:
            qs = qs.filter(id_curso_materia=curso_materia)
        return qs

    def _check_preceptor_curso_access(self, instance):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'preceptor' not in roles:
            return
        curso_id = instance.id_curso_materia.id_curso_id
        cursos_ids = _preceptor_cursos_ids(self.request)
        if not cursos_ids or int(curso_id) not in {int(c) for c in cursos_ids}:
            raise PermissionDenied('No tienes permiso para modificar horarios de este curso.')

    def perform_create(self, serializer):
        instance = serializer.save()
        self._check_preceptor_curso_access(instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        self._check_preceptor_curso_access(instance)

    def perform_destroy(self, instance):
        self._check_preceptor_curso_access(instance)
        instance.delete()


class InscripcionMateriaViewSet(viewsets.ModelViewSet):
    queryset = InscripcionMateria.objects.select_related(
        'id_alumno', 'id_curso_materia',
    ).all()
    serializer_class = InscripcionMateriaSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        alumno = self.request.query_params.get('alumno')
        if alumno:
            qs = qs.filter(id_alumno=alumno)
        return qs


class PeriodoEvaluacionViewSet(viewsets.ModelViewSet):
    queryset = PeriodoEvaluacion.objects.all()
    serializer_class = PeriodoEvaluacionSerializer


class CalificacionViewSet(viewsets.ModelViewSet):
    queryset = Calificacion.objects.select_related(
        'id_alumno', 'id_curso_materia__id_materia',
        'id_curso_materia__id_curso', 'id_docente', 'id_periodo',
    ).all()
    serializer_class = CalificacionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        alumno = self.request.query_params.get('alumno')
        curso = self.request.query_params.get('curso')
        materia = self.request.query_params.get('materia')
        docente = self.request.query_params.get('docente')
        curso_materia = self.request.query_params.get('curso_materia')
        if alumno:
            qs = qs.filter(id_alumno=alumno)
        if curso:
            qs = qs.filter(id_curso_materia__id_curso=curso)
        if materia:
            qs = qs.filter(id_curso_materia__id_materia=materia)
        if docente:
            qs = qs.filter(id_docente=docente)
        if curso_materia:
            qs = qs.filter(id_curso_materia=curso_materia)
        return qs


class EstadoAsistenciaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EstadoAsistencia.objects.all()
    serializer_class = EstadoAsistenciaSerializer


DIAS_SEMANA_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

def _dia_semana_es(dt=None):
    dt = dt or datetime.now()
    return DIAS_SEMANA_ES[dt.weekday()]  # 0=Lunes


class AsistenciaViewSet(viewsets.ModelViewSet):
    queryset = Asistencia.objects.select_related(
        'id_alumno', 'id_curso_materia__id_materia',
        'id_curso_materia__id_curso', 'id_estado_asistencia',
    ).all()
    serializer_class = AsistenciaSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        alumno = self.request.query_params.get('alumno')
        curso = self.request.query_params.get('curso')
        fecha = self.request.query_params.get('fecha')
        curso_materia = self.request.query_params.get('curso_materia')
        if alumno:
            qs = qs.filter(id_alumno=alumno)
        if curso:
            qs = qs.filter(id_curso_materia__id_curso=curso)
        if fecha:
            qs = qs.filter(fecha=fecha)
        if curso_materia:
            qs = qs.filter(id_curso_materia=curso_materia)
        return qs

    @action(detail=False, methods=['get'], url_path='server-time')
    def server_time(self, request):
        ahora = datetime.now()
        dia = _dia_semana_es(ahora)
        data = {
            'fecha': ahora.strftime('%Y-%m-%d'),
            'hora': ahora.strftime('%H:%M:%S'),
            'dia_semana': dia,
        }
        cm_id = request.query_params.get('curso_materia')
        if cm_id:
            horarios_hoy = self._horarios_hoy(cm_id, dia)
            data['horarios_hoy'] = horarios_hoy
            data['estado'] = self._estado_horario(horarios_hoy, ahora)
        return Response(data)

    def _horarios_hoy(self, curso_materia_id, dia_semana):
        """Retorna lista de dicts con hora_inicio y hora_fin para hoy."""
        horarios = []
        qs = Horario.objects.filter(
            id_curso_materia=curso_materia_id,
            dia_semana=dia_semana,
        ).select_related('id_modulo')
        for h in qs:
            if h.id_modulo:
                horarios.append({
                    'hora_inicio': h.id_modulo.hora_inicio.strftime('%H:%M'),
                    'hora_fin': h.id_modulo.hora_fin.strftime('%H:%M'),
                })
        qs_esp = HorariosEspeciales.objects.filter(
            id_curso_materia=curso_materia_id,
            dia_semana=dia_semana,
        )
        for h in qs_esp:
            horarios.append({
                'hora_inicio': h.hora_inicio.strftime('%H:%M'),
                'hora_fin': h.hora_fin.strftime('%H:%M'),
            })
        horarios.sort(key=lambda x: x['hora_inicio'])
        return horarios

    def _estado_horario(self, horarios_hoy, ahora):
        """Determina el estado: sin_clases, esperando, en_horario, terminado."""
        if not horarios_hoy:
            return {'codigo': 'sin_clases', 'mensaje': 'Esta materia no tiene clases programadas para hoy.'}
        hora_actual = ahora.strftime('%H:%M')
        primero = horarios_hoy[0]
        ultimo = horarios_hoy[-1]
        if hora_actual < primero['hora_inicio']:
            return {
                'codigo': 'esperando',
                'mensaje': f'Las clases comienzan a las {primero["hora_inicio"]}. Actualmente son las {hora_actual}.',
                'proximo_inicio': primero['hora_inicio'],
            }
        if hora_actual >= ultimo['hora_fin']:
            return {
                'codigo': 'terminado',
                'mensaje': f'El horario de clases finalizó a las {ultimo["hora_fin"]}. Actualmente son las {hora_actual}.',
            }
        for h in horarios_hoy:
            if h['hora_inicio'] <= hora_actual < h['hora_fin']:
                return {'codigo': 'en_horario', 'mensaje': 'Dentro del horario de clase.'}
        return {
            'codigo': 'esperando',
            'mensaje': f'Próximo módulo comienza a las {primero["hora_inicio"]}.',
            'proximo_inicio': primero['hora_inicio'],
        }

    @action(detail=False, methods=['get'], url_path='alumno-detalle')
    def alumno_detalle(self, request):
        roles = get_roles_for_usuario(request.user.username)
        try:
            usuario = Usuario.objects.get(usuario=request.user.username)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        if 'alumno' in roles:
            try:
                alumno = Alumno.objects.get(id_usuario=usuario)
            except Alumno.DoesNotExist:
                return Response({'error': 'Alumno no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        elif 'familia' in roles:
            alumno_id = request.query_params.get('id_alumno')
            if not alumno_id:
                return Response({'error': 'Se requiere id_alumno.'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                tutor = PadreTutor.objects.get(id_usuario=usuario)
                alumno = Alumno.objects.get(id_alumno=alumno_id, id_tutor=tutor)
            except (PadreTutor.DoesNotExist, Alumno.DoesNotExist):
                return Response({'error': 'Alumno no encontrado o no autorizado.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'Acceso no autorizado.'}, status=status.HTTP_403_FORBIDDEN)
        qs = Asistencia.objects.filter(id_alumno=alumno).select_related(
            'id_curso_materia__id_materia',
            'id_curso_materia__id_docente',
            'id_estado_asistencia',
        )
        cm_id = request.query_params.get('curso_materia')
        if cm_id:
            qs = qs.filter(id_curso_materia=cm_id)
        qs = qs.order_by('-fecha', '-hora')
        result = []
        for a in qs:
            dia_semana = DIAS_SEMANA_ES[a.fecha.weekday()]
            modulo_info = self._resolver_modulo(a, dia_semana)
            docente = getattr(a.id_curso_materia, 'id_docente', None)
            if docente:
                docente_nombre = f'{docente.nombre} {docente.apellido}'
            else:
                docente_nombre = '-'
            result.append({
                'id': a.id_asistencia,
                'fecha': a.fecha.strftime('%Y-%m-%d'),
                'hora': a.hora.strftime('%H:%M') if a.hora else '',
                'materia_nombre': a.id_curso_materia.id_materia.nombre_materia
                if a.id_curso_materia.id_materia else '-',
                'docente_nombre': docente_nombre,
                'estado_nombre': a.id_estado_asistencia.nombre_estado
                if a.id_estado_asistencia else '-',
                'horario': modulo_info.get('horario') if modulo_info else '-',
            })
        return Response(result)

    @action(detail=False, methods=['get'], url_path='preceptor-materia')
    def preceptor_materia(self, request):
        roles = get_roles_for_usuario(request.user.username)
        if 'preceptor' not in roles:
            return Response({'error': 'Solo preceptores.'}, status=status.HTTP_403_FORBIDDEN)
        cursos_ids = _preceptor_cursos_ids(request)
        if not cursos_ids:
            return Response({'error': 'Preceptor sin cursos asignados.'}, status=status.HTTP_403_FORBIDDEN)

        cm_id = request.query_params.get('curso_materia')
        fecha_str = request.query_params.get('fecha')
        if not cm_id or not fecha_str:
            return Response({'error': 'Se requiere curso_materia y fecha.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cm = CursoMateria.objects.get(id_curso_materia=cm_id)
        except CursoMateria.DoesNotExist:
            return Response({'error': 'Materia no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        if cm.id_curso_id not in cursos_ids:
            return Response({'error': 'No autorizado para esta materia.'}, status=status.HTTP_403_FORBIDDEN)

        qs = Asistencia.objects.filter(
            id_curso_materia=cm_id, fecha=fecha_str,
        ).select_related(
            'id_alumno', 'id_curso_materia__id_materia',
            'id_curso_materia__id_docente', 'id_estado_asistencia',
        ).order_by('id_alumno__apellido', 'id_alumno__nombre')

        dia_semana = DIAS_SEMANA_ES[datetime.strptime(fecha_str, '%Y-%m-%d').weekday()]

        result = []
        for a in qs:
            horario = self._resolver_modulo(a, dia_semana)
            docente = getattr(a.id_curso_materia, 'id_docente', None)
            result.append({
                'id': a.id_asistencia,
                'id_alumno': a.id_alumno_id,
                'alumno_nombre': f'{a.id_alumno.apellido}, {a.id_alumno.nombre}',
                'horario': horario.get('horario') if horario else '-',
                'docente_nombre': f'{docente.nombre} {docente.apellido}' if docente else '-',
                'estado_nombre': a.id_estado_asistencia.nombre_estado if a.id_estado_asistencia else '-',
                'hora_carga': a.hora.strftime('%H:%M') if a.hora else '',
                'justificado': a.justificado,
            })

        alumnos_del_curso = Alumno.objects.filter(
            id_curso=cm.id_curso_id,
        ).select_related('id_usuario').order_by('apellido', 'nombre')

        ids_encontrados = {r['id_alumno'] for r in result}
        for al in alumnos_del_curso:
            if al.id_alumno not in ids_encontrados:
                result.append({
                    'id': None,
                    'id_alumno': al.id_alumno,
                    'alumno_nombre': f'{al.apellido}, {al.nombre}',
                    'horario': '-',
                    'docente_nombre': '-',
                    'estado_nombre': 'Sin registro',
                    'hora_carga': '',
                    'justificado': False,
                })

        result.sort(key=lambda r: r['alumno_nombre'])
        return Response(result)

    @action(detail=True, methods=['patch'], url_path='justificar')
    def justificar(self, request, pk=None):
        roles = get_roles_for_usuario(request.user.username)
        if 'preceptor' not in roles:
            return Response({'error': 'Solo preceptores.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            asistencia = Asistencia.objects.get(pk=pk)
        except Asistencia.DoesNotExist:
            return Response({'error': 'Asistencia no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        cursos_ids = _preceptor_cursos_ids(request)
        cm = asistencia.id_curso_materia
        if cm.id_curso_id not in cursos_ids:
            return Response({'error': 'No autorizado para modificar esta asistencia.'}, status=status.HTTP_403_FORBIDDEN)

        justificado = request.data.get('justificado')
        if justificado is None:
            return Response({'error': 'Se requiere justificado.'}, status=status.HTTP_400_BAD_REQUEST)

        asistencia.justificado = bool(justificado)
        asistencia.save(update_fields=['justificado'])
        return Response({'id': asistencia.id_asistencia, 'justificado': asistencia.justificado})

    def _resolver_modulo(self, asistencia, dia_semana):
        cm_id = asistencia.id_curso_materia_id
        hora = asistencia.hora

        def _expandir(times, idx):
            s = e = idx
            while s > 0 and times[s - 1][1] == times[s][0]:
                s -= 1
            while e < len(times) - 1 and times[e][1] == times[e + 1][0]:
                e += 1
            return s, e

        horarios = list(Horario.objects.filter(
            id_curso_materia=cm_id, dia_semana=dia_semana,
            id_modulo__isnull=False,
        ).select_related('id_modulo').order_by('id_modulo__hora_inicio'))

        for i, h in enumerate(horarios):
            hi, hf = h.id_modulo.hora_inicio, h.id_modulo.hora_fin
            if hi is not None and hf is not None and hi <= hora < hf:
                times = [(x.id_modulo.hora_inicio, x.id_modulo.hora_fin) for x in horarios]
                s, e = _expandir(times, i)
                return {'horario': f'{times[s][0].strftime("%H:%M")} - {times[e][1].strftime("%H:%M")}'}

        hor_esp = list(HorariosEspeciales.objects.filter(
            id_curso_materia=cm_id, dia_semana=dia_semana,
        ).order_by('hora_inicio'))

        for i, h in enumerate(hor_esp):
            if h.hora_inicio <= hora < h.hora_fin:
                times = [(x.hora_inicio, x.hora_fin) for x in hor_esp]
                s, e = _expandir(times, i)
                return {'horario': f'{times[s][0].strftime("%H:%M")} - {times[e][1].strftime("%H:%M")}'}

        return None

    def create(self, request, *args, **kwargs):
        ahora = datetime.now()
        dia = _dia_semana_es(ahora)
        cm_id = request.data.get('id_curso_materia')
        if not cm_id:
            return Response({'error': 'id_curso_materia es requerido.'}, status=status.HTTP_400_BAD_REQUEST)
        horarios_hoy = self._horarios_hoy(cm_id, dia)
        estado = self._estado_horario(horarios_hoy, ahora)
        if estado['codigo'] != 'en_horario':
            return Response({'error': estado['mensaje']}, status=status.HTTP_403_FORBIDDEN)
        data = {
            'id_alumno': request.data.get('id_alumno'),
            'id_curso_materia': cm_id,
            'id_estado_asistencia': request.data.get('id_estado_asistencia'),
            'fecha': ahora.date(),
            'hora': ahora.time(),
            'id_usuario': request.user.id_usuario if hasattr(request.user, 'id_usuario') else request.user.id,
        }
        existing = Asistencia.objects.filter(
            id_alumno=data['id_alumno'],
            id_curso_materia=data['id_curso_materia'],
            fecha=data['fecha'],
        ).first()
        if existing:
            serializer = self.get_serializer(existing, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TipoActaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TipoActa.objects.all()
    serializer_class = TipoActaSerializer


class ActaViewSet(viewsets.ModelViewSet):
    queryset = Acta.objects.select_related(
        'id_usuario_creador', 'id_tipo_acta',
    ).all()
    serializer_class = ActaSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        curso = self.request.query_params.get('curso')
        alumno = self.request.query_params.get('alumno')
        if curso:
            acta_ids = ActaCurso.objects.filter(
                id_curso=curso,
            ).values_list('id_acta', flat=True)
            qs = qs.filter(id_acta__in=acta_ids)
        if alumno:
            acta_ids = ActaAlumno.objects.filter(
                id_alumno=alumno,
            ).values_list('id_acta', flat=True)
            qs = qs.filter(id_acta__in=acta_ids)
        return qs


class ActaAlumnoViewSet(viewsets.ModelViewSet):
    queryset = ActaAlumno.objects.select_related('id_acta', 'id_alumno').all()
    serializer_class = ActaAlumnoSerializer


class ActaCursoViewSet(viewsets.ModelViewSet):
    queryset = ActaCurso.objects.select_related('id_acta', 'id_curso').all()
    serializer_class = ActaCursoSerializer


class ActaDocenteViewSet(viewsets.ModelViewSet):
    queryset = ActaDocente.objects.select_related('id_acta', 'id_docente').all()
    serializer_class = ActaDocenteSerializer


class ComunicadoViewSet(viewsets.ModelViewSet):
    queryset = Comunicado.objects.select_related(
        'id_usuario_creador', 'id_curso__id_ciclo', 'id_materia',
    ).prefetch_related('archivos', 'alcances').all()
    serializer_class = ComunicadoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        return _filter_visible_comunicados(self.request, qs)

class ComunicadoArchivoViewSet(viewsets.ModelViewSet):
    queryset = ComunicadoArchivo.objects.select_related('id_comunicado').all()
    serializer_class = ComunicadoArchivoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        comunicados_visibles = _filter_visible_comunicados(self.request, Comunicado.objects.prefetch_related('alcances').all())
        ids_visibles = list(comunicados_visibles.values_list('id_comunicado', flat=True))
        return qs.filter(id_comunicado__in=ids_visibles)


class PlanificacionViewSet(viewsets.ModelViewSet):
    queryset = Planificacion.objects.select_related(
        'id_docente', 'id_curso_materia',
    ).all()
    serializer_class = PlanificacionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        docente = self.request.query_params.get('docente')
        curso_materia = self.request.query_params.get('curso_materia')
        if docente:
            qs = qs.filter(id_docente=docente)
        if curso_materia:
            qs = qs.filter(id_curso_materia=curso_materia)
        return qs


class DiagnosticoGrupalViewSet(viewsets.ModelViewSet):
    queryset = DiagnosticoGrupal.objects.select_related(
        'id_curso', 'id_docente',
    ).all()
    serializer_class = DiagnosticoGrupalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        curso = self.request.query_params.get('curso')
        docente = self.request.query_params.get('docente')
        if curso:
            qs = qs.filter(id_curso=curso)
        if docente:
            qs = qs.filter(id_docente=docente)

        # Permission filtering based on user role
        from escuela.auth_backend import get_roles_for_usuario
        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            return qs.none()

        roles = get_roles_for_usuario(username)
        usuario_obj = Usuario.objects.filter(usuario=username).first()

        if 'admin' in roles or 'director' in roles:
            # Administrators and directors can see all diagnostics
            return qs

        if 'alumno' in roles and usuario_obj:
            # Students can see diagnostics for their course
            alumno = Alumno.objects.filter(id_usuario=usuario_obj.id_usuario).first()
            if alumno:
                mi_curso_id = alumno.id_curso
                qs = qs.filter(id_curso=mi_curso_id)
            else:
                qs = qs.none()

        elif 'familia' in roles and usuario_obj:
            # Families can see diagnostics from their linked students' courses
            tutor = PadreTutor.objects.filter(id_usuario=usuario_obj.id_usuario).first()
            if tutor:
                hijos = Alumno.objects.filter(id_tutor=tutor.id_tutor)
                cursos_hijos_ids = list(hijos.values_list('id_curso', flat=True))
                qs = qs.filter(id_curso__in=cursos_hijos_ids)
            else:
                qs = qs.none()

        elif 'docente' in roles and usuario_obj:
            # Teachers can only see diagnostics for courses where they have assignments
            docente = Docente.objects.filter(id_usuario=usuario_obj.id_usuario).first()
            if docente:
                # Get all courses where this docente has assignments (via CursoMateria)
                cursos_asignados = CursoMateria.objects.filter(id_docente=docente.id_docente).values_list('id_curso', flat=True)
                qs = qs.filter(id_curso__in=cursos_asignados)
            else:
                qs = qs.none()

        return qs

    def perform_create(self, serializer):
        # Validate that the docente can only create diagnostics for courses they have assignments in
        from escuela.auth_backend import get_roles_for_usuario
        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            raise PermissionError("Usuario no autenticado")

        roles = get_roles_for_usuario(username)
        usuario_obj = Usuario.objects.filter(usuario=username).first()

        if 'admin' not in roles and 'director' not in roles and 'docente' not in roles:
            raise PermissionError("Solo docentes, administradores y directores pueden crear diagnÃ³sticos")

        if 'docente' in roles and usuario_obj:
            docente = Docente.objects.filter(id_usuario=usuario_obj.id_usuario).first()
            if not docente:
                raise PermissionError("No se encontrÃ³ el perfil de docente")

            # Get the course from the request data
            id_curso = self.request.data.get('id_curso')
            if not id_curso:
                raise PermissionError("Se debe especificar un curso")

            # Check if docente has assignments in this course
            has_assignment = CursoMateria.objects.filter(
                id_docente=docente.id_docente,
                id_curso=id_curso
            ).exists()

            if not has_assignment:
                raise PermissionError("No tenÃ©s asignaciones en este curso. No podÃ©s crear diagnÃ³sticos para Ã©l.")

            # Set the docente to the current user
            serializer.save(id_docente=docente)
        else:
            # Admin can create for any course
            serializer.save()


class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.all()
    serializer_class = NotificacionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        usuario = self.request.query_params.get('usuario')
        if usuario:
            qs = qs.filter(id_usuario=usuario)
        return qs

    @action(detail=True, methods=['patch'])
    def marcar_leida(self, request, pk=None):
        notif = self.get_object()
        notif.leida = True
        notif.save()
        return Response(NotificacionSerializer(notif).data)


class TipoAccionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TipoAccion.objects.all()
    serializer_class = TipoAccionSerializer


class HistorialCambioViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HistorialCambio.objects.select_related(
        'id_usuario', 'id_tipo_accion',
    ).all()
    serializer_class = HistorialCambioSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_file(request):
    import os
    from django.conf import settings

    archivo = request.FILES.get('archivo')
    if not archivo:
        return Response({'error': 'No se enviÃ³ ningÃºn archivo.'}, status=400)

    carpeta = request.data.get('carpeta', 'general')
    dest_dir = os.path.join(settings.MEDIA_ROOT, carpeta)
    os.makedirs(dest_dir, exist_ok=True)

    nombre = archivo.name
    ruta = os.path.join(dest_dir, nombre)
    counter = 1
    base, ext = os.path.splitext(nombre)
    while os.path.exists(ruta):
        nombre = f'{base}_{counter}{ext}'
        ruta = os.path.join(dest_dir, nombre)
        counter += 1

    with open(ruta, 'wb+') as f:
        for chunk in archivo.chunks():
            f.write(chunk)

    url = f'{settings.MEDIA_URL}{carpeta}/{nombre}'
    return Response({'url': url, 'nombre': nombre})


