from django.contrib.auth import authenticate
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
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
    Calificacion,
    CicloLectivo,
    Comunicado,
    ComunicadoArchivo,
    Curso,
    CursoMateria,
    DiagnosticoGrupal,
    Directivo,
    Docente,
    EstadoAsistencia,
    HistorialCambio,
    Horario,
    InscripcionMateria,
    Materia,
    Notificacion,
    PadreTutor,
    PeriodoEvaluacion,
    Planificacion,
    Preceptor,
    Rol,
    TipoAccion,
    TipoActa,
    Usuario,
)
from escuela.serializers import (
    ActaAlumnoSerializer,
    ActaCursoSerializer,
    ActaDocenteSerializer,
    ActaSerializer,
    ComunicadoArchivoSerializer,
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
    InscripcionMateriaSerializer,
    LoginSerializer,
    MateriaSerializer,
    NotificacionSerializer,
    PadreTutorSerializer,
    PeriodoEvaluacionSerializer,
    PlanificacionSerializer,
    PreceptorSerializer,
    RolSerializer,
    TipoAccionSerializer,
    TipoActaSerializer,
    UsuarioSerializer,
)


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

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response(
            {'error': 'Credenciales inválidas'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    roles = get_roles_for_usuario(username)

    refresh = RefreshToken.for_user(user)
    usuario_obj = Usuario.objects.filter(usuario=username).first()
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
        curso_id = self.request.query_params.get('curso')
        if curso_id:
            qs = qs.filter(id_curso=curso_id)
        return qs


class DocenteViewSet(viewsets.ModelViewSet):
    queryset = Docente.objects.select_related('id_usuario').all()
    serializer_class = DocenteSerializer


class PreceptorViewSet(viewsets.ModelViewSet):
    queryset = Preceptor.objects.select_related('id_usuario').all()
    serializer_class = PreceptorSerializer


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
        ciclo = self.request.query_params.get('ciclo')
        if ciclo:
            qs = qs.filter(id_ciclo=ciclo)
        return qs


class MateriaViewSet(viewsets.ModelViewSet):
    queryset = Materia.objects.all()
    serializer_class = MateriaSerializer


class CursoMateriaViewSet(viewsets.ModelViewSet):
    queryset = CursoMateria.objects.select_related(
        'id_curso', 'id_materia', 'id_docente',
    ).all()
    serializer_class = CursoMateriaSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        curso = self.request.query_params.get('curso')
        docente = self.request.query_params.get('docente')
        if curso:
            qs = qs.filter(id_curso=curso)
        if docente:
            qs = qs.filter(id_docente=docente)
        return qs


class HorarioViewSet(viewsets.ModelViewSet):
    queryset = Horario.objects.select_related('id_curso_materia').all()
    serializer_class = HorarioSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        curso_materia = self.request.query_params.get('curso_materia')
        if curso_materia:
            qs = qs.filter(id_curso_materia=curso_materia)
        return qs


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
        modo = self.request.query_params.get('modo')
        if alumno:
            qs = qs.filter(id_alumno=alumno)
        if curso:
            qs = qs.filter(id_curso_materia__id_curso=curso)
        if fecha:
            qs = qs.filter(fecha=fecha)
        if curso_materia:
            qs = qs.filter(id_curso_materia=curso_materia)
        if modo == 'general':
            qs = qs.filter(numero_modulo__isnull=True)
        elif modo == 'materia':
            qs = qs.filter(numero_modulo__isnull=False)
        return qs

    def create(self, request, *args, **kwargs):
        """Upsert: evita duplicados por (alumno, curso_materia, fecha, modulo).

        Si ya existe una asistencia para esa combinación, la actualiza en lugar
        de crear una nueva. numero_modulo NULL = general; con valor = por materia.
        """
        data = request.data
        numero_modulo = data.get('numero_modulo')
        existing = Asistencia.objects.filter(
            id_alumno=data.get('id_alumno'),
            id_curso_materia=data.get('id_curso_materia'),
            fecha=data.get('fecha'),
            numero_modulo=numero_modulo if numero_modulo not in ('', None) else None,
        ).first()
        if existing:
            serializer = self.get_serializer(existing, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)


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
        'id_curso', 'id_materia',
    ).prefetch_related('archivos').all()
    serializer_class = ComunicadoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        curso = self.request.query_params.get('curso')
        if curso:
            qs = qs.filter(id_curso=curso)
        return qs


class ComunicadoArchivoViewSet(viewsets.ModelViewSet):
    queryset = ComunicadoArchivo.objects.all()
    serializer_class = ComunicadoArchivoSerializer


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

    def get_queryset(self):
        qs = super().get_queryset()
        curso = self.request.query_params.get('curso')
        docente = self.request.query_params.get('docente')
        if curso:
            qs = qs.filter(id_curso=curso)
        if docente:
            qs = qs.filter(id_docente=docente)
        return qs


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
        return Response({'error': 'No se envió ningún archivo.'}, status=400)

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
