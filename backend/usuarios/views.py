from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.db.models import Q

from .models import (
    Usuario, Rol, UsuarioRol, Preceptor, Docente,
    Alumno, PadreTutor, Directivo, Curso, CicloLectivo,
    Materia, CursoMateria, Horario
)
from .serializers import (
    UsuarioSerializer, RolSerializer, LoginSerializer, TokenResponseSerializer,
    DocenteSerializer, PreceptorSerializer, AlumnoSerializer, PadreTutorSerializer,
    CursoSerializer, MateriaSerializer, CursoMateriaSerializer,
    PerfilDocenteSerializer, PerfilAlumnoSerializer, PerfilFamiliaSerializer,
    UsuarioDetailSerializer, HorarioSerializer
)


# ==========================================
# VISTAS DE AUTENTICACIÓN
# ==========================================

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    Endpoint de login. Recibe usuario y contraseña, retorna tokens JWT
    y datos del usuario con sus roles.
    
    POST /api/auth/login/
    {
        "usuario": "admin",
        "contrasena": "password123"
    }
    """
    serializer = LoginSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {'error': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    usuario = serializer.validated_data['usuario_obj']
    
    # Actualizar último acceso
    usuario.ultimo_acceso = timezone.now()
    usuario.save(update_fields=['ultimo_acceso'])
    
    # Generar tokens JWT
    refresh = RefreshToken.for_user(usuario)
    
    # Obtener rol principal (el primero)
    rol_actual = usuario.roles.first().nombre_rol if usuario.roles.exists() else 'sin_rol'
    
    # Construir respuesta
    usuario_data = UsuarioSerializer(usuario).data
    response_data = {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'usuario': usuario_data,
        'rol_actual': rol_actual,
    }
    
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def refresh_token_view(request):
    """
    Endpoint para refrescar el access token usando el refresh token.
    
    POST /api/auth/refresh/
    {
        "refresh": "token_refresh"
    }
    """
    try:
        refresh = RefreshToken(request.data.get('refresh'))
        return Response({
            'access': str(refresh.access_token)
        })
    except Exception as e:
        return Response(
            {'error': 'Token inválido o expirado'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    Endpoint de logout (simplemente valida el token)
    """
    return Response(
        {'mensaje': 'Sesión cerrada correctamente'},
        status=status.HTTP_200_OK
    )


# ==========================================
# VISTAS DE USUARIOS Y PERMISOS
# ==========================================

class UsuarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de usuarios.
    Solo administradores pueden crear/actualizar/eliminar usuarios.
    """
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar usuarios según el rol del usuario autenticado"""
        user = self.request.user
        
        # Verificar si es admin
        if self._is_admin(user):
            return Usuario.objects.all()
        
        # El usuario solo ve su propia información
        return Usuario.objects.filter(id_usuario=user.id_usuario)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioDetailSerializer
        return UsuarioSerializer
    
    def create(self, request, *args, **kwargs):
        """Solo administradores pueden crear usuarios"""
        if not self._is_admin(request.user):
            return Response(
                {'error': 'No tienes permisos para crear usuarios'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Solo administradores pueden eliminar usuarios"""
        if not self._is_admin(request.user):
            return Response(
                {'error': 'No tienes permisos para eliminar usuarios'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['GET'])
    def me(self, request):
        """
        Obtener datos del usuario autenticado actual
        GET /api/usuarios/me/
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @staticmethod
    def _is_admin(user):
        """Verificar si el usuario tiene rol de admin"""
        return user.roles.filter(nombre_rol='admin').exists()


class RolViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de lectura para roles.
    Todos los usuarios autenticados pueden ver los roles.
    """
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [permissions.IsAuthenticated]


# ==========================================
# VISTAS DE DOCENTES
# ==========================================

class DocenteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de docentes.
    """
    queryset = Docente.objects.all()
    serializer_class = DocenteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['dni', 'correo']
    search_fields = ['nombre', 'apellido', 'dni']
    
    def get_queryset(self):
        """Filtrar según permisos"""
        user = self.request.user
        
        # Admin ve todos
        if user.roles.filter(nombre_rol='admin').exists():
            return Docente.objects.all()
        
        # Preceptor ve docentes de su escuela
        if user.roles.filter(nombre_rol='preceptor').exists():
            try:
                preceptor = Preceptor.objects.get(id_usuario=user)
                cursos = Curso.objects.filter(id_preceptor=preceptor)
                docentes_ids = CursoMateria.objects.filter(
                    id_curso__in=cursos
                ).values_list('id_docente', flat=True)
                return Docente.objects.filter(id_docente__in=docentes_ids).distinct()
            except:
                return Docente.objects.none()
        
        # Docente solo ve su propia info
        if user.roles.filter(nombre_rol='docente').exists():
            try:
                docente = Docente.objects.get(id_usuario=user)
                return Docente.objects.filter(id_docente=docente.id_docente)
            except:
                return Docente.objects.none()
        
        return Docente.objects.none()
    
    @action(detail=False, methods=['GET'])
    def me(self, request):
        """
        Obtener perfil completo del docente autenticado
        GET /api/docentes/me/
        """
        try:
            docente = Docente.objects.get(id_usuario=request.user)
            serializer = PerfilDocenteSerializer(docente)
            return Response(serializer.data)
        except Docente.DoesNotExist:
            return Response(
                {'error': 'No se encontró perfil de docente'},
                status=status.HTTP_404_NOT_FOUND
            )


# ==========================================
# VISTAS DE ALUMNOS
# ==========================================

class AlumnoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de alumnos.
    """
    queryset = Alumno.objects.all()
    serializer_class = AlumnoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['dni', 'id_curso']
    search_fields = ['nombre', 'apellido', 'dni']
    
    def get_queryset(self):
        """Filtrar según permisos"""
        user = self.request.user
        
        # Admin ve todos
        if user.roles.filter(nombre_rol='admin').exists():
            return Alumno.objects.all()
        
        # Preceptor ve alumnos de sus cursos
        if user.roles.filter(nombre_rol='preceptor').exists():
            try:
                preceptor = Preceptor.objects.get(id_usuario=user)
                return Alumno.objects.filter(id_curso__id_preceptor=preceptor)
            except:
                return Alumno.objects.none()
        
        # Docente ve alumnos de sus clases
        if user.roles.filter(nombre_rol='docente').exists():
            try:
                docente = Docente.objects.get(id_usuario=user)
                cursos_materias = CursoMateria.objects.filter(id_docente=docente)
                alumnos_ids = set()
                for cm in cursos_materias:
                    alumnos_ids.update(
                        Alumno.objects.filter(id_curso=cm.id_curso).values_list('id_alumno', flat=True)
                    )
                return Alumno.objects.filter(id_alumno__in=alumnos_ids)
            except:
                return Alumno.objects.none()
        
        # Familia solo ve a sus hijos
        if user.roles.filter(nombre_rol='familia').exists():
            try:
                tutor = PadreTutor.objects.get(id_usuario=user)
                return Alumno.objects.filter(id_tutor=tutor)
            except:
                return Alumno.objects.none()
        
        # Alumno solo ve su propia información
        if user.roles.filter(nombre_rol='alumno').exists():
            try:
                alumno = Alumno.objects.get(id_usuario=user)
                return Alumno.objects.filter(id_alumno=alumno.id_alumno)
            except:
                return Alumno.objects.none()
        
        return Alumno.objects.none()
    
    @action(detail=False, methods=['GET'])
    def me(self, request):
        """
        Obtener perfil completo del alumno autenticado
        GET /api/alumnos/me/
        """
        try:
            alumno = Alumno.objects.get(id_usuario=request.user)
            serializer = PerfilAlumnoSerializer(alumno)
            return Response(serializer.data)
        except Alumno.DoesNotExist:
            return Response(
                {'error': 'No se encontró perfil de alumno'},
                status=status.HTTP_404_NOT_FOUND
            )


# ==========================================
# VISTAS DE PADRES/TUTORES
# ==========================================

class PadreTutorViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de padres/tutores.
    """
    queryset = PadreTutor.objects.all()
    serializer_class = PadreTutorSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['dni']
    search_fields = ['nombre', 'apellido', 'dni']
    
    def get_queryset(self):
        """Filtrar según permisos"""
        user = self.request.user
        
        # Admin ve todos
        if user.roles.filter(nombre_rol='admin').exists():
            return PadreTutor.objects.all()
        
        # Familia solo ve su propia información
        if user.roles.filter(nombre_rol='familia').exists():
            try:
                tutor = PadreTutor.objects.get(id_usuario=user)
                return PadreTutor.objects.filter(id_tutor=tutor.id_tutor)
            except:
                return PadreTutor.objects.none()
        
        return PadreTutor.objects.none()
    
    @action(detail=False, methods=['GET'])
    def me(self, request):
        """
        Obtener perfil completo del padre/tutor autenticado con sus hijos
        GET /api/padres/me/
        """
        try:
            tutor = PadreTutor.objects.get(id_usuario=request.user)
            serializer = PerfilFamiliaSerializer(tutor)
            return Response(serializer.data)
        except PadreTutor.DoesNotExist:
            return Response(
                {'error': 'No se encontró perfil de padre/tutor'},
                status=status.HTTP_404_NOT_FOUND
            )


# ==========================================
# VISTAS DE CURSOS Y MATERIAS
# ==========================================

class CursoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de lectura para cursos.
    """
    queryset = Curso.objects.all()
    serializer_class = CursoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['id_ciclo']
    search_fields = ['nombre_curso', 'turno']


class MateriaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de lectura para materias.
    """
    queryset = Materia.objects.all()
    serializer_class = MateriaSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['nombre_materia']


class CursoMateriaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de lectura para la relación curso-materia-docente.
    """
    queryset = CursoMateria.objects.all()
    serializer_class = CursoMateriaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['id_curso', 'id_docente']


class CicloLectivoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de lectura para ciclos lectivos.
    """
    from .serializers import CicloLectivoSerializer
    
    queryset = CicloLectivo.objects.all()
    serializer_class = CicloLectivoSerializer
    permission_classes = [permissions.IsAuthenticated]

