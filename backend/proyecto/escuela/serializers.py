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
    UsuarioRol,
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
    roles = serializers.SerializerMethodField()
    contrasena = serializers.CharField(write_only=True, required=False)
    nombre = serializers.CharField(write_only=True, required=False)
    apellido = serializers.CharField(write_only=True, required=False)
    dni = serializers.CharField(write_only=True, required=False)
    telefono = serializers.CharField(write_only=True, required=False)
    cargo = serializers.CharField(write_only=True, required=False)
    # Read-only fields from Directivo
    directivo_nombre = serializers.SerializerMethodField()
    directivo_apellido = serializers.SerializerMethodField()
    directivo_dni = serializers.SerializerMethodField()
    directivo_telefono = serializers.SerializerMethodField()
    directivo_cargo = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ['id_usuario', 'usuario', 'contrasena', 'estado', 'ultimo_acceso', 'roles', 'nombre', 'apellido', 'dni', 'telefono', 'cargo', 'directivo_nombre', 'directivo_apellido', 'directivo_dni', 'directivo_telefono', 'directivo_cargo']
        extra_kwargs = {
            'contrasena': {'write_only': True}
        }

    def get_roles(self, obj):
        user_roles = UsuarioRol.objects.filter(id_usuario=obj).select_related('id_rol')
        return [ur.id_rol.nombre_rol for ur in user_roles]

    def get_directivo_nombre(self, obj):
        directivo = Directivo.objects.filter(id_usuario=obj).first()
        return directivo.nombre if directivo else None

    def get_directivo_apellido(self, obj):
        directivo = Directivo.objects.filter(id_usuario=obj).first()
        return directivo.apellido if directivo else None

    def get_directivo_dni(self, obj):
        directivo = Directivo.objects.filter(id_usuario=obj).first()
        return directivo.dni if directivo else None

    def get_directivo_telefono(self, obj):
        directivo = Directivo.objects.filter(id_usuario=obj).first()
        return directivo.telefono if directivo else None

    def get_directivo_cargo(self, obj):
        directivo = Directivo.objects.filter(id_usuario=obj).first()
        return directivo.cargo if directivo else None

    def create(self, validated_data):
        contrasena = validated_data.pop('contrasena', None)
        roles = self.initial_data.get('roles', [])
        nombre = validated_data.pop('nombre', None)
        apellido = validated_data.pop('apellido', None)
        dni = validated_data.pop('dni', None)
        telefono = validated_data.pop('telefono', None)
        cargo = validated_data.pop('cargo', None)

        usuario = Usuario(**validated_data)
        if contrasena:
            usuario.set_password(contrasena)
        usuario.save()

        # Assign roles
        if roles:
            for role_name in roles:
                rol = Rol.objects.filter(nombre_rol=role_name).first()
                if rol:
                    UsuarioRol.objects.get_or_create(id_usuario=usuario, id_rol=rol)

        # Create Directivo if fields are provided
        if nombre and apellido and dni:
            Directivo.objects.create(
                id_usuario=usuario,
                nombre=nombre,
                apellido=apellido,
                dni=dni,
                telefono=telefono or '',
                cargo=cargo or 'Administrador'
            )

        return usuario

    def update(self, instance, validated_data):
        contrasena = validated_data.pop('contrasena', None)
        roles = self.initial_data.get('roles', None)
        nombre = validated_data.pop('nombre', None)
        apellido = validated_data.pop('apellido', None)
        dni = validated_data.pop('dni', None)
        telefono = validated_data.pop('telefono', None)
        cargo = validated_data.pop('cargo', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if contrasena:
            instance.set_password(contrasena)

        instance.save()

        if roles is not None:
            # Remove existing roles
            UsuarioRol.objects.filter(id_usuario=instance).delete()
            # Add new roles
            for role_name in roles:
                rol = Rol.objects.filter(nombre_rol=role_name).first()
                if rol:
                    UsuarioRol.objects.create(id_usuario=instance, id_rol=rol)

        # Update Directivo if exists and fields are provided
        if nombre or apellido or dni or telefono or cargo:
            directivo = Directivo.objects.filter(id_usuario=instance).first()
            if directivo:
                if nombre:
                    directivo.nombre = nombre
                if apellido:
                    directivo.apellido = apellido
                if dni:
                    directivo.dni = dni
                if telefono is not None:
                    directivo.telefono = telefono
                if cargo is not None:
                    directivo.cargo = cargo
                directivo.save()

        return instance


class PadreTutorSerializer(serializers.ModelSerializer):
    class Meta:
        model = PadreTutor
        fields = '__all__'


class PreceptorSerializer(serializers.ModelSerializer):
    usuario = serializers.CharField(source='id_usuario.usuario', read_only=True)
    usuario_nombre = serializers.CharField(write_only=True, required=False)
    contrasena = serializers.CharField(write_only=True, required=False)
    cursos_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )
    cursos_asignados = serializers.SerializerMethodField()

    class Meta:
        model = Preceptor
        fields = [
            'id_preceptor',
            'id_usuario',
            'usuario',
            'usuario_nombre',
            'contrasena',
            'nombre',
            'apellido',
            'dni',
            'correo',
            'telefono',
            'cursos_ids',
            'cursos_asignados',
        ]
        extra_kwargs = {
            'id_usuario': {'read_only': True},
            'correo': {'required': False, 'allow_blank': True, 'allow_null': True},
            'telefono': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def get_cursos_asignados(self, obj):
        cursos = Curso.objects.filter(id_preceptor=obj).order_by('nombre_curso')
        return [
            {
                'id_curso': curso.id_curso,
                'nombre_curso': curso.nombre_curso,
                'ciclo_anio': curso.id_ciclo.anio if curso.id_ciclo else None,
            }
            for curso in cursos
        ]

    def create(self, validated_data):
        usuario_nombre = validated_data.pop('usuario_nombre', None)
        contrasena = validated_data.pop('contrasena', None)
        cursos_ids = validated_data.pop('cursos_ids', [])

        usuario = None
        if usuario_nombre:
            usuario = Usuario(usuario=usuario_nombre, estado=True)
            if contrasena:
                usuario.set_password(contrasena)
            usuario.save()

            rol, _ = Rol.objects.get_or_create(nombre_rol='preceptor')
            UsuarioRol.objects.get_or_create(id_usuario=usuario, id_rol=rol)

        preceptor = Preceptor.objects.create(id_usuario=usuario, **validated_data)
        Curso.objects.filter(id_curso__in=cursos_ids).update(id_preceptor=preceptor)
        return preceptor

    def update(self, instance, validated_data):
        usuario_nombre = validated_data.pop('usuario_nombre', None)
        contrasena = validated_data.pop('contrasena', None)
        cursos_ids = validated_data.pop('cursos_ids', None)

        usuario = instance.id_usuario
        if usuario:
            if usuario_nombre is not None:
                usuario.usuario = usuario_nombre
            if contrasena:
                usuario.set_password(contrasena)
            usuario.save()
        elif usuario_nombre:
            usuario = Usuario(usuario=usuario_nombre, estado=True)
            if contrasena:
                usuario.set_password(contrasena)
            usuario.save()
            instance.id_usuario = usuario

        if usuario:
            rol, _ = Rol.objects.get_or_create(nombre_rol='preceptor')
            UsuarioRol.objects.get_or_create(id_usuario=usuario, id_rol=rol)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if cursos_ids is not None:
            Curso.objects.filter(id_preceptor=instance).update(id_preceptor=None)
            Curso.objects.filter(id_curso__in=cursos_ids).update(id_preceptor=instance)

        return instance


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
        if obj.id_docente_id:
            return f'{obj.id_docente.apellido}, {obj.id_docente.nombre}'
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Ensure nested fields are included even if they're None
        if 'id_curso' in data and data['id_curso'] is not None:
            try:
                data['curso_nombre'] = instance.id_curso.nombre_curso
            except:
                data['curso_nombre'] = None
        if 'id_materia' in data and data['id_materia'] is not None:
            try:
                data['materia_nombre'] = instance.id_materia.nombre_materia
            except:
                data['materia_nombre'] = None
        return data


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
    creador_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Acta
        fields = '__all__'

    def get_creador_nombre(self, obj):
        if obj.id_usuario_creador:
            return obj.id_usuario_creador.usuario
        return None


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


# ---------- Comunicados ----------

class ComunicadoArchivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComunicadoArchivo
        fields = '__all__'


class ComunicadoSerializer(serializers.ModelSerializer):
    curso_nombre = serializers.CharField(
        source='id_curso.nombre_curso', read_only=True, default=None,
    )
    materia_nombre = serializers.CharField(
        source='id_materia.nombre_materia', read_only=True, default=None,
    )
    archivos = ComunicadoArchivoSerializer(many=True, read_only=True)

    class Meta:
        model = Comunicado
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
