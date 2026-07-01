import unicodedata

from rest_framework import serializers

from escuela.utils import normalizar_dni

from escuela.models import (

    Acta,
    ActaAlumno,
    ActaCurso,
    ActaDocente,
    Alumno,
    Asistencia,
    Calificacion,
    CicloLectivo,
    ActividadDocente,
    ActividadDocenteArchivo,
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


def _assign_role(usuario, nombre_rol):
    if not usuario or not nombre_rol:
        return
    rol, _ = Rol.objects.get_or_create(nombre_rol=nombre_rol)
    UsuarioRol.objects.get_or_create(id_usuario=usuario, id_rol=rol)


def _build_usuario_account(
    *,
    instance,
    validated_data,
    username_key='usuario_nombre',
    role_name=None,
    require_password_on_create=True,
):
    username = validated_data.pop(username_key, None)
    if username is None and username_key != 'usuario':
        username = validated_data.pop('usuario', None)
    contrasena = validated_data.pop('contrasena', None)
    estado = validated_data.pop('estado', None)
    fecha_deshabilitacion_programada = validated_data.pop('fecha_deshabilitacion_programada', None)
    fecha_habilitacion_programada = validated_data.pop('fecha_habilitacion_programada', None)

    usuario = instance.id_usuario if getattr(instance, 'id_usuario_id', None) else None
    creating_usuario = usuario is None

    if creating_usuario and not username:
        raise serializers.ValidationError({username_key: 'El usuario es obligatorio.'})
    if creating_usuario and require_password_on_create and not contrasena:
        raise serializers.ValidationError({'contrasena': 'La contrasena es obligatoria para crear el usuario.'})

    if usuario is None:
        usuario = Usuario(
            usuario=username,
            estado=estado if estado is not None else True,
            fecha_deshabilitacion_programada=fecha_deshabilitacion_programada,
            fecha_habilitacion_programada=fecha_habilitacion_programada,
        )
    else:
        if username is not None:
            usuario.usuario = username
        if estado is not None:
            usuario.estado = estado
        if fecha_deshabilitacion_programada is not None:
            usuario.fecha_deshabilitacion_programada = fecha_deshabilitacion_programada
        if fecha_habilitacion_programada is not None:
            usuario.fecha_habilitacion_programada = fecha_habilitacion_programada

    if contrasena:
        usuario.set_password(contrasena)
    elif creating_usuario and require_password_on_create:
        raise serializers.ValidationError({'contrasena': 'La contrasena es obligatoria para crear el usuario.'})

    usuario.save()
    if getattr(instance, 'id_usuario_id', None) != usuario.id_usuario:
        instance.id_usuario = usuario

    if role_name:
        _assign_role(usuario, role_name)

    return usuario, validated_data


# ---------- CatÃ¡logos / tablas auxiliares ----------

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


def _normalizar_texto(texto):
    return unicodedata.normalize('NFKD', texto).encode('ASCII', 'ignore').decode('ASCII').lower()

class MateriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Materia
        fields = '__all__'

    def create(self, validated_data):
        nombre = validated_data.get('nombre_materia')
        if nombre:
            normalizado = _normalizar_texto(nombre)
            for m in Materia.objects.all():
                if _normalizar_texto(m.nombre_materia) == normalizado:
                    if m.activo:
                        raise serializers.ValidationError({
                            'nombre_materia': 'Ya existe una materia con ese nombre.'
                        })
                    for attr, value in validated_data.items():
                        setattr(m, attr, value)
                    m.activo = True
                    m.save()
                    return m
        return Materia.objects.create(**validated_data, activo=True)


# ---------- Personas ----------

class UsuarioSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    contrasena = serializers.CharField(write_only=True, required=False)
    nombre = serializers.CharField(write_only=True, required=False)
    apellido = serializers.CharField(write_only=True, required=False)
    dni = serializers.CharField(write_only=True, required=False)
    telefono = serializers.CharField(write_only=True, required=False)
    cargo = serializers.CharField(write_only=True, required=False)
    estado_label = serializers.SerializerMethodField()
    proxima_accion_programada = serializers.SerializerMethodField()
    # Read-only fields from Directivo
    directivo_nombre = serializers.SerializerMethodField()
    directivo_apellido = serializers.SerializerMethodField()
    directivo_dni = serializers.SerializerMethodField()
    directivo_telefono = serializers.SerializerMethodField()
    directivo_cargo = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            'id_usuario',
            'usuario',
            'contrasena',
            'estado',
            'fecha_deshabilitacion_programada',
            'fecha_habilitacion_programada',
            'ultimo_acceso',
            'roles',
            'estado_label',
            'proxima_accion_programada',
            'nombre',
            'apellido',
            'dni',
            'telefono',
            'cargo',
            'directivo_nombre',
            'directivo_apellido',
            'directivo_dni',
            'directivo_telefono',
            'directivo_cargo',
        ]
        extra_kwargs = {
            'contrasena': {'write_only': True}
        }

    def get_roles(self, obj):
        user_roles = UsuarioRol.objects.filter(id_usuario=obj).select_related('id_rol')
        return [ur.id_rol.nombre_rol for ur in user_roles]

    def get_estado_label(self, obj):
        return 'Habilitado' if obj.estado else 'Deshabilitado'

    def get_proxima_accion_programada(self, obj):
        if obj.estado and obj.fecha_deshabilitacion_programada:
            return {
                'tipo': 'deshabilitar',
                'fecha': obj.fecha_deshabilitacion_programada.isoformat(),
            }
        if not obj.estado and obj.fecha_habilitacion_programada:
            return {
                'tipo': 'habilitar',
                'fecha': obj.fecha_habilitacion_programada.isoformat(),
            }
        if obj.fecha_deshabilitacion_programada:
            return {
                'tipo': 'deshabilitar',
                'fecha': obj.fecha_deshabilitacion_programada.isoformat(),
            }
        if obj.fecha_habilitacion_programada:
            return {
                'tipo': 'habilitar',
                'fecha': obj.fecha_habilitacion_programada.isoformat(),
            }
        return None

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
        if dni:
            dni = normalizar_dni(dni)
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
        if dni:
            dni = normalizar_dni(dni)
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
    estado = serializers.BooleanField(write_only=True, required=False)
    fecha_deshabilitacion_programada = serializers.DateTimeField(write_only=True, required=False, allow_null=True)
    fecha_habilitacion_programada = serializers.DateTimeField(write_only=True, required=False, allow_null=True)
    cursos_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )
    cursos_asignados = serializers.SerializerMethodField()
    usuario_estado = serializers.SerializerMethodField()
    usuario_fecha_deshabilitacion_programada = serializers.SerializerMethodField()
    usuario_fecha_habilitacion_programada = serializers.SerializerMethodField()
    estado_label = serializers.SerializerMethodField()
    proxima_accion_programada = serializers.SerializerMethodField()

    class Meta:
        model = Preceptor
        fields = [
            'id_preceptor',
            'id_usuario',
            'usuario',
            'usuario_nombre',
            'contrasena',
            'estado',
            'fecha_deshabilitacion_programada',
            'fecha_habilitacion_programada',
            'nombre',
            'apellido',
            'dni',
            'correo',
            'telefono',
            'cursos_ids',
            'cursos_asignados',
            'usuario_estado',
            'usuario_fecha_deshabilitacion_programada',
            'usuario_fecha_habilitacion_programada',
            'estado_label',
            'proxima_accion_programada',
        ]
        extra_kwargs = {
            'id_usuario': {'read_only': True},
            'correo': {'required': False, 'allow_blank': True, 'allow_null': True},
            'telefono': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def validate_dni(self, value):
        return normalizar_dni(value)

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

    def get_estado_label(self, obj):
        if not obj.id_usuario:
            return 'Sin usuario'
        return 'Habilitado' if obj.id_usuario.estado else 'Deshabilitado'

    def get_proxima_accion_programada(self, obj):
        usuario = obj.id_usuario
        if not usuario:
            return None
        if usuario.estado and usuario.fecha_deshabilitacion_programada:
            return {
                'tipo': 'deshabilitar',
                'fecha': usuario.fecha_deshabilitacion_programada.isoformat(),
            }
        if not usuario.estado and usuario.fecha_habilitacion_programada:
            return {
                'tipo': 'habilitar',
                'fecha': usuario.fecha_habilitacion_programada.isoformat(),
            }
        if usuario.fecha_deshabilitacion_programada:
            return {
                'tipo': 'deshabilitar',
                'fecha': usuario.fecha_deshabilitacion_programada.isoformat(),
            }
        if usuario.fecha_habilitacion_programada:
            return {
                'tipo': 'habilitar',
                'fecha': usuario.fecha_habilitacion_programada.isoformat(),
            }
        return None

    def get_usuario_estado(self, obj):
        return obj.id_usuario.estado if obj.id_usuario else None

    def get_usuario_fecha_deshabilitacion_programada(self, obj):
        if not obj.id_usuario:
            return None
        value = obj.id_usuario.fecha_deshabilitacion_programada
        return value.isoformat() if value else None

    def get_usuario_fecha_habilitacion_programada(self, obj):
        if not obj.id_usuario:
            return None
        value = obj.id_usuario.fecha_habilitacion_programada
        return value.isoformat() if value else None

    def create(self, validated_data):
        cursos_ids = validated_data.pop('cursos_ids', [])
        usuario, validated_data = _build_usuario_account(
            instance=self.instance or Preceptor(),
            validated_data=validated_data,
            username_key='usuario_nombre',
            role_name='preceptor',
        )

        preceptor = Preceptor.objects.create(id_usuario=usuario, **validated_data)
        Curso.objects.filter(id_curso__in=cursos_ids).update(id_preceptor=preceptor)
        return preceptor

    def update(self, instance, validated_data):
        cursos_ids = validated_data.pop('cursos_ids', None)
        usuario, validated_data = _build_usuario_account(
            instance=instance,
            validated_data=validated_data,
            username_key='usuario_nombre',
            role_name='preceptor',
        )

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if cursos_ids is not None:
            Curso.objects.filter(id_preceptor=instance).update(id_preceptor=None)
            Curso.objects.filter(id_curso__in=cursos_ids).update(id_preceptor=instance)

        return instance


class DdjjDocenteSerializer(serializers.ModelSerializer):
    archivo = serializers.FileField(write_only=True, required=False)
    docente_nombre = serializers.CharField(source='id_docente.nombre', read_only=True)
    docente_apellido = serializers.CharField(source='id_docente.apellido', read_only=True)
    nombre_archivo = serializers.SerializerMethodField()
    archivo_url = serializers.SerializerMethodField()
    presentada = serializers.SerializerMethodField()

    class Meta:
        model = DdjjDocente
        fields = [
            'id_ddjj',
            'id_docente',
            'docente_nombre',
            'docente_apellido',
            'archivo',
            'archivo_url',
            'nombre_archivo',
            'fecha_carga',
            'presentada',
        ]

    def get_nombre_archivo(self, obj):
        if not obj.ruta_archivo:
            return None
        return obj.ruta_archivo.name.split('/')[-1]

    def get_archivo_url(self, obj):
        if not obj.ruta_archivo:
            return None
        try:
            return obj.ruta_archivo.url
        except Exception:
            return f'/media/{obj.ruta_archivo.name}'

    def get_presentada(self, obj):
        return bool(obj.ruta_archivo)

    def create(self, validated_data):
        archivo = validated_data.pop('archivo', None)
        if not archivo:
            raise serializers.ValidationError({'archivo': 'Debes adjuntar un archivo para la DDJJ.'})

        instance = DdjjDocente(**validated_data)
        instance.ruta_archivo = archivo
        instance.save()
        return instance

    def update(self, instance, validated_data):
        raise serializers.ValidationError({'archivo': 'Ya posee una D.D.J.J. presentada.'})


class ActividadDocenteArchivoSerializer(serializers.ModelSerializer):
    archivo = serializers.FileField(write_only=True, required=False)
    archivo_url = serializers.SerializerMethodField()
    nombre_archivo = serializers.SerializerMethodField()
    es_principal = serializers.SerializerMethodField()

    class Meta:
        model = ActividadDocenteArchivo
        fields = [
            'id_archivo',
            'id_actividad',
            'archivo',
            'archivo_url',
            'nombre_archivo',
            'fecha_carga',
            'es_principal',
        ]
        extra_kwargs = {
            'id_actividad': {'read_only': True},
        }

    def get_nombre_archivo(self, obj):
        if not obj.ruta_archivo:
            return None
        return obj.ruta_archivo.name.split('/')[-1]

    def get_archivo_url(self, obj):
        if not obj.ruta_archivo:
            return None
        try:
            return obj.ruta_archivo.url
        except Exception:
            return f'/media/{obj.ruta_archivo.name}'

    def get_es_principal(self, obj):
        actividad = getattr(obj, '_actividad', None) or getattr(obj, 'id_actividad', None)
        if not actividad or not getattr(actividad, 'ruta_archivo', None) or not obj.ruta_archivo:
            return False
        return actividad.ruta_archivo.name == obj.ruta_archivo.name

    def create(self, validated_data):
        archivo = validated_data.pop('archivo', None)
        if not archivo:
            raise serializers.ValidationError({'archivo': 'Debes adjuntar un archivo.'})
        instance = ActividadDocenteArchivo(**validated_data)
        instance.ruta_archivo = archivo
        instance.save()
        return instance


class ActividadDocenteSerializer(serializers.ModelSerializer):
    archivo = serializers.FileField(write_only=True, required=False, allow_null=True)
    archivos = serializers.SerializerMethodField()
    curso_nombre = serializers.CharField(source='id_curso_materia.id_curso.nombre_curso', read_only=True)
    materia_nombre = serializers.CharField(source='id_curso_materia.id_materia.nombre_materia', read_only=True)
    docente_nombre = serializers.CharField(source='id_docente.nombre', read_only=True)
    docente_apellido = serializers.CharField(source='id_docente.apellido', read_only=True)
    nombre_archivo = serializers.SerializerMethodField()
    archivo_url = serializers.SerializerMethodField()
    fecha_subida = serializers.DateTimeField(source='fecha_creacion', read_only=True)
    hora_subida = serializers.SerializerMethodField()

    class Meta:
        model = ActividadDocente
        fields = [
            'id_actividad',
            'id_docente',
            'id_curso_materia',
            'curso_nombre',
            'materia_nombre',
            'docente_nombre',
            'docente_apellido',
            'titulo',
            'descripcion',
            'archivo',
            'archivos',
            'archivo_url',
            'nombre_archivo',
            'fecha_creacion',
            'fecha_subida',
            'hora_subida',
        ]
        extra_kwargs = {
            'id_docente': {'read_only': True},
            'ruta_archivo': {'read_only': True},
        }

    def _archivos_queryset(self, obj):
        archivos = list(obj.archivos_adjuntos.all().order_by('id_archivo'))
        for archivo in archivos:
            archivo._actividad = obj
        return archivos

    def get_archivos(self, obj):
        archivos = self._archivos_queryset(obj)
        if archivos:
            return ActividadDocenteArchivoSerializer(archivos, many=True).data
        if not obj.ruta_archivo:
            return []
        fake = ActividadDocenteArchivo(id_archivo=None, id_actividad=obj, fecha_carga=obj.fecha_creacion)
        fake.ruta_archivo.name = obj.ruta_archivo.name
        fake._actividad = obj
        return [ActividadDocenteArchivoSerializer(fake).data]

    def get_nombre_archivo(self, obj):
        archivos = self._archivos_queryset(obj)
        if archivos:
            return archivos[0].ruta_archivo.name.split('/')[-1]
        if not obj.ruta_archivo:
            return None
        return obj.ruta_archivo.name.split('/')[-1]

    def get_archivo_url(self, obj):
        archivos = self._archivos_queryset(obj)
        if archivos:
            try:
                return archivos[0].ruta_archivo.url
            except Exception:
                return f'/media/{archivos[0].ruta_archivo.name}'
        if not obj.ruta_archivo:
            return None
        try:
            return obj.ruta_archivo.url
        except Exception:
            return f'/media/{obj.ruta_archivo.name}'

    def get_hora_subida(self, obj):
        if not obj.fecha_creacion:
            return None
        return obj.fecha_creacion.strftime('%H:%M')

    def _get_docente_actual(self, request):
        if not request or not request.user or not request.user.is_authenticated:
            return None
        username = request.user.username
        usuario_obj = Usuario.objects.filter(usuario=username).first()
        if not usuario_obj:
            return None
        return Docente.objects.filter(id_usuario=usuario_obj).first()

    def validate(self, attrs):
        request = self.context.get('request')
        docente_actual = self._get_docente_actual(request)
        if not docente_actual:
            raise serializers.ValidationError({'detail': 'No se pudo identificar el docente autenticado.'})

        curso_materia = attrs.get('id_curso_materia') or getattr(self.instance, 'id_curso_materia', None)
        if not curso_materia:
            raise serializers.ValidationError({'id_curso_materia': 'Debes seleccionar un curso y una materia v?lidos.'})

        if curso_materia.id_docente_id != docente_actual.id_docente:
            raise serializers.ValidationError({'id_curso_materia': 'No tienes permiso para usar esa asignaci?n.'})

        archivos = list(self.context.get('uploaded_files') or [])
        archivo_legacy = attrs.get('archivo')
        if archivo_legacy:
            archivos = [archivo_legacy, *archivos]
        if self.instance is None and not archivos:
            raise serializers.ValidationError({'archivo': 'Debes adjuntar un archivo para la actividad.'})

        return attrs

    def create(self, validated_data):
        archivo_legacy = validated_data.pop('archivo', None)
        validated_data.pop('id_docente', None)
        request = self.context.get('request')
        docente_actual = self._get_docente_actual(request)
        if not docente_actual:
            raise serializers.ValidationError({'detail': 'No se pudo identificar el docente autenticado.'})

        instance = ActividadDocente(**validated_data)
        instance.id_docente = docente_actual
        instance.ruta_archivo = ''
        instance.save()

        archivos = list(self.context.get('uploaded_files') or [])
        if archivo_legacy is not None:
            archivos = [archivo_legacy, *archivos]

        for archivo in archivos:
            ActividadDocenteArchivo.objects.create(id_actividad=instance, ruta_archivo=archivo)

        primer_archivo = instance.archivos_adjuntos.order_by('id_archivo').first()
        if primer_archivo:
            instance.ruta_archivo = primer_archivo.ruta_archivo.name
            instance.save(update_fields=['ruta_archivo'])
        return instance

    def update(self, instance, validated_data):
        archivo_legacy = validated_data.pop('archivo', None)
        validated_data.pop('id_docente', None)
        validated_data.pop('id_curso_materia', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        archivos = list(self.context.get('uploaded_files') or [])
        if archivo_legacy is not None:
            archivos = [archivo_legacy, *archivos]

        for archivo in archivos:
            ActividadDocenteArchivo.objects.create(id_actividad=instance, ruta_archivo=archivo)

        if not instance.ruta_archivo:
            primer_archivo = instance.archivos_adjuntos.order_by('id_archivo').first()
            if primer_archivo:
                instance.ruta_archivo = primer_archivo.ruta_archivo.name
                instance.save(update_fields=['ruta_archivo'])
        return instance


class DocenteSerializer(serializers.ModelSerializer):
    usuario = serializers.CharField(source='id_usuario.usuario', read_only=True)
    usuario_nombre = serializers.CharField(write_only=True, required=False)
    contrasena = serializers.CharField(write_only=True, required=False)
    estado = serializers.BooleanField(write_only=True, required=False)
    fecha_deshabilitacion_programada = serializers.DateTimeField(write_only=True, required=False, allow_null=True)
    fecha_habilitacion_programada = serializers.DateTimeField(write_only=True, required=False, allow_null=True)
    correo = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    ddjj_id = serializers.SerializerMethodField()
    ruta_ddjj = serializers.SerializerMethodField()
    ddjj_presentada = serializers.SerializerMethodField()
    ddjj_fecha_carga = serializers.SerializerMethodField()
    ddjj_nombre_archivo = serializers.SerializerMethodField()
    ddjj_url = serializers.SerializerMethodField()
    usuario_estado = serializers.SerializerMethodField()
    usuario_fecha_deshabilitacion_programada = serializers.SerializerMethodField()
    usuario_fecha_habilitacion_programada = serializers.SerializerMethodField()
    estado_label = serializers.SerializerMethodField()
    proxima_accion_programada = serializers.SerializerMethodField()

    class Meta:
        model = Docente
        fields = [
            'id_docente',
            'id_usuario',
            'usuario',
            'usuario_nombre',
            'contrasena',
            'estado',
            'fecha_deshabilitacion_programada',
            'fecha_habilitacion_programada',
            'nombre',
            'apellido',
            'dni',
            'correo',
            'telefono',
            'ddjj_id',
            'ruta_ddjj',
            'ddjj_presentada',
            'ddjj_fecha_carga',
            'ddjj_nombre_archivo',
            'ddjj_url',
            'usuario_estado',
            'usuario_fecha_deshabilitacion_programada',
            'usuario_fecha_habilitacion_programada',
            'estado_label',
            'proxima_accion_programada',
        ]
        extra_kwargs = {
            'id_usuario': {'read_only': True},
            'correo': {'required': False, 'allow_blank': True, 'allow_null': True},
            'telefono': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def validate_dni(self, value):
        return normalizar_dni(value)

    def _get_ddjj(self, obj):
        return DdjjDocente.objects.filter(id_docente=obj).first()

    def get_ddjj_id(self, obj):
        ddjj = self._get_ddjj(obj)
        return ddjj.id_ddjj if ddjj else None

    def get_ruta_ddjj(self, obj):
        ddjj = self._get_ddjj(obj)
        if not ddjj or not ddjj.ruta_archivo:
            return None
        try:
            return ddjj.ruta_archivo.url
        except Exception:
            return f'/media/{ddjj.ruta_archivo.name}'

    def get_ddjj_presentada(self, obj):
        return self._get_ddjj(obj) is not None

    def get_ddjj_fecha_carga(self, obj):
        ddjj = self._get_ddjj(obj)
        if not ddjj:
            return None
        return ddjj.fecha_carga

    def get_ddjj_nombre_archivo(self, obj):
        ddjj = self._get_ddjj(obj)
        if not ddjj or not ddjj.ruta_archivo:
            return None
        return ddjj.ruta_archivo.name.split('/')[-1]

    def get_ddjj_url(self, obj):
        ddjj = self._get_ddjj(obj)
        if not ddjj or not ddjj.ruta_archivo:
            return None
        try:
            return ddjj.ruta_archivo.url
        except Exception:
            return f'/media/{ddjj.ruta_archivo.name}'

    def get_usuario_estado(self, obj):
        return obj.id_usuario.estado if obj.id_usuario else None

    def get_usuario_fecha_deshabilitacion_programada(self, obj):
        if not obj.id_usuario:
            return None
        value = obj.id_usuario.fecha_deshabilitacion_programada
        return value.isoformat() if value else None

    def get_usuario_fecha_habilitacion_programada(self, obj):
        if not obj.id_usuario:
            return None
        value = obj.id_usuario.fecha_habilitacion_programada
        return value.isoformat() if value else None

    def get_estado_label(self, obj):
        if not obj.id_usuario:
            return 'Sin usuario'
        return 'Habilitado' if obj.id_usuario.estado else 'Deshabilitado'

    def get_proxima_accion_programada(self, obj):
        usuario = obj.id_usuario
        if not usuario:
            return None
        if usuario.estado and usuario.fecha_deshabilitacion_programada:
            return {
                'tipo': 'deshabilitar',
                'fecha': usuario.fecha_deshabilitacion_programada.isoformat(),
            }
        if not usuario.estado and usuario.fecha_habilitacion_programada:
            return {
                'tipo': 'habilitar',
                'fecha': usuario.fecha_habilitacion_programada.isoformat(),
            }
        if usuario.fecha_deshabilitacion_programada:
            return {
                'tipo': 'deshabilitar',
                'fecha': usuario.fecha_deshabilitacion_programada.isoformat(),
            }
        if usuario.fecha_habilitacion_programada:
            return {
                'tipo': 'habilitar',
                'fecha': usuario.fecha_habilitacion_programada.isoformat(),
            }
        return None

    def create(self, validated_data):
        usuario, validated_data = _build_usuario_account(
            instance=self.instance or Docente(),
            validated_data=validated_data,
            username_key='usuario_nombre',
            role_name='docente',
        )
        docente = Docente.objects.create(id_usuario=usuario, **validated_data)
        return docente

    def update(self, instance, validated_data):
        usuario, validated_data = _build_usuario_account(
            instance=instance,
            validated_data=validated_data,
            username_key='usuario_nombre',
            role_name='docente',
        )
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.id_usuario = usuario
        instance.save()
        return instance


class DirectivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Directivo
        fields = '__all__'


class AlumnoSerializer(serializers.ModelSerializer):
    usuario = serializers.CharField(source='id_usuario.usuario', read_only=True)
    usuario_nombre = serializers.CharField(write_only=True, required=False)
    contrasena = serializers.CharField(write_only=True, required=False)
    estado = serializers.BooleanField(write_only=True, required=False)
    fecha_deshabilitacion_programada = serializers.DateTimeField(write_only=True, required=False, allow_null=True)
    fecha_habilitacion_programada = serializers.DateTimeField(write_only=True, required=False, allow_null=True)
    curso_nombre = serializers.CharField(
        source='id_curso.nombre_curso', read_only=True, default=None,
    )
    tutor_nombre = serializers.SerializerMethodField()
    usuario_estado = serializers.SerializerMethodField()
    usuario_fecha_deshabilitacion_programada = serializers.SerializerMethodField()
    usuario_fecha_habilitacion_programada = serializers.SerializerMethodField()
    estado_label = serializers.SerializerMethodField()
    proxima_accion_programada = serializers.SerializerMethodField()

    class Meta:
        model = Alumno
        fields = [
            'id_alumno',
            'id_usuario',
            'usuario',
            'usuario_nombre',
            'contrasena',
            'estado',
            'fecha_deshabilitacion_programada',
            'fecha_habilitacion_programada',
            'id_tutor',
            'id_curso',
            'nombre',
            'apellido',
            'dni',
            'fecha_nacimiento',
            'direccion',
            'telefono',
            'procedencia',
            'curso_nombre',
            'tutor_nombre',
            'usuario_estado',
            'usuario_fecha_deshabilitacion_programada',
            'usuario_fecha_habilitacion_programada',
            'estado_label',
            'proxima_accion_programada',
        ]
        extra_kwargs = {
            'id_usuario': {'read_only': True},
            'id_tutor': {'required': False, 'allow_null': True},
            'id_curso': {'required': False, 'allow_null': True},
            'direccion': {'required': False, 'allow_blank': True, 'allow_null': True},
            'telefono': {'required': False, 'allow_blank': True, 'allow_null': True},
            'procedencia': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def validate_dni(self, value):
        return normalizar_dni(value)

    def get_tutor_nombre(self, obj):
        if obj.id_tutor:
            return f'{obj.id_tutor.apellido}, {obj.id_tutor.nombre}'
        return None

    def get_usuario_estado(self, obj):
        return obj.id_usuario.estado if obj.id_usuario else None

    def get_usuario_fecha_deshabilitacion_programada(self, obj):
        if not obj.id_usuario:
            return None
        value = obj.id_usuario.fecha_deshabilitacion_programada
        return value.isoformat() if value else None

    def get_usuario_fecha_habilitacion_programada(self, obj):
        if not obj.id_usuario:
            return None
        value = obj.id_usuario.fecha_habilitacion_programada
        return value.isoformat() if value else None

    def get_estado_label(self, obj):
        if not obj.id_usuario:
            return 'Sin usuario'
        return 'Habilitado' if obj.id_usuario.estado else 'Deshabilitado'

    def get_proxima_accion_programada(self, obj):
        usuario = obj.id_usuario
        if not usuario:
            return None
        if usuario.estado and usuario.fecha_deshabilitacion_programada:
            return {
                'tipo': 'deshabilitar',
                'fecha': usuario.fecha_deshabilitacion_programada.isoformat(),
            }
        if not usuario.estado and usuario.fecha_habilitacion_programada:
            return {
                'tipo': 'habilitar',
                'fecha': usuario.fecha_habilitacion_programada.isoformat(),
            }
        if usuario.fecha_deshabilitacion_programada:
            return {
                'tipo': 'deshabilitar',
                'fecha': usuario.fecha_deshabilitacion_programada.isoformat(),
            }
        if usuario.fecha_habilitacion_programada:
            return {
                'tipo': 'habilitar',
                'fecha': usuario.fecha_habilitacion_programada.isoformat(),
            }
        return None

    def create(self, validated_data):
        usuario, validated_data = _build_usuario_account(
            instance=self.instance or Alumno(),
            validated_data=validated_data,
            username_key='usuario_nombre',
            role_name='alumno',
        )
        alumno = Alumno.objects.create(id_usuario=usuario, **validated_data)
        return alumno

    def update(self, instance, validated_data):
        usuario, validated_data = _build_usuario_account(
            instance=instance,
            validated_data=validated_data,
            username_key='usuario_nombre',
            role_name='alumno',
        )
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.id_usuario = usuario
        instance.save()
        return instance


# ---------- Estructura acadÃ©mica ----------

class CursoSerializer(serializers.ModelSerializer):
    preceptor_nombre = serializers.SerializerMethodField()
    preceptor_nombre_completo = serializers.SerializerMethodField()
    ciclo_anio = serializers.IntegerField(
        source='id_ciclo.anio', read_only=True, default=None,
    )
    turno_calculado = serializers.SerializerMethodField()

    class Meta:
        model = Curso
        fields = '__all__'

    def get_preceptor_nombre(self, obj):
        if obj.id_preceptor:
            return f'{obj.id_preceptor.apellido}, {obj.id_preceptor.nombre}'
        return None

    def get_preceptor_nombre_completo(self, obj):
        if obj.id_preceptor:
            return f'{obj.id_preceptor.nombre} {obj.id_preceptor.apellido}'
        return None

    def get_turno_calculado(self, obj):
        horarios = Horario.objects.filter(
            id_curso_materia__id_curso=obj,
        ).select_related('id_modulo')
        manana = 0
        tarde = 0
        for h in horarios:
            if h.id_modulo and h.id_modulo.hora_inicio:
                if h.id_modulo.hora_inicio.hour < 12:
                    manana += 1
                else:
                    tarde += 1
        if manana > tarde:
            return 'Mañana'
        if tarde > manana:
            return 'Tarde'
        return ''

    def create(self, validated_data):
        from escuela.utils import activar_o_crear
        nombre_curso = validated_data.get('nombre_curso')
        id_ciclo = validated_data.get('id_ciclo')
        if nombre_curso and id_ciclo and Curso.objects.filter(
            nombre_curso=nombre_curso, id_ciclo=id_ciclo, activo=True,
        ).exists():
            raise serializers.ValidationError({
                'nombre_curso': 'Ya existe un curso con ese año, división y ciclo lectivo.'
            })
        lookup = {
            'nombre_curso': nombre_curso,
            'id_ciclo': id_ciclo,
        }
        defaults = {k: v for k, v in validated_data.items() if k not in lookup}
        instance, _ = activar_o_crear(Curso, lookup, defaults)
        return instance


class CursoMateriaSerializer(serializers.ModelSerializer):
    curso_nombre = serializers.CharField(
        source='id_curso.nombre_curso', read_only=True, default=None,
    )
    materia_nombre = serializers.CharField(
        source='id_materia.nombre_materia', read_only=True, default=None,
    )
    id_docente = serializers.PrimaryKeyRelatedField(
        queryset=Docente.objects.all(), required=False, allow_null=True,
    )
    docente_nombre = serializers.SerializerMethodField()
    horarios_count = serializers.SerializerMethodField()

    class Meta:
        model = CursoMateria
        fields = '__all__'

    def get_docente_nombre(self, obj):
        if obj.id_docente_id:
            return f'{obj.id_docente.apellido}, {obj.id_docente.nombre}'
        return None

    def get_horarios_count(self, obj):
        from escuela.models import Horario, HorariosEspeciales
        return (
            Horario.objects.filter(id_curso_materia=obj).count() +
            HorariosEspeciales.objects.filter(id_curso_materia=obj).count()
        )

    def create(self, validated_data):
        from escuela.utils import activar_o_crear
        lookup = {
            'id_curso': validated_data.get('id_curso'),
            'id_materia': validated_data.get('id_materia'),
        }
        if CursoMateria.objects.filter(**lookup, activo=True).exists():
            raise serializers.ValidationError(
                'Ya existe una asignación de esa materia para este curso.'
            )
        defaults = {k: v for k, v in validated_data.items() if k not in lookup}
        instance, _ = activar_o_crear(CursoMateria, lookup, defaults)
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
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


class ModuloSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modulos
        fields = '__all__'


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
    modulo_nombre = serializers.CharField(
        source='id_modulo.nombre',
        read_only=True, default=None,
    )
    modulo_hora_inicio = serializers.TimeField(
        source='id_modulo.hora_inicio',
        read_only=True, default=None,
    )
    modulo_hora_fin = serializers.TimeField(
        source='id_modulo.hora_fin',
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


class HorarioEspecialSerializer(serializers.ModelSerializer):
    curso_nombre = serializers.CharField(
        source='id_curso_materia.id_curso.nombre_curso',
        read_only=True, default=None,
    )
    materia_nombre = serializers.CharField(
        source='id_curso_materia.id_materia.nombre_materia',
        read_only=True, default=None,
    )
    id_curso = serializers.IntegerField(
        source='id_curso_materia.id_curso.id_curso',
        read_only=True, default=None,
    )

    class Meta:
        model = HorariosEspeciales
        fields = '__all__'


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

    class Meta:
        model = Asistencia
        fields = '__all__'

    def get_alumno_nombre(self, obj):
        if obj.id_alumno:
            return f'{obj.id_alumno.apellido}, {obj.id_alumno.nombre}'
        return None


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


class ComunicadoAlcanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComunicadoAlcance
        fields = '__all__'


class ComunicadoAlcancesField(serializers.Field):
    def to_representation(self, value):
        if value is None:
            return []
        if hasattr(value, 'all'):
            queryset = value.all().order_by('id_alcance')
        else:
            queryset = value
        return ComunicadoAlcanceSerializer(queryset, many=True).data

    def to_internal_value(self, data):
        if data in (None, ''):
            return []
        if isinstance(data, dict):
            data = [data]
        if not isinstance(data, list):
            raise serializers.ValidationError('Los alcances deben enviarse como una lista.')
        normalizados = []
        for item in data:
            if not isinstance(item, dict):
                raise serializers.ValidationError('Cada alcance debe ser un objeto válido.')
            normalizados.append(item)
        return normalizados


class ComunicadoSerializer(serializers.ModelSerializer):
    curso_nombre = serializers.CharField(source='id_curso.nombre_curso', read_only=True, default=None)
    creador_nombre = serializers.SerializerMethodField()
    materia_nombre = serializers.CharField(source='id_materia.nombre_materia', read_only=True, default=None)
    archivos = ComunicadoArchivoSerializer(many=True, read_only=True)
    alcances = ComunicadoAlcancesField(required=False)
    alcance = serializers.DictField(write_only=True, required=False)

    class Meta:
        model = Comunicado
        fields = '__all__'

    def validate(self, attrs):
        alcances = attrs.get('alcances')
        if alcances is None:
            alcance = self.initial_data.get('alcance') or {}
            if alcance:
                if not isinstance(alcance, dict):
                    raise serializers.ValidationError({'alcance': 'Debe ser un objeto válido.'})
                alcances = [alcance]
            else:
                alcances = []

        if not isinstance(alcances, list):
            raise serializers.ValidationError({'alcances': 'Debe ser una lista válida.'})

        def _validate_alcance_item(item):
            if not isinstance(item, dict):
                raise serializers.ValidationError({'alcances': 'Cada alcance debe ser un objeto válido.'})
            id_ciclo = item.get('id_ciclo')
            curso = item.get('curso')
            division = item.get('division')
            id_materia = item.get('id_materia') or attrs.get('id_materia')

            if (curso is not None or division is not None) and not id_ciclo:
                raise serializers.ValidationError({'alcances': 'Si se envía curso o división, id_ciclo es obligatorio.'})
            if division is not None and curso is None:
                raise serializers.ValidationError({'alcances': 'La división requiere un curso.'})
            if id_materia and (id_ciclo is None or curso is None or division is None):
                raise serializers.ValidationError({'alcances': 'La materia específica requiere ciclo, curso y división.'})

        for item in alcances:
            _validate_alcance_item(item)

        attrs['alcances'] = alcances

        return attrs

    def _build_alcance_kwargs(self, comunicado, alcance_data):
        alcance_data = alcance_data or {}
        return {
            'id_comunicado': comunicado,
            'id_ciclo_id': alcance_data.get('id_ciclo') or None,
            'curso': alcance_data.get('curso') if alcance_data.get('curso') is not None else None,
            'division': alcance_data.get('division') if alcance_data.get('division') is not None else None,
            'id_materia_id': alcance_data.get('id_materia') if alcance_data.get('id_materia') is not None else None,
        }

    def create(self, validated_data):
        alcances_data = validated_data.pop('alcances', None)
        alcance_data = validated_data.pop('alcance', None)
        if alcances_data is None:
            alcances_data = [alcance_data] if alcance_data else []
        elif alcance_data:
            alcances_data = [*alcances_data, alcance_data]
        validated_data['id_curso'] = None
        validated_data['id_materia'] = None
        comunicado = Comunicado.objects.create(**validated_data)
        if not alcances_data:
            alcances_data = [{}]
        ComunicadoAlcance.objects.bulk_create(
            [ComunicadoAlcance(**self._build_alcance_kwargs(comunicado, alcance)) for alcance in alcances_data]
        )
        return comunicado

    def update(self, instance, validated_data):
        alcances_data = validated_data.pop('alcances', None)
        alcance_data = validated_data.pop('alcance', None)
        if alcances_data is None:
            alcances_data = [alcance_data] if alcance_data else None
        elif alcance_data:
            alcances_data = [*alcances_data, alcance_data]
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.id_curso = None
        instance.id_materia = None
        instance.save()

        if alcances_data is not None:
            instance.alcances.all().delete()
            if not alcances_data:
                alcances_data = [{}]
            ComunicadoAlcance.objects.bulk_create(
                [ComunicadoAlcance(**self._build_alcance_kwargs(instance, alcance)) for alcance in alcances_data]
            )

        return instance

    def get_creador_nombre(self, obj):
        if obj.id_usuario_creador:
            return obj.id_usuario_creador.usuario
        return None


# ---------- Planificaciones ----------

class PlanificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Planificacion
        fields = '__all__'


# ---------- DiagnÃ³sticos grupales ----------

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


