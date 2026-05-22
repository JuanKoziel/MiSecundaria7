from datetime import date

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    ActaAlumno,
    ActaCurso,
    Alumno,
    AsistenciaClase,
    AsistenciaDiaria,
    Calificacion,
    Comunicado,
    NotaPreceptor,
    SesionClase,
    VinculoFamilia,
)
from .permissions import get_role, IsAdmin, IsDocenteOrAdmin, IsPreceptorOrAdmin, IsStaffEscuela
from .serializers import (
    ActaAlumnoSerializer,
    ActaCursoSerializer,
    AlumnoSerializer,
    AsistenciaDiariaBulkSerializer,
    AsistenciaDiariaSerializer,
    CalificacionBulkSerializer,
    CalificacionSerializer,
    ComunicadoSerializer,
    DocenteSerializer,
    LoginSerializer,
    NotaPreceptorBulkSerializer,
    NotaPreceptorSerializer,
    SesionClaseSerializer,
    SesionClaseWriteSerializer,
    UserSerializer,
    VinculoFamiliaSerializer,
)

CURSOS = [
    '1°1', '1°2', '1°3', '2°1', '2°2', '2°3', '3°1', '3°2', '3°3',
    '4°1', '4°2', '4°3', '5°1', '5°2', '5°3', '6°1', '6°2', '6°3',
]
MATERIAS = ['Matemática', 'Lengua y Lit.', 'Física', 'Química']


def alumnos_para_familia(user):
    ids = VinculoFamilia.objects.filter(usuario=user).values_list('alumno_id', flat=True)
    return Alumno.objects.filter(id__in=ids)


def puede_ver_alumno(user, alumno_id):
    role = get_role(user)
    if role in ('admin', 'preceptor', 'docente'):
        return True
    if role == 'familia':
        return VinculoFamilia.objects.filter(usuario=user, alumno_id=alumno_id).exists()
    return False


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
        })


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class CatalogosView(APIView):
    def get(self, request):
        return Response({'cursos': CURSOS, 'materias': MATERIAS})


class AlumnoListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_role(request.user)
        curso = request.query_params.get('curso')
        qs = Alumno.objects.all()
        if role == 'familia':
            qs = alumnos_para_familia(request.user)
        if curso:
            qs = qs.filter(curso=curso)
        return Response(AlumnoSerializer(qs, many=True).data)


class DocenteListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = User.objects.filter(perfil__role='docente').select_related('perfil')
        return Response(DocenteSerializer(qs, many=True).data)


class CalificacionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        curso = request.query_params.get('curso')
        materia = request.query_params.get('materia')
        alumno_id = request.query_params.get('alumno_id')
        qs = Calificacion.objects.select_related('alumno')
        role = get_role(request.user)
        if role == 'familia':
            qs = qs.filter(alumno__in=alumnos_para_familia(request.user))
        if alumno_id:
            if not puede_ver_alumno(request.user, int(alumno_id)):
                return Response({'detail': 'Sin permiso.'}, status=403)
            qs = qs.filter(alumno_id=alumno_id)
        if curso:
            qs = qs.filter(alumno__curso=curso)
        if materia:
            qs = qs.filter(materia=materia)
        return Response(CalificacionSerializer(qs, many=True).data)


class CalificacionBulkView(APIView):
    permission_classes = [IsAuthenticated, IsDocenteOrAdmin]

    def post(self, request):
        serializer = CalificacionBulkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        curso = data['curso']
        materia = data['materia']
        for item in data['items']:
            alumno = Alumno.objects.filter(id=item['alumno_id'], curso=curso).first()
            if not alumno:
                continue
            Calificacion.objects.update_or_create(
                alumno=alumno,
                materia=materia,
                defaults={
                    'prenota1': item.get('prenota1', ''),
                    'nota1': item.get('nota1') or None,
                    'prenota2': item.get('prenota2', ''),
                    'nota2': item.get('nota2') or None,
                    'diagnostico': item.get('diagnostico', ''),
                },
            )
        qs = Calificacion.objects.filter(alumno__curso=curso, materia=materia)
        return Response(CalificacionSerializer(qs, many=True).data)


class AsistenciaDiariaListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        fecha_str = request.query_params.get('fecha')
        alumno_id = request.query_params.get('alumno_id')
        qs = AsistenciaDiaria.objects.select_related('alumno')
        role = get_role(request.user)
        if role == 'familia':
            qs = qs.filter(alumno__in=alumnos_para_familia(request.user))
            if alumno_id:
                qs = qs.filter(alumno_id=alumno_id)
        elif fecha_str:
            qs = qs.filter(fecha=fecha_str)
        else:
            qs = qs.filter(fecha=date.today())
        return Response(AsistenciaDiariaSerializer(qs, many=True).data)


class AsistenciaDiariaBulkView(APIView):
    permission_classes = [IsAuthenticated, IsPreceptorOrAdmin]

    def post(self, request):
        serializer = AsistenciaDiariaBulkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        fecha = serializer.validated_data['fecha']
        for item in serializer.validated_data['items']:
            alumno_id = int(item['alumno_id'])
            estado = item.get('estado', 'Presente')
            AsistenciaDiaria.objects.update_or_create(
                alumno_id=alumno_id,
                fecha=fecha,
                defaults={'estado': estado},
            )
        qs = AsistenciaDiaria.objects.filter(fecha=fecha)
        return Response(AsistenciaDiariaSerializer(qs, many=True).data)


class NotaPreceptorListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = NotaPreceptor.objects.select_related('alumno')
        role = get_role(request.user)
        if role == 'familia':
            alumno_id = request.query_params.get('alumno_id')
            if alumno_id:
                qs = qs.filter(alumno_id=alumno_id, alumno__in=alumnos_para_familia(request.user))
            else:
                qs = qs.none()
        return Response(NotaPreceptorSerializer(qs, many=True).data)


class NotaPreceptorBulkView(APIView):
    permission_classes = [IsAuthenticated, IsPreceptorOrAdmin]

    def post(self, request):
        serializer = NotaPreceptorBulkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        for item in serializer.validated_data['items']:
            alumno_id = int(item['alumno_id'])
            nota = item.get('nota')
            NotaPreceptor.objects.update_or_create(
                alumno_id=alumno_id,
                defaults={'nota': nota if nota not in ('', None) else None},
            )
        qs = NotaPreceptor.objects.select_related('alumno')
        return Response(NotaPreceptorSerializer(qs, many=True).data)


class ActaCursoListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = ActaCurso.objects.all()
        curso = request.query_params.get('curso')
        if curso:
            qs = qs.filter(curso=curso)
        return Response(ActaCursoSerializer(qs, many=True).data)

    def post(self, request):
        if get_role(request.user) not in ('admin', 'preceptor'):
            return Response({'detail': 'Sin permiso.'}, status=403)
        serializer = ActaCursoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=201)


class ActaAlumnoListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        alumno_id = request.query_params.get('alumno_id')
        qs = ActaAlumno.objects.select_related('alumno')
        if alumno_id:
            if not puede_ver_alumno(request.user, int(alumno_id)):
                return Response({'detail': 'Sin permiso.'}, status=403)
            qs = qs.filter(alumno_id=alumno_id)
        elif get_role(request.user) == 'familia':
            qs = qs.filter(alumno__in=alumnos_para_familia(request.user))
        return Response(ActaAlumnoSerializer(qs, many=True).data)

    def post(self, request):
        if get_role(request.user) not in ('admin', 'docente'):
            return Response({'detail': 'Sin permiso.'}, status=403)
        serializer = ActaAlumnoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        alumno = Alumno.objects.get(pk=request.data['alumno_id'])
        perfil = request.user.perfil
        cargado = f'{perfil.nombre} {perfil.apellido}'.strip() or request.user.username
        acta = serializer.save(alumno=alumno, cargado_por=cargado)
        return Response(ActaAlumnoSerializer(acta).data, status=201)


class ComunicadoListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        curso = request.query_params.get('curso')
        qs = Comunicado.objects.all()
        if curso:
            qs = qs.filter(curso=curso)
        return Response(ComunicadoSerializer(qs, many=True).data)

    def post(self, request):
        if get_role(request.user) not in ('admin', 'preceptor'):
            return Response({'detail': 'Sin permiso.'}, status=403)
        serializer = ComunicadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=201)


class FamiliaHijosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if get_role(request.user) != 'familia':
            return Response({'detail': 'Solo para rol familia.'}, status=403)
        qs = VinculoFamilia.objects.filter(usuario=request.user).select_related('alumno')
        return Response(VinculoFamiliaSerializer(qs, many=True).data)


class SesionClaseView(APIView):
    permission_classes = [IsAuthenticated, IsStaffEscuela]

    def get(self, request):
        curso = request.query_params.get('curso')
        materia = request.query_params.get('materia')
        fecha = request.query_params.get('fecha') or str(date.today())
        if not curso or not materia:
            return Response({'detail': 'curso y materia requeridos.'}, status=400)
        sesion = SesionClase.objects.filter(curso=curso, materia=materia, fecha=fecha).first()
        if not sesion:
            alumnos = Alumno.objects.filter(curso=curso)
            return Response({
                'curso': curso,
                'materia': materia,
                'fecha': fecha,
                'libro_temas': '',
                'asistencias': [
                    {'id': a.id, 'nombre': str(a), 'estado': 'Presente'}
                    for a in alumnos
                ],
            })
        return Response(SesionClaseSerializer(sesion).data)

    def post(self, request):
        if get_role(request.user) not in ('admin', 'docente'):
            return Response({'detail': 'Sin permiso.'}, status=403)
        serializer = SesionClaseWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        sesion, _ = SesionClase.objects.update_or_create(
            curso=data['curso'],
            materia=data['materia'],
            fecha=data['fecha'],
            defaults={
                'libro_temas': data.get('libro_temas', ''),
                'docente': request.user,
            },
        )
        for item in data['asistencias']:
            alumno_id = int(item['alumno_id'])
            estado = item.get('estado', 'Presente')
            AsistenciaClase.objects.update_or_create(
                sesion=sesion,
                alumno_id=alumno_id,
                defaults={'estado': estado},
            )
        return Response(SesionClaseSerializer(sesion).data)
