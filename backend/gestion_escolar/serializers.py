from rest_framework import serializers
from django.contrib.auth.hashers import make_password, check_password
from .models import (
    Usuario, Rol, UsuarioRol, Preceptor, Docente, 
    Alumno, PadreTutor, Directivo, Curso, CicloLectivo,
    Materia, CursoMateria, Horario
)
from rest_framework_simplejwt.tokens import RefreshToken


# ==========================================
# SERIALIZERS DE ROLES
# ==========================================

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ['id_rol', 'nombre_rol']


class UsuarioRolSerializer(serializers.ModelSerializer):
    nombre_rol = serializers.CharField(source='id_rol.nombre_rol', read_only=True)
    
    class Meta:
        model = UsuarioRol
        fields = ['id_rol', 'nombre_rol']


# ==========================================
# SERIALIZERS DE USUARIOS Y AUTENTICACIÓN
# ==========================================

class UsuarioSerializer(serializers.ModelSerializer):
    roles = UsuarioRolSerializer(source='usuariorol_set', many=True, read_only=True)
    rol_nombres = serializers.SerializerMethodField()
    
    class Meta:
        model = Usuario
        fields = ['id_usuario', 'usuario', 'estado', 'ultimo_acceso', 'roles', 'rol_nombres']
        read_only_fields = ['id_usuario', 'ultimo_acceso']
    
    def get_rol_nombres(self, obj):
        """Obtiene lista de nombres de roles del usuario"""
        return list(obj.roles.values_list('nombre_rol', flat=True))


class UsuarioDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado de usuario con contraseña (solo para creación)"""
    roles = serializers.PrimaryKeyRelatedField(
        queryset=Rol.objects.all(),
        many=True,
        write_only=True
    )
    rol_nombres = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Usuario
        fields = ['id_usuario', 'usuario', 'contrasena', 'estado', 'ultimo_acceso', 'roles', 'rol_nombres']
        extra_kwargs = {
            'contrasena': {'write_only': True},
        }
    
    def create(self, validated_data):
        roles = validated_data.pop('roles', [])
        validated_data['contrasena'] = make_password(validated_data['contrasena'])
        usuario = Usuario.objects.create(**validated_data)
        
        for rol in roles:
            UsuarioRol.objects.create(id_usuario=usuario, id_rol=rol)
        
        return usuario
    
    def get_rol_nombres(self, obj):
        return list(obj.roles.values_list('nombre_rol', flat=True))


class LoginSerializer(serializers.Serializer):
    """Serializer para el login"""
    usuario = serializers.CharField()
    contrasena = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        usuario_username = attrs.get('usuario')
        contrasena = attrs.get('contrasena')
        
        try:
            usuario = Usuario.objects.get(usuario=usuario_username)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError("Usuario o contraseña incorrectos")
        
        if not usuario.estado:
            raise serializers.ValidationError("El usuario está inactivo")
        
        # Comparar contraseña
        if not check_password(contrasena, usuario.contrasena):
            raise serializers.ValidationError("Usuario o contraseña incorrectos")
        
        attrs['usuario_obj'] = usuario
        return attrs


class TokenResponseSerializer(serializers.Serializer):
    """Respuesta con tokens y datos del usuario"""
    access = serializers.CharField()
    refresh = serializers.CharField()
    usuario = UsuarioSerializer()
    rol_actual = serializers.CharField()


# ==========================================
# SERIALIZERS DE ACTORES (PERSONAL)
# ==========================================

class PreceptorSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(source='id_usuario', read_only=True)
    usuario_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Preceptor
        fields = ['id_preceptor', 'nombre', 'apellido', 'dni', 'correo', 'telefono', 'usuario', 'usuario_id']
        read_only_fields = ['id_preceptor']


class DocenteSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(source='id_usuario', read_only=True)
    usuario_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Docente
        fields = ['id_docente', 'nombre', 'apellido', 'dni', 'correo', 'telefono', 'usuario', 'usuario_id']
        read_only_fields = ['id_docente']


class DirectivoSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(source='id_usuario', read_only=True)
    usuario_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Directivo
        fields = ['id_directivo', 'nombre', 'apellido', 'dni', 'telefono', 'cargo', 'usuario', 'usuario_id']
        read_only_fields = ['id_directivo']


class PadreTutorSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(source='id_usuario', read_only=True)
    usuario_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = PadreTutor
        fields = ['id_tutor', 'nombre', 'apellido', 'dni', 'telefono', 'direccion', 'usuario', 'usuario_id']
        read_only_fields = ['id_tutor']


# ==========================================
# SERIALIZERS DE ACADÉMICO
# ==========================================

class CicloLectivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CicloLectivo
        fields = ['id_ciclo', 'anio', 'fecha_inicio', 'fecha_fin', 'estado']
        read_only_fields = ['id_ciclo']


class MateriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Materia
        fields = ['id_materia', 'nombre_materia', 'descripcion']
        read_only_fields = ['id_materia']


class CursoSerializer(serializers.ModelSerializer):
    preceptor = PreceptorSerializer(source='id_preceptor', read_only=True)
    ciclo = CicloLectivoSerializer(source='id_ciclo', read_only=True)
    
    class Meta:
        model = Curso
        fields = ['id_curso', 'nombre_curso', 'turno', 'preceptor', 'ciclo']
        read_only_fields = ['id_curso']


class HorarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Horario
        fields = ['id_horario', 'id_curso_materia', 'dia_semana', 'hora_inicio', 'hora_fin', 'aula']
        read_only_fields = ['id_horario']


class CursoMateriaSerializer(serializers.ModelSerializer):
    materia = MateriaSerializer(source='id_materia', read_only=True)
    docente = DocenteSerializer(source='id_docente', read_only=True)
    horarios = HorarioSerializer(source='horario_set', many=True, read_only=True)
    
    class Meta:
        model = CursoMateria
        fields = ['id_curso_materia', 'id_curso', 'materia', 'docente', 'horarios']
        read_only_fields = ['id_curso_materia']


class AlumnoSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(source='id_usuario', read_only=True)
    usuario_id = serializers.IntegerField(write_only=True, required=False)
    tutor = PadreTutorSerializer(source='id_tutor', read_only=True)
    curso = CursoSerializer(source='id_curso', read_only=True)
    
    class Meta:
        model = Alumno
        fields = [
            'id_alumno', 'nombre', 'apellido', 'dni', 'fecha_nacimiento',
            'direccion', 'telefono', 'procedencia', 'usuario', 'usuario_id',
            'tutor', 'curso'
        ]
        read_only_fields = ['id_alumno']


# ==========================================
# SERIALIZERS PARA VISTAS DE DASHBOARD
# ==========================================

class PerfilDocenteSerializer(serializers.ModelSerializer):
    """Perfil completo del docente con sus materias y horarios"""
    usuario = UsuarioSerializer(source='id_usuario', read_only=True)
    cursos_materias = serializers.SerializerMethodField()
    
    class Meta:
        model = Docente
        fields = ['id_docente', 'nombre', 'apellido', 'dni', 'correo', 'telefono', 'usuario', 'cursos_materias']
    
    def get_cursos_materias(self, obj):
        cursos_materias = CursoMateria.objects.filter(id_docente=obj)
        return CursoMateriaSerializer(cursos_materias, many=True).data


class PerfilAlumnoSerializer(serializers.ModelSerializer):
    """Perfil completo del alumno con su curso y tutor"""
    usuario = UsuarioSerializer(source='id_usuario', read_only=True)
    tutor = PadreTutorSerializer(source='id_tutor', read_only=True)
    curso = CursoSerializer(source='id_curso', read_only=True)
    
    class Meta:
        model = Alumno
        fields = [
            'id_alumno', 'nombre', 'apellido', 'dni', 'fecha_nacimiento',
            'direccion', 'telefono', 'procedencia', 'usuario', 'tutor', 'curso'
        ]


class PerfilFamiliaSerializer(serializers.ModelSerializer):
    """Perfil del padre/tutor con sus hijos (alumnos)"""
    usuario = UsuarioSerializer(source='id_usuario', read_only=True)
    hijos = serializers.SerializerMethodField()
    
    class Meta:
        model = PadreTutor
        fields = ['id_tutor', 'nombre', 'apellido', 'dni', 'telefono', 'direccion', 'usuario', 'hijos']
    
    def get_hijos(self, obj):
        alumnos = Alumno.objects.filter(id_tutor=obj)
        return PerfilAlumnoSerializer(alumnos, many=True).data
