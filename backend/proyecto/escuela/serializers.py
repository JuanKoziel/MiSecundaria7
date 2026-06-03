from rest_framework import serializers

from escuela.models import (
    Acta,
    ActaAlumno,
    ActaCurso,
    ActaDocente,
    Alumno,
    Asistencia,
    Calificacion,
    CicloLectivo,
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


# ---------- Catálogos / tablas auxiliares ----------

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'


class EstadoAsistenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoAsistencia
        fields = '__all__'


class TipoActaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoActa
        fields = '__all__'


class TipoAccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoAccion
        fields = '__all__'


class PeriodoEvaluacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PeriodoEvaluacion
        fields = '__all__'


class CicloLectivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CicloLectivo
        fields = '__all__'


class MateriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Materia
        fields = '__all__'


# ---------- Personas ----------

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id_usuario', 'usuario', 'estado', 'ultimo_acceso']


class PadreTutorSerializer(serializers.ModelSerializer):
    class Meta:
        model = PadreTutor
        fields = '__all__'


class PreceptorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Preceptor
        fields = '__all__'


class DocenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Docente
        fields = '__all__'


class DirectivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Directivo
        fields = '__all__'


class AlumnoSerializer(serializers.ModelSerializer):
    curso_nombre = serializers.CharField(
        source='id_curso.nombre_curso', read_only=True, default=None,
    )
    tutor_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Alumno
        fields = '__all__'

    def get_tutor_nombre(self, obj):
        if obj.id_tutor:
            return f'{obj.id_tutor.apellido}, {obj.id_tutor.nombre}'
        return None


# ---------- Estructura académica ----------

class CursoSerializer(serializers.ModelSerializer):
    preceptor_nombre = serializers.SerializerMethodField()
    ciclo_anio = serializers.IntegerField(
        source='id_ciclo.anio', read_only=True, default=None,
    )

    class Meta:
        model = Curso
        fields = '__all__'

    def get_preceptor_nombre(self, obj):
        if obj.id_preceptor:
            return f'{obj.id_preceptor.apellido}, {obj.id_preceptor.nombre}'
        return None


class CursoMateriaSerializer(serializers.ModelSerializer):
    curso_nombre = serializers.CharField(
        source='id_curso.nombre_curso', read_only=True, default=None,
    )
    materia_nombre = serializers.CharField(
        source='id_materia.nombre_materia', read_only=True, default=None,
    )
    docente_nombre = serializers.SerializerMethodField()

    class Meta:
        model = CursoMateria
        fields = '__all__'

    def get_docente_nombre(self, obj):
        if obj.id_docente:
            return f'{obj.id_docente.apellido}, {obj.id_docente.nombre}'
        return None


class HorarioSerializer(serializers.ModelSerializer):
    curso_nombre = serializers.CharField(
        source='id_curso_materia.id_curso.nombre_curso',
        read_only=True, default=None,
    )
    materia_nombre = serializers.CharField(
        source='id_curso_materia.id_materia.nombre_materia',
        read_only=True, default=None,
    )
    docente_nombre = serializers.SerializerMethodField()
    id_curso = serializers.IntegerField(
        source='id_curso_materia.id_curso.id_curso',
        read_only=True, default=None,
    )

    class Meta:
        model = Horario
        fields = '__all__'

    def get_docente_nombre(self, obj):
        docente = getattr(obj.id_curso_materia, 'id_docente', None)
        if docente:
            return f'{docente.apellido}, {docente.nombre}'
        return None


class InscripcionMateriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = InscripcionMateria
        fields = '__all__'


# ---------- Calificaciones ----------

class CalificacionSerializer(serializers.ModelSerializer):
    alumno_nombre = serializers.SerializerMethodField()
    materia_nombre = serializers.CharField(
        source='id_curso_materia.id_materia.nombre_materia',
        read_only=True, default=None,
    )
    curso_nombre = serializers.CharField(
        source='id_curso_materia.id_curso.nombre_curso',
        read_only=True, default=None,
    )
    periodo_nombre = serializers.CharField(
        source='id_periodo.nombre_periodo',
        read_only=True, default=None,
    )

    class Meta:
        model = Calificacion
        fields = '__all__'

    def get_alumno_nombre(self, obj):
        if obj.id_alumno:
            return f'{obj.id_alumno.apellido}, {obj.id_alumno.nombre}'
        return None


# ---------- Asistencias ----------

class AsistenciaSerializer(serializers.ModelSerializer):
    alumno_nombre = serializers.SerializerMethodField()
    estado_nombre = serializers.CharField(
        source='id_estado_asistencia.nombre_estado',
        read_only=True, default=None,
    )
    materia_nombre = serializers.CharField(
        source='id_curso_materia.id_materia.nombre_materia',
        read_only=True, default=None,
    )
    curso_nombre = serializers.CharField(
        source='id_curso_materia.id_curso.nombre_curso',
        read_only=True, default=None,
    )
    tipo = serializers.SerializerMethodField()

    class Meta:
        model = Asistencia
        fields = '__all__'

    def get_alumno_nombre(self, obj):
        if obj.id_alumno:
            return f'{obj.id_alumno.apellido}, {obj.id_alumno.nombre}'
        return None

    def get_tipo(self, obj):
        return 'materia' if obj.numero_modulo else 'general'


# ---------- Actas ----------

class ActaSerializer(serializers.ModelSerializer):
    tipo_acta_nombre = serializers.CharField(
        source='id_tipo_acta.nombre_tipo',
        read_only=True, default=None,
    )

    class Meta:
        model = Acta
        fields = '__all__'


class ActaAlumnoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActaAlumno
        fields = '__all__'


class ActaCursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActaCurso
        fields = '__all__'


class ActaDocenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActaDocente
        fields = '__all__'


# ---------- Planificaciones ----------

class PlanificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Planificacion
        fields = '__all__'


# ---------- Diagnósticos grupales ----------

class DiagnosticoGrupalSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiagnosticoGrupal
        fields = '__all__'


# ---------- Notificaciones ----------

class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = '__all__'


# ---------- Historial ----------

class HistorialCambioSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistorialCambio
        fields = '__all__'


# ---------- Login ----------

class LoginSerializer(serializers.Serializer):
    usuario = serializers.CharField()
    contrasena = serializers.CharField(write_only=True)
