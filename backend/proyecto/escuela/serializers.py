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
        roles_list = [ur.id_rol.nombre_rol for ur in user_roles]
        print(f"[UsuarioSerializer.get_roles] Usuario: {obj.usuario}, Roles encontrados: {roles_list}")
        return roles_list

    def get_directivo_nombre(self, obj):
        try:
            directivo = Directivo.objects.filter(id_usuario=obj).first()
            return directivo.nombre if directivo else None
        except Exception as e:
            print(f"[get_directivo_nombre] Error: {e}")
            return None

    def get_directivo_apellido(self, obj):
        try:
            directivo = Directivo.objects.filter(id_usuario=obj).first()
            return directivo.apellido if directivo else None
        except Exception as e:
            print(f"[get_directivo_apellido] Error: {e}")
            return None

    def get_directivo_dni(self, obj):
        try:
            directivo = Directivo.objects.filter(id_usuario=obj).first()
            return directivo.dni if directivo else None
        except Exception as e:
            print(f"[get_directivo_dni] Error: {e}")
            return None

    def get_directivo_telefono(self, obj):
        try:
            directivo = Directivo.objects.filter(id_usuario=obj).first()
            return directivo.telefono if directivo else None
        except Exception as e:
            print(f"[get_directivo_telefono] Error: {e}")
            return None

    def get_directivo_cargo(self, obj):
        try:
            directivo = Directivo.objects.filter(id_usuario=obj).first()
            return directivo.cargo if directivo else None
        except Exception as e:
            print(f"[get_directivo_cargo] Error: {e}")
            return None

    def create(self, validated_data):
        from django.contrib.auth.hashers import make_password

        contrasena = validated_data.pop('contrasena', None)
        roles = validated_data.pop('roles', None)
        nombre = validated_data.pop('nombre', None)
        apellido = validated_data.pop('apellido', None)
        dni = validated_data.pop('dni', None)
        telefono = validated_data.pop('telefono', None)
        cargo = validated_data.pop('cargo', None)

        print(f"[UsuarioSerializer.create] Iniciando creación de usuario")
        print(f"[UsuarioSerializer.create] validated_data: {validated_data}")
        print(f"[UsuarioSerializer.create] roles: {roles}")
        print(f"[UsuarioSerializer.create] nombre: {nombre}, apellido: {apellido}, dni: {dni}")

        # Hash password before creating user
        if contrasena:
            validated_data['contrasena'] = make_password(contrasena)

        usuario = Usuario.objects.create(**validated_data)
        print(f"[UsuarioSerializer.create] Usuario creado: id={usuario.id_usuario}, usuario={usuario.usuario}")

        # Assign roles
        if roles:
            for role_name in roles:
                rol = Rol.objects.filter(nombre_rol=role_name).first()
                print(f"[UsuarioSerializer.create] Buscando rol: {role_name}, encontrado: {rol}")
                if rol:
                    try:
                        # Check if role already exists
                        existing = UsuarioRol.objects.filter(id_usuario=usuario, id_rol=rol).first()
                        if existing:
                            print(f"[UsuarioSerializer.create] Rol ya existe para este usuario")
                        else:
                            usuario_rol = UsuarioRol.objects.create(id_usuario=usuario, id_rol=rol)
                            print(f"[UsuarioSerializer.create] UsuarioRol creado: id_usuario={usuario.id_usuario}, id_rol={rol.id_rol}")
                    except Exception as e:
                        print(f"[UsuarioSerializer.create] Error creando UsuarioRol: {e}")
                        import traceback
                        traceback.print_exc()

        # Create Directivo if fields are provided
        if nombre and apellido and dni:
            try:
                directivo = Directivo.objects.create(
                    id_usuario=usuario,
                    nombre=nombre,
                    apellido=apellido,
                    dni=dni,
                    telefono=telefono or '',
                    cargo=cargo or 'Administrador'
                )
                print(f"[UsuarioSerializer.create] Directivo creado: id={directivo.id_directivo}")
            except Exception as e:
                print(f"[UsuarioSerializer.create] Error creando Directivo: {e}")
                import traceback
                traceback.print_exc()

        print(f"[UsuarioSerializer.create] Creación completada exitosamente")
        return usuario

    def update(self, instance, validated_data):
        from django.contrib.auth.hashers import make_password

        contrasena = validated_data.pop('contrasena', None)
        roles = validated_data.pop('roles', None)
        nombre = validated_data.pop('nombre', None)
        apellido = validated_data.pop('apellido', None)
        dni = validated_data.pop('dni', None)
        telefono = validated_data.pop('telefono', None)
        cargo = validated_data.pop('cargo', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if contrasena:
            instance.contrasena = make_password(contrasena)

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
