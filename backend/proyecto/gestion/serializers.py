from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    ActaAlumno,
    ActaCurso,
    Alumno,
    AsistenciaClase,
    AsistenciaDiaria,
    Calificacion,
    Comunicado,
    NotaPreceptor,
    Perfil,
    SesionClase,
    VinculoFamilia,
)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs['username'].strip()
        user = authenticate(username=username, password=attrs['password'])
        if user is None:
            user = authenticate(username=username.lower(), password=attrs['password'])
        if user is None:
            raise serializers.ValidationError('Usuario o contraseña incorrectos.')
        if not hasattr(user, 'perfil'):
            raise serializers.ValidationError('El usuario no tiene un perfil asignado.')
        attrs['user'] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='perfil.role', read_only=True)
    dni = serializers.CharField(source='perfil.dni', read_only=True)
    nombre = serializers.CharField(source='perfil.nombre', read_only=True)
    apellido = serializers.CharField(source='perfil.apellido', read_only=True)
    materia = serializers.CharField(source='perfil.materia_principal', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'role', 'dni', 'nombre', 'apellido', 'materia')


class AlumnoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alumno
        fields = ('id', 'dni', 'nombre', 'apellido', 'curso')


class DocenteSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='perfil.role', read_only=True)
    dni = serializers.CharField(source='perfil.dni', read_only=True)
    nombre = serializers.CharField(source='perfil.nombre', read_only=True)
    apellido = serializers.CharField(source='perfil.apellido', read_only=True)
    materia = serializers.CharField(source='perfil.materia_principal', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'role', 'dni', 'nombre', 'apellido', 'materia')


class CalificacionSerializer(serializers.ModelSerializer):
    alumno_id = serializers.IntegerField(source='alumno.id', read_only=True)
    nombre = serializers.SerializerMethodField()

    class Meta:
        model = Calificacion
        fields = (
            'id',
            'alumno_id',
            'nombre',
            'materia',
            'prenota1',
            'nota1',
            'prenota2',
            'nota2',
            'diagnostico',
        )

    def get_nombre(self, obj):
        return str(obj.alumno)


class CalificacionBulkItemSerializer(serializers.Serializer):
    alumno_id = serializers.IntegerField()
    prenota1 = serializers.CharField(required=False, allow_blank=True)
    nota1 = serializers.IntegerField(required=False, allow_null=True)
    prenota2 = serializers.CharField(required=False, allow_blank=True)
    nota2 = serializers.IntegerField(required=False, allow_null=True)
    diagnostico = serializers.CharField(required=False, allow_blank=True)


class CalificacionBulkSerializer(serializers.Serializer):
    curso = serializers.CharField()
    materia = serializers.CharField()
    items = CalificacionBulkItemSerializer(many=True)


class AsistenciaDiariaSerializer(serializers.ModelSerializer):
    alumno_id = serializers.IntegerField(source='alumno.id', read_only=True)
    nombre = serializers.SerializerMethodField()

    class Meta:
        model = AsistenciaDiaria
        fields = ('id', 'alumno_id', 'nombre', 'fecha', 'estado')

    def get_nombre(self, obj):
        a = obj.alumno
        return f'{a.nombre} {a.apellido}'


class AsistenciaDiariaBulkItemSerializer(serializers.Serializer):
    alumno_id = serializers.IntegerField()
    estado = serializers.CharField()


class AsistenciaDiariaBulkSerializer(serializers.Serializer):
    fecha = serializers.DateField()
    items = AsistenciaDiariaBulkItemSerializer(many=True)


class NotaPreceptorSerializer(serializers.ModelSerializer):
    alumno_id = serializers.IntegerField(source='alumno.id', read_only=True)
    nombre = serializers.SerializerMethodField()

    class Meta:
        model = NotaPreceptor
        fields = ('id', 'alumno_id', 'nombre', 'nota')

    def get_nombre(self, obj):
        a = obj.alumno
        return f'{a.nombre} {a.apellido}'


class NotaPreceptorBulkSerializer(serializers.Serializer):
    items = serializers.ListField(child=serializers.DictField())


class ActaCursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActaCurso
        fields = ('id', 'curso', 'fecha', 'descripcion')


class ActaAlumnoSerializer(serializers.ModelSerializer):
    alumno_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ActaAlumno
        fields = ('id', 'alumno_id', 'titulo', 'materia', 'fecha', 'cargado_por', 'archivo')
        read_only_fields = ('cargado_por',)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['alumno_id'] = instance.alumno_id
        return data


class ComunicadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comunicado
        fields = ('id', 'curso', 'fecha', 'titulo', 'descripcion')


class VinculoFamiliaSerializer(serializers.ModelSerializer):
    alumno_id = serializers.IntegerField(source='alumno.id', read_only=True)
    nombre = serializers.SerializerMethodField()
    dni = serializers.CharField(source='alumno.dni', read_only=True)
    curso = serializers.CharField(source='alumno.curso', read_only=True)

    class Meta:
        model = VinculoFamilia
        fields = ('id', 'alumno_id', 'nombre', 'dni', 'curso', 'vinculo')

    def get_nombre(self, obj):
        return str(obj.alumno)


class SesionClaseSerializer(serializers.ModelSerializer):
    asistencias = serializers.SerializerMethodField()

    class Meta:
        model = SesionClase
        fields = ('id', 'curso', 'materia', 'fecha', 'libro_temas', 'asistencias')

    def get_asistencias(self, obj):
        lineas = obj.lineas.select_related('alumno')
        return [
            {
                'id': linea.alumno.id,
                'nombre': str(linea.alumno),
                'estado': linea.estado,
            }
            for linea in lineas
        ]


class SesionClaseWriteSerializer(serializers.Serializer):
    curso = serializers.CharField()
    materia = serializers.CharField()
    fecha = serializers.DateField()
    libro_temas = serializers.CharField(required=False, allow_blank=True)
    asistencias = serializers.ListField(child=serializers.DictField())
