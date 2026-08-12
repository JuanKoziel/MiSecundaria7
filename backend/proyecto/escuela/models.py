from django.db import models


class ActivoManager(models.Manager):
    """Manager por defecto que excluye registros eliminados lógicamente.

    Las entidades con borrado lógico usan la columna `estado`
    (1 = activo, 0 = eliminado). El manager aplica el filtro en todas
    las consultas (listados, selectores, relaciones y dashboards).
    """

    campo_activo = 'estado'
    valor_activo = True

    def get_queryset(self):
        return super().get_queryset().filter(**{self.campo_activo: self.valor_activo})


class PlanificacionManager(ActivoManager):
    """Manager de Planificacion: el borrado lógico usa `eliminado`
    (no `estado`, que es Borrador/Publicado). Los registros activos
    tienen `eliminado = False`."""

    campo_activo = 'eliminado'
    valor_activo = False


class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    usuario = models.CharField(max_length=50, unique=True)
    contrasena = models.CharField(max_length=255)
    estado = models.BooleanField(default=True)
    fecha_deshabilitacion_programada = models.DateTimeField(blank=True, null=True)
    fecha_habilitacion_programada = models.DateTimeField(blank=True, null=True)
    ultimo_acceso = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'usuarios'

    def __str__(self):
        return self.usuario

    def set_password(self, raw_password):
        from django.contrib.auth.hashers import make_password

        self.contrasena = make_password(raw_password)


class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=50, unique=True)

    class Meta:
        managed = False
        db_table = 'roles'

    def __str__(self):
        return self.nombre_rol


class UsuarioRol(models.Model):
    id_usuario = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, db_column='id_usuario',
        primary_key=True,
    )
    id_rol = models.ForeignKey(
        Rol, on_delete=models.CASCADE, db_column='id_rol',
    )

    class Meta:
        managed = False
        db_table = 'usuario_roles'
        unique_together = (('id_usuario', 'id_rol'),)


class PadreTutor(models.Model):
    id_tutor = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField(
        Usuario, on_delete=models.SET_NULL, db_column='id_usuario',
        blank=True, null=True,
    )
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    dni = models.CharField(max_length=20, unique=True)
    telefono = models.CharField(max_length=30, blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    correo = models.CharField(max_length=100, blank=True, null=True)
    tipo = models.CharField(max_length=30, blank=True, null=True)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'padres_tutores'

    def __str__(self):
        return f'{self.apellido}, {self.nombre}'


class CicloLectivo(models.Model):
    id_ciclo = models.AutoField(primary_key=True)
    anio = models.IntegerField()
    fecha_inicio = models.DateField(blank=True, null=True)
    fecha_fin = models.DateField(blank=True, null=True)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'ciclos_lectivos'

    def __str__(self):
        return str(self.anio)


class Preceptor(models.Model):
    id_preceptor = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField(
        Usuario, on_delete=models.SET_NULL, db_column='id_usuario',
        blank=True, null=True,
    )
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    dni = models.CharField(max_length=20, unique=True)
    correo = models.CharField(max_length=100, blank=True, null=True)
    telefono = models.CharField(max_length=30, blank=True, null=True)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'preceptores'

    def __str__(self):
        return f'{self.apellido}, {self.nombre}'


class Curso(models.Model):
    id_curso = models.AutoField(primary_key=True)
    id_preceptor = models.ForeignKey(
        Preceptor, on_delete=models.SET_NULL, db_column='id_preceptor',
        blank=True, null=True,
    )
    id_ciclo = models.ForeignKey(
        CicloLectivo, on_delete=models.SET_NULL, db_column='id_ciclo',
        blank=True, null=True,
    )
    nombre_curso = models.CharField(max_length=50)
    orientacion = models.CharField(max_length=50, blank=True, null=True)
    activo = models.BooleanField(default=True)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'cursos'

    def __str__(self):
        return self.nombre_curso


class Alumno(models.Model):
    id_alumno = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField(
        Usuario, on_delete=models.SET_NULL, db_column='id_usuario',
        blank=True, null=True,
    )
    id_tutor = models.ForeignKey(
        PadreTutor, on_delete=models.SET_NULL, db_column='id_tutor',
        blank=True, null=True,
    )
    id_curso = models.ForeignKey(
        Curso, on_delete=models.SET_NULL, db_column='id_curso',
        blank=True, null=True,
    )
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    dni = models.CharField(max_length=20, unique=True)
    fecha_nacimiento = models.DateField(blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    telefono = models.CharField(max_length=30, blank=True, null=True)
    procedencia = models.CharField(max_length=100, blank=True, null=True)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'alumnos'

    def __str__(self):
        return f'{self.apellido}, {self.nombre}'


class Docente(models.Model):
    id_docente = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField(
        Usuario, on_delete=models.SET_NULL, db_column='id_usuario',
        blank=True, null=True,
    )
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    dni = models.CharField(max_length=20, unique=True)
    correo = models.CharField(max_length=100, blank=True, null=True)
    telefono = models.CharField(max_length=30, blank=True, null=True)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'docentes'

    def __str__(self):
        return f'{self.apellido}, {self.nombre}'


class DdjjDocente(models.Model):
    id_ddjj = models.AutoField(primary_key=True)
    id_docente = models.OneToOneField(
        Docente, on_delete=models.CASCADE, db_column='id_docente',
        related_name='ddjj_docente',
    )
    ruta_archivo = models.FileField(upload_to='ddjj_docentes/', max_length=255)
    fecha_carga = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'ddjj_docente'

    def __str__(self):
        return f'DDJJ {self.id_docente}'


class ActividadDocente(models.Model):
    id_actividad = models.AutoField(primary_key=True)
    id_docente = models.ForeignKey(
        Docente, on_delete=models.CASCADE, db_column='id_docente',
        blank=True, null=True,
    )
    id_curso_materia = models.ForeignKey(
        'CursoMateria', on_delete=models.CASCADE, db_column='id_curso_materia',
        related_name='actividades_docentes',
    )
    titulo = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    ruta_archivo = models.FileField(upload_to='actividades_docentes/', max_length=255, blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'actividades_docentes'

    def __str__(self):
        return self.titulo


class ActividadDocenteArchivo(models.Model):
    id_archivo = models.AutoField(primary_key=True)
    id_actividad = models.ForeignKey(
        ActividadDocente, on_delete=models.CASCADE, db_column='id_actividad',
        related_name='archivos_adjuntos',
    )
    ruta_archivo = models.FileField(upload_to='actividades_docentes/', max_length=255)
    fecha_carga = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'actividad_docente_archivos'

    def __str__(self):
        return self.ruta_archivo.name if self.ruta_archivo else f'Archivo {self.id_archivo}'


class Directivo(models.Model):
    id_directivo = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField(
        Usuario, on_delete=models.SET_NULL, db_column='id_usuario',
        blank=True, null=True,
    )
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    dni = models.CharField(max_length=20, unique=True)
    telefono = models.CharField(max_length=30, blank=True, null=True)
    cargo = models.CharField(max_length=100, blank=True, null=True)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'directivos'

    def __str__(self):
        return f'{self.apellido}, {self.nombre}'


class Materia(models.Model):
    id_materia = models.AutoField(primary_key=True)
    nombre_materia = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'materias'

    def __str__(self):
        return self.nombre_materia


class CursoMateria(models.Model):
    id_curso_materia = models.AutoField(primary_key=True)
    id_curso = models.ForeignKey(
        Curso, on_delete=models.CASCADE, db_column='id_curso',
    )
    id_materia = models.ForeignKey(
        Materia, on_delete=models.CASCADE, db_column='id_materia',
    )
    id_docente = models.ForeignKey(
        Docente, on_delete=models.CASCADE, db_column='id_docente',
        blank=True, null=True,
    )
    activo = models.BooleanField(default=True)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'curso_materia'

    def __str__(self):
        return f'{self.id_curso} - {self.id_materia}'


class SuplenciaDocente(models.Model):
    """Suplencias docentes por materia (tabla existente en la base).

    El docente titular NUNCA se guarda aquí: se resuelve siempre a través
    de `curso_materia.id_docente`. El docente activo de una materia se
    obtiene con `utils.obtener_docente_activo()`.
    """

    id_suplencia = models.AutoField(primary_key=True)
    id_curso_materia = models.ForeignKey(
        CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia',
        related_name='suplencias',
    )
    id_docente_suplente = models.ForeignKey(
        Docente, on_delete=models.CASCADE, db_column='id_docente_suplente',
        related_name='suplencias_docente',
    )
    nivel = models.SmallIntegerField(default=1)
    motivo = models.CharField(max_length=255, blank=True, null=True)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'suplencias_docentes'

    def __str__(self):
        return f'Suplencia {self.id_suplencia}'


class PeriodoEvaluacion(models.Model):
    id_periodo = models.AutoField(primary_key=True)
    nombre_periodo = models.CharField(max_length=100, blank=True, null=True)
    orden_periodo = models.IntegerField(blank=True, null=True)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'periodos_evaluacion'

    def __str__(self):
        return self.nombre_periodo or ''


class Calificacion(models.Model):
    id_calificacion = models.AutoField(primary_key=True)
    id_alumno = models.ForeignKey(
        Alumno, on_delete=models.CASCADE, db_column='id_alumno',
    )
    id_curso_materia = models.ForeignKey(
        CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia',
    )
    id_docente = models.ForeignKey(
        Docente, on_delete=models.CASCADE, db_column='id_docente',
    )
    id_periodo = models.ForeignKey(
        PeriodoEvaluacion, on_delete=models.CASCADE, db_column='id_periodo',
    )
    pre_nota = models.CharField(max_length=10, blank=True, null=True)
    nota_numerica = models.DecimalField(
        max_digits=4, decimal_places=2, blank=True, null=True,
    )
    diagnostico = models.TextField(blank=True, null=True)
    fecha_carga = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'calificaciones'


class EstadoAsistencia(models.Model):
    id_estado_asistencia = models.AutoField(primary_key=True)
    nombre_estado = models.CharField(max_length=50, unique=True)

    class Meta:
        managed = False
        db_table = 'estados_asistencia'

    def __str__(self):
        return self.nombre_estado


class AsistenciaDocente(models.Model):
    id_asistencia_docente = models.AutoField(primary_key=True)
    id_docente = models.ForeignKey(
        Docente, on_delete=models.CASCADE, db_column='id_docente',
    )
    id_curso_materia = models.ForeignKey(
        CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia',
    )
    id_usuario = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, db_column='id_usuario',
    )
    id_estado_asistencia = models.ForeignKey(
        EstadoAsistencia, on_delete=models.CASCADE,
        db_column='id_estado_asistencia',
    )
    fecha = models.DateField()
    hora = models.TimeField()

    class Meta:
        managed = False
        db_table = 'asistencias_docentes'

    def __str__(self):
        return f'{self.id_docente} - {self.fecha}'


class Asistencia(models.Model):
    id_asistencia = models.AutoField(primary_key=True)
    id_alumno = models.ForeignKey(
        Alumno, on_delete=models.CASCADE, db_column='id_alumno',
    )
    id_curso_materia = models.ForeignKey(
        CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia',
    )
    id_usuario = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, db_column='id_usuario',
    )
    id_estado_asistencia = models.ForeignKey(
        EstadoAsistencia, on_delete=models.CASCADE,
        db_column='id_estado_asistencia',
    )
    fecha = models.DateField()
    hora = models.TimeField()
    justificado = models.BooleanField(default=False)

    class Meta:
        managed = False
        db_table = 'asistencias'


class TipoActa(models.Model):
    id_tipo_acta = models.AutoField(primary_key=True)
    nombre_tipo = models.CharField(max_length=50, unique=True)

    class Meta:
        managed = False
        db_table = 'tipos_acta'

    def __str__(self):
        return self.nombre_tipo


class Acta(models.Model):
    id_acta = models.AutoField(primary_key=True)
    id_usuario_creador = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, db_column='id_usuario_creador',
    )
    id_tipo_acta = models.ForeignKey(
        TipoActa, on_delete=models.CASCADE, db_column='id_tipo_acta',
    )
    titulo = models.CharField(max_length=255, blank=True, null=True)
    descripcion = models.TextField(blank=True, null=True)
    fecha = models.DateTimeField(blank=True, null=True)
    ruta_archivo = models.CharField(max_length=255, blank=True, null=True)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'actas'

    def __str__(self):
        return self.titulo or ''


class ActaAlumno(models.Model):
    id_acta_alumno = models.AutoField(primary_key=True)
    id_acta = models.ForeignKey(
        Acta, on_delete=models.CASCADE, db_column='id_acta',
    )
    id_alumno = models.ForeignKey(
        Alumno, on_delete=models.CASCADE, db_column='id_alumno',
    )

    class Meta:
        managed = False
        db_table = 'acta_alumno'


class ActaCurso(models.Model):
    id_acta_curso = models.AutoField(primary_key=True)
    id_acta = models.ForeignKey(
        Acta, on_delete=models.CASCADE, db_column='id_acta',
    )
    id_curso = models.ForeignKey(
        Curso, on_delete=models.CASCADE, db_column='id_curso',
    )

    class Meta:
        managed = False
        db_table = 'acta_curso'


class ActaDocente(models.Model):
    id_acta_docente = models.AutoField(primary_key=True)
    id_acta = models.ForeignKey(
        Acta, on_delete=models.CASCADE, db_column='id_acta',
    )
    id_docente = models.ForeignKey(
        'Docente', on_delete=models.CASCADE, db_column='id_docente',
    )

    class Meta:
        managed = False
        db_table = 'acta_docente'


class Modulos(models.Model):
    id_modulo = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()

    class Meta:
        managed = False
        db_table = 'modulos'

    def __str__(self):
        return f'{self.hora_inicio} - {self.hora_fin}'


class Horario(models.Model):
    id_horario = models.AutoField(primary_key=True)
    id_curso_materia = models.ForeignKey(
        CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia',
    )
    dia_semana = models.CharField(max_length=20, blank=True, null=True)
    aula = models.CharField(max_length=50, blank=True, null=True)
    id_modulo = models.ForeignKey(
        Modulos, on_delete=models.CASCADE, db_column='id_modulo',
        blank=True, null=True,
    )

    class Meta:
        managed = False
        db_table = 'horarios'


class HorariosEspeciales(models.Model):
    id_horario_especial = models.AutoField(primary_key=True)
    id_curso_materia = models.ForeignKey(
        CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia',
    )
    dia_semana = models.CharField(max_length=20)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    aula = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'horarios_especiales'


class InscripcionMateria(models.Model):
    id_inscripcion = models.AutoField(primary_key=True)
    id_alumno = models.ForeignKey(
        Alumno, on_delete=models.CASCADE, db_column='id_alumno',
    )
    id_curso_materia = models.ForeignKey(
        CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia',
    )
    estado = models.CharField(max_length=50, blank=True, null=True)
    fecha_inscripcion = models.DateField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'inscripciones_materias'


class Planificacion(models.Model):
    id_planificacion = models.AutoField(primary_key=True)
    id_docente = models.ForeignKey(
        Docente, on_delete=models.CASCADE, db_column='id_docente',
    )
    id_curso_materia = models.ForeignKey(
        CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia',
    )
    contenido = models.TextField(blank=True, null=True)
    objetivos = models.TextField(blank=True, null=True)
    salidas = models.TextField(blank=True, null=True)
    fundamentacion = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=20, blank=True, default='Borrador')
    ruta_archivo = models.CharField(max_length=255, blank=True, null=True)
    fecha_subida = models.DateTimeField(blank=True, null=True)
    fecha_ultima_modificacion = models.DateTimeField(blank=True, null=True)
    eliminado = models.BooleanField(default=False)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)

    objects = PlanificacionManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'planificaciones'

    def __str__(self):
        return f'Proyecto {self.id_planificacion}'


class DiagnosticoGrupal(models.Model):
    id_diagnostico_grupal = models.AutoField(primary_key=True)
    id_curso = models.ForeignKey(
        Curso, on_delete=models.CASCADE, db_column='id_curso',
    )
    id_docente = models.ForeignKey(
        Docente, on_delete=models.CASCADE, db_column='id_docente',
    )
    fecha = models.DateField(blank=True, null=True)
    descripcion = models.TextField(blank=True, null=True)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'diagnosticos_grupales'


class Notificacion(models.Model):
    id_notificacion = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, db_column='id_usuario',
    )
    titulo = models.CharField(max_length=255, blank=True, null=True)
    mensaje = models.TextField(blank=True, null=True)
    fecha = models.DateTimeField(blank=True, null=True)
    leida = models.BooleanField(default=False)

    class Meta:
        managed = False
        db_table = 'notificaciones'


class TipoAccion(models.Model):
    id_tipo_accion = models.AutoField(primary_key=True)
    nombre_accion = models.CharField(max_length=50, unique=True)

    class Meta:
        managed = False
        db_table = 'tipos_accion'

    def __str__(self):
        return self.nombre_accion


class HistorialCambio(models.Model):
    id_historial = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, db_column='id_usuario',
    )
    id_tipo_accion = models.ForeignKey(
        TipoAccion, on_delete=models.CASCADE, db_column='id_tipo_accion',
    )
    tabla_modificada = models.CharField(max_length=100, blank=True, null=True)
    id_registro = models.IntegerField(blank=True, null=True)
    valor_anterior = models.TextField(blank=True, null=True)
    valor_nuevo = models.TextField(blank=True, null=True)
    fecha = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'historial_cambios'


class Comunicado(models.Model):
    id_comunicado = models.AutoField(primary_key=True)
    id_usuario_creador = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, db_column='id_usuario_creador',
        blank=True, null=True,
    )
    id_curso = models.ForeignKey(
        Curso, on_delete=models.CASCADE, db_column='id_curso',
        blank=True, null=True,
    )
    id_materia = models.ForeignKey(
        Materia, on_delete=models.SET_NULL, db_column='id_materia',
        blank=True, null=True,
    )
    titulo = models.CharField(max_length=255)
    cuerpo = models.TextField(blank=True, null=True)
    fecha = models.DateTimeField(blank=True, null=True)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'comunicados'


class ComunicadoAlcance(models.Model):
    id_alcance = models.AutoField(primary_key=True)
    id_comunicado = models.ForeignKey(
        Comunicado, on_delete=models.CASCADE, db_column='id_comunicado',
        related_name='alcances',
    )
    id_ciclo = models.ForeignKey(
        CicloLectivo, on_delete=models.SET_NULL, db_column='id_ciclo',
        blank=True, null=True,
    )
    curso = models.IntegerField(blank=True, null=True)
    division = models.IntegerField(blank=True, null=True)
    id_materia = models.ForeignKey(
        Materia, on_delete=models.SET_NULL, db_column='id_materia',
        blank=True, null=True,
    )

    class Meta:
        managed = False
        db_table = 'comunicado_alcance'


class ComunicadoArchivo(models.Model):
    id_comunicado_archivo = models.AutoField(primary_key=True)
    id_comunicado = models.ForeignKey(
        Comunicado, on_delete=models.CASCADE, db_column='id_comunicado',
        related_name='archivos',
    )
    ruta_archivo = models.CharField(max_length=255)

    class Meta:
        managed = False
        db_table = 'comunicado_archivo'


class EventoInstitucional(models.Model):
    TIPO_EVENTO_CHOICES = [
        ('Feriado', 'Feriado'),
        ('Suspension', 'Suspensión de clases'),
        ('Jornada Institucional', 'Jornada Institucional'),
        ('Otro', 'Otro'),
    ]
    ALCANCE_CHOICES = [
        ('todo_dia', 'Todo el día'),
        ('manana', 'Turno mañana'),
        ('tarde', 'Turno tarde'),
        ('franja', 'Franja horaria personalizada'),
    ]
    PRIORIDAD_MAP = {
        'Feriado': 1,
        'Suspension': 2,
        'Jornada Institucional': 3,
        'Otro': 4,
    }

    id_evento = models.AutoField(primary_key=True)
    tipo_evento = models.CharField(max_length=30, choices=TIPO_EVENTO_CHOICES)
    descripcion = models.CharField(max_length=255)
    fecha = models.DateField()
    permanente = models.BooleanField(default=False)
    alcance = models.CharField(max_length=20, choices=ALCANCE_CHOICES, default='todo_dia')
    hora_inicio = models.TimeField(blank=True, null=True)
    hora_fin = models.TimeField(blank=True, null=True)
    id_usuario_creador = models.ForeignKey(
        Usuario, on_delete=models.SET_NULL, db_column='id_usuario_creador',
        blank=True, null=True, related_name='eventos_institucionales_creados',
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'eventos_institucionales'

    def __str__(self):
        return f'{self.tipo_evento} - {self.fecha}'


class AdelantoHoras(models.Model):
    """Autorización excepcional de un preceptor para adelantar una clase.

    Tabla existente `adelantos_horas`. Un adelanto habilita a un docente a
    dictar una materia (curso + materia) en una fecha y franja horaria
    determinadas, sin modificar el horario original (`horarios`).
    """

    id_adelanto = models.AutoField(primary_key=True)
    id_curso = models.ForeignKey(
        Curso, on_delete=models.CASCADE, db_column='id_curso',
        related_name='adelantos_horas',
    )
    id_materia = models.ForeignKey(
        Materia, on_delete=models.CASCADE, db_column='id_materia',
        related_name='adelantos_horas',
    )
    id_docente = models.ForeignKey(
        Docente, on_delete=models.CASCADE, db_column='id_docente',
        related_name='adelantos_horas',
    )
    fecha_adelanto = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    mantener_horario_original = models.BooleanField(default=False)
    motivo = models.CharField(max_length=255, blank=True, null=True)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)
    id_usuario_autorizador = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, db_column='id_usuario_autorizador',
        related_name='adelantos_autorizados',
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'adelantos_horas'

    def __str__(self):
        return f'Adelanto {self.id_adelanto} - {self.id_materia}'


class LibroTema(models.Model):
    """Registro del Libro de Temas por materia (tabla existente en la base).

    El `id_docente` guarda siempre el docente que efectivamente cargó el
    registro (el activo de la materia, sea titular o suplente); nunca se
    guarda el titular separado, se resuelve con `utils.obtener_docente_activo`.
    """

    id_libro_tema = models.AutoField(primary_key=True)
    id_curso_materia = models.ForeignKey(
        CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia',
        related_name='libro_temas',
    )
    id_docente = models.ForeignKey(
        Docente, on_delete=models.CASCADE, db_column='id_docente',
        related_name='libro_temas',
    )
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    descripcion = models.TextField()
    ruta_archivo = models.CharField(max_length=255, blank=True, null=True)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'libro_temas'

    def __str__(self):
        return f'Libro de Temas {self.id_libro_tema}'


# ===========================================================================
# Sistema académico: historial, materias adeudadas, intensificaciones,
# previas, recursadas, promoción de año y reflejo en el boletín.
#
# Todas estas tablas fueron creadas manualmente en MySQL (managed=False).
# NO se deben ejecutar migraciones que las creen nuevamente.
# ===========================================================================


class HistorialAcademico(models.Model):
    """Registro histórico de cada materia cursada por cada alumno.

    Un registro por alumno + curso_materia + año lectivo. Cuando el alumno
    pasa de año el registro histórico NO se reemplaza: se conserva tal cual.
    """

    ESTADO_MATERIA_CHOICES = [
        ('aprobada', 'Aprobada'),
        ('intensificacion', 'Aprobada por intensificación'),
        ('adeudada', 'Adeudada'),
        ('recursando', 'Recursando'),
        ('no_cursada', 'No cursada'),
    ]
    PERIODO_APROBACION_CHOICES = [
        ('cuatrimestre', 'Cuatrimestre'),
        ('intensificacion', 'Intensificación'),
        ('diciembre', 'Diciembre'),
        ('febrero_marzo', 'Febrero/Marzo'),
        ('previa', 'Previa'),
    ]

    id_historial = models.AutoField(primary_key=True)
    id_alumno = models.ForeignKey(
        Alumno, on_delete=models.CASCADE, db_column='id_alumno',
        related_name='historial_academico',
    )
    id_curso_materia = models.ForeignKey(
        CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia',
        related_name='historial_academico',
    )
    id_curso = models.ForeignKey(
        Curso, on_delete=models.CASCADE, db_column='id_curso',
        related_name='historial_academico',
    )
    id_materia = models.ForeignKey(
        Materia, on_delete=models.CASCADE, db_column='id_materia',
        related_name='historial_academico',
    )
    anio_lectivo = models.IntegerField()
    nota_1_cuatrimestre = models.DecimalField(
        max_digits=4, decimal_places=2, blank=True, null=True,
    )
    nota_2_cuatrimestre = models.DecimalField(
        max_digits=4, decimal_places=2, blank=True, null=True,
    )
    nota_final = models.DecimalField(
        max_digits=4, decimal_places=2, blank=True, null=True,
    )
    estado_materia = models.CharField(
        max_length=20, choices=ESTADO_MATERIA_CHOICES, default='no_cursada',
    )
    periodo_aprobacion = models.CharField(
        max_length=20, choices=PERIODO_APROBACION_CHOICES, blank=True, null=True,
    )
    anio_aprobacion = models.IntegerField(blank=True, null=True)
    es_recursada = models.BooleanField(default=False)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'historial_academico'

    def __str__(self):
        return f'Historial {self.id_alumno_id} - {self.id_materia_id} - {self.anio_lectivo}'


class IntensificacionAcademica(models.Model):
    """Instancia de intensificación de una materia adeudada.

    Cada fila representa una instancia (marzo, julio, agosto, diciembre 1,
    diciembre 2, febrero) en la que el alumno rindió/intensificó la materia.
    """

    PERIODO_CHOICES = [
        ('MARZO', 'Marzo'),
        ('JULIO', 'Julio'),
        ('AGOSTO', 'Agosto'),
        ('DICIEMBRE_1', 'Diciembre 1'),
        ('DICIEMBRE_2', 'Diciembre 2'),
        ('FEBRERO', 'Febrero'),
    ]
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('APROBADA', 'Aprobada'),
        ('DESAPROBADA', 'Desaprobada'),
    ]

    id_intensificacion = models.AutoField(primary_key=True)
    id_historial = models.ForeignKey(
        HistorialAcademico, on_delete=models.CASCADE, db_column='id_historial',
        related_name='intensificaciones',
    )
    periodo = models.CharField(max_length=20, choices=PERIODO_CHOICES)
    anio_rendicion = models.IntegerField()
    nota = models.DecimalField(
        max_digits=4, decimal_places=2, blank=True, null=True,
    )
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    fecha_registro = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'intensificaciones_academicas'

    def __str__(self):
        return f'Intensificación {self.id_historial_id} - {self.periodo} {self.anio_rendicion}'


class MateriaAdeudada(models.Model):
    """Materia que un alumno adeuda de un año anterior.

    - tipo_deuda PREVIA: se rinde en instancias de examen (marzo/julio/...).
    - tipo_deuda RECURSADA: el alumno debe volver a cursarla normalmente.
    El límite de 4 previas se controla en el servicio `academico`.
    """

    TIPO_DEUDA_CHOICES = [
        ('PREVIA', 'Previa'),
        ('RECURSADA', 'Recursada'),
    ]
    ESTADO_CHOICES = [
        ('ADEUDADA', 'Adeudada'),
        ('APROBADA', 'Aprobada'),
        ('RECURSANDO', 'Recursando'),
    ]

    id_materia_adeudada = models.AutoField(primary_key=True)
    id_alumno = models.ForeignKey(
        Alumno, on_delete=models.CASCADE, db_column='id_alumno',
        related_name='materias_adeudadas',
    )
    id_materia = models.ForeignKey(
        Materia, on_delete=models.CASCADE, db_column='id_materia',
        related_name='materias_adeudadas',
    )
    id_curso_origen = models.ForeignKey(
        Curso, on_delete=models.CASCADE, db_column='id_curso_origen',
        related_name='materias_adeudadas_origen',
    )
    tipo_deuda = models.CharField(max_length=20, choices=TIPO_DEUDA_CHOICES, default='PREVIA')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ADEUDADA')
    fecha_generacion = models.DateTimeField(blank=True, null=True)
    fecha_aprobacion = models.DateTimeField(blank=True, null=True)
    id_curso_actual = models.ForeignKey(
        Curso, on_delete=models.SET_NULL, db_column='id_curso_actual',
        related_name='materias_adeudadas_actual', blank=True, null=True,
    )
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'materias_adeudadas'

    def __str__(self):
        return f'{self.id_materia_id} - {self.id_alumno_id} - {self.tipo_deuda}'


class ActividadMateriaAdeudada(models.Model):
    """Actividad (con PDF) que un docente publica para materias adeudadas.

    - tipo INTENSIFICACION: recuperación sin volver a cursar.
    - tipo PREVIA: actividad de apoyo para una previa.
    """

    TIPO_CHOICES = [
        ('INTENSIFICACION', 'Intensificación'),
        ('PREVIA', 'Previa'),
    ]

    id_actividad = models.AutoField(primary_key=True)
    id_curso_materia = models.ForeignKey(
        CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia',
        related_name='actividades_materias_adeudadas',
    )
    id_docente = models.ForeignKey(
        Docente, on_delete=models.CASCADE, db_column='id_docente',
        related_name='actividades_materias_adeudadas',
    )
    titulo = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    archivo_pdf = models.FileField(upload_to='materias_adeudadas/', max_length=500, blank=True, null=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    fecha_publicacion = models.DateTimeField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'actividades_materias_adeudadas'

    def __str__(self):
        return self.titulo


class RendicionMateriaAdeudada(models.Model):
    """Rendición de una materia adeudada en una instancia determinada."""

    PERIODO_CHOICES = IntensificacionAcademica.PERIODO_CHOICES
    ESTADO_CHOICES = [
        ('APROBADA', 'Aprobada'),
        ('DESAPROBADA', 'Desaprobada'),
        ('PENDIENTE', 'Pendiente'),
    ]

    id_rendicion = models.AutoField(primary_key=True)
    id_materia_adeudada = models.ForeignKey(
        MateriaAdeudada, on_delete=models.CASCADE, db_column='id_materia_adeudada',
        related_name='rendiciones',
    )
    id_alumno = models.ForeignKey(
        Alumno, on_delete=models.CASCADE, db_column='id_alumno',
        related_name='rendiciones_materias_adeudadas',
    )
    id_docente = models.ForeignKey(
        Docente, on_delete=models.CASCADE, db_column='id_docente',
        related_name='rendiciones_materias_adeudadas',
    )
    anio_rendicion = models.IntegerField()
    periodo = models.CharField(max_length=20, choices=PERIODO_CHOICES)
    nota = models.DecimalField(
        max_digits=4, decimal_places=2, blank=True, null=True,
    )
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    fecha_rendicion = models.DateTimeField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    fecha_registro = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'rendiciones_materias_adeudadas'

    def __str__(self):
        return f'Rendición {self.id_rendicion} - {self.periodo} {self.anio_rendicion}'


class HistorialCursoAlumno(models.Model):
    """Registro de los cursos por los que pasó cada alumno, por año lectivo."""

    ESTADO_CHOICES = [
        ('CURSANDO', 'Cursando'),
        ('FINALIZADO', 'Finalizado'),
        ('PROMOVIDO', 'Promovido'),
        ('REPITENTE', 'Repitente'),
        ('EGRESADO', 'Egresado'),
    ]

    id_historial_curso = models.AutoField(primary_key=True)
    id_alumno = models.ForeignKey(
        Alumno, on_delete=models.CASCADE, db_column='id_alumno',
        related_name='historial_cursos',
    )
    id_curso = models.ForeignKey(
        Curso, on_delete=models.CASCADE, db_column='id_curso',
        related_name='historial_cursos_alumno',
    )
    anio_lectivo = models.IntegerField()
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='CURSANDO')
    fecha_ingreso = models.DateField(blank=True, null=True)
    fecha_finalizacion = models.DateField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'historial_cursos_alumno'

    def __str__(self):
        return f'HC {self.id_alumno_id} - {self.id_curso_id} - {self.anio_lectivo}'


class BloqueoHorarioAlumno(models.Model):
    """Bloqueo de una materia del año actual por superposición de horario
    con una materia recursada de un año anterior."""

    MOTIVO_CHOICES = [
        ('SUPERPOSICION_RECURSADA', 'Superposición con recursada'),
    ]

    id_bloqueo = models.AutoField(primary_key=True)
    id_alumno = models.ForeignKey(
        Alumno, on_delete=models.CASCADE, db_column='id_alumno',
        related_name='bloqueos_horarios',
    )
    id_materia_bloqueada = models.ForeignKey(
        Materia, on_delete=models.CASCADE, db_column='id_materia_bloqueada',
        related_name='bloqueos_materia_bloqueada',
    )
    id_curso_materia_bloqueada = models.ForeignKey(
        CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia_bloqueada',
        related_name='bloqueos_cm_bloqueada',
    )
    id_materia_prioritaria = models.ForeignKey(
        Materia, on_delete=models.CASCADE, db_column='id_materia_prioritaria',
        related_name='bloqueos_materia_prioritaria',
    )
    id_curso_materia_prioritaria = models.ForeignKey(
        CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia_prioritaria',
        related_name='bloqueos_cm_prioritaria',
    )
    id_materia_recursada = models.ForeignKey(
        Materia, on_delete=models.CASCADE, db_column='id_materia_recursada',
        related_name='bloqueos_materia_recursada',
    )
    id_curso_materia_recursada = models.ForeignKey(
        CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia_recursada',
        related_name='bloqueos_cm_recursada',
    )
    motivo = models.CharField(max_length=30, choices=MOTIVO_CHOICES, default='SUPERPOSICION_RECURSADA')
    estado = models.BooleanField(default=True)
    fecha_bloqueo = models.DateTimeField(blank=True, null=True)
    fecha_desbloqueo = models.DateTimeField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'bloqueos_horarios_alumno'

    def __str__(self):
        return f'Bloqueo {self.id_bloqueo} - alumno {self.id_alumno_id}'


class PromocionAlumno(models.Model):
    """Registro de promoción/repite/egreso de un alumno por año lectivo."""

    RESULTADO_CHOICES = [
        ('PROMOVIDO', 'Promovido'),
        ('REPITENTE', 'Repitente'),
        ('EGRESADO', 'Egresado'),
    ]

    id_promocion = models.AutoField(primary_key=True)
    id_alumno = models.ForeignKey(
        Alumno, on_delete=models.CASCADE, db_column='id_alumno',
        related_name='promociones',
    )
    id_historial_curso = models.ForeignKey(
        HistorialCursoAlumno, on_delete=models.CASCADE, db_column='id_historial_curso',
        related_name='promociones',
    )
    anio_lectivo = models.IntegerField()
    resultado = models.CharField(max_length=20, choices=RESULTADO_CHOICES)
    curso_origen = models.ForeignKey(
        Curso, on_delete=models.CASCADE, db_column='curso_origen',
        related_name='promociones_origen',
    )
    curso_destino = models.ForeignKey(
        Curso, on_delete=models.SET_NULL, db_column='curso_destino',
        related_name='promociones_destino', blank=True, null=True,
    )
    fecha_resolucion = models.DateTimeField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'promociones_alumno'

    def __str__(self):
        return f'Promoción {self.id_alumno_id} - {self.anio_lectivo}'


class RecursadaMateria(models.Model):
    """Materia que un alumno vuelve a cursar normalmente.

    La recursada se cursa dentro de un curso inferior (`id_curso_recursada`),
    en paralelo a las materias normales del año actual.
    """

    ESTADO_CHOICES = [
        ('ACTIVA', 'Activa'),
        ('APROBADA', 'Aprobada'),
        ('DESAPROBADA', 'Desaprobada'),
    ]

    id_recursada = models.AutoField(primary_key=True)
    id_alumno = models.ForeignKey(
        Alumno, on_delete=models.CASCADE, db_column='id_alumno',
        related_name='recursadas_materias',
    )
    id_materia = models.ForeignKey(
        Materia, on_delete=models.CASCADE, db_column='id_materia',
        related_name='recursadas_materias',
    )
    id_curso_origen = models.ForeignKey(
        Curso, on_delete=models.CASCADE, db_column='id_curso_origen',
        related_name='recursadas_curso_origen',
    )
    id_curso_recursada = models.ForeignKey(
        Curso, on_delete=models.CASCADE, db_column='id_curso_recursada',
        related_name='recursadas_curso_recursada',
    )
    anio_inicio = models.IntegerField()
    anio_finalizacion = models.IntegerField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ACTIVA')
    motivo = models.CharField(max_length=255, blank=True, null=True)
    fecha_registro = models.DateTimeField(blank=True, null=True)
    fecha_finalizacion = models.DateTimeField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'recursadas_materias'

    def __str__(self):
        return f'Recursada {self.id_recursada} - {self.id_materia_id}'


class RecursadaCalificacion(models.Model):
    """Calificaciones de una materia recursada (período, nota, diagnóstico)."""

    id_calificacion_recursada = models.AutoField(primary_key=True)
    id_recursada = models.ForeignKey(
        RecursadaMateria, on_delete=models.CASCADE, db_column='id_recursada',
        related_name='calificaciones',
    )
    id_docente = models.ForeignKey(
        Docente, on_delete=models.CASCADE, db_column='id_docente',
        related_name='calificaciones_recursadas',
    )
    periodo = models.CharField(max_length=50)
    nota = models.DecimalField(
        max_digits=4, decimal_places=2, blank=True, null=True,
    )
    diagnostico = models.TextField(blank=True, null=True)
    fecha_carga = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'materias_recursadas_calificaciones'

    def __str__(self):
        return f'Cal {self.id_calificacion_recursada} - recursada {self.id_recursada_id}'


class BloqueoMateriaRecursada(models.Model):
    """Bloqueo histórico de una materia recursada sobre un curso_materia."""

    id_bloqueo = models.AutoField(primary_key=True)
    id_alumno = models.ForeignKey(
        Alumno, on_delete=models.CASCADE, db_column='id_alumno',
        related_name='bloqueos_materias_recursadas',
    )
    id_materia_recursada = models.ForeignKey(
        MateriaAdeudada, on_delete=models.CASCADE, db_column='id_materia_recursada',
        related_name='bloqueos_materia_recursada',
    )
    id_curso_materia_bloqueada = models.ForeignKey(
        CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia_bloqueada',
        related_name='bloqueos_materias_recursadas',
    )
    motivo = models.CharField(max_length=255)
    anio_lectivo = models.IntegerField()
    activo = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(blank=True, null=True)
    fecha_desactivacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'bloqueos_materias_recursadas'

    def __str__(self):
        return f'Bloqueo recursada {self.id_bloqueo}'


class RegistroRendicionPrevia(models.Model):
    """Historial de rendiciones de una materia previa (una por instancia).

    Una previa puede rendirse varias veces a lo largo de los años; cada
    intento queda registrado aquí y nunca se pierde.
    """

    PERIODO_CHOICES = IntensificacionAcademica.PERIODO_CHOICES
    RESULTADO_CHOICES = [
        ('APROBADA', 'Aprobada'),
        ('DESAPROBADA', 'Desaprobada'),
    ]

    id_registro = models.AutoField(primary_key=True)
    id_alumno = models.ForeignKey(
        Alumno, on_delete=models.CASCADE, db_column='id_alumno',
        related_name='registros_rendiciones_previas',
    )
    id_materia_adeudada = models.ForeignKey(
        MateriaAdeudada, on_delete=models.CASCADE, db_column='id_materia_adeudada',
        related_name='registros_rendiciones',
    )
    id_materia = models.ForeignKey(
        Materia, on_delete=models.CASCADE, db_column='id_materia',
        related_name='registros_rendiciones_previas',
    )
    id_curso_origen = models.ForeignKey(
        Curso, on_delete=models.CASCADE, db_column='id_curso_origen',
        related_name='registros_rendiciones_previas',
    )
    anio_rendicion = models.IntegerField()
    periodo = models.CharField(max_length=20, choices=PERIODO_CHOICES)
    nota = models.DecimalField(
        max_digits=4, decimal_places=2, blank=True, null=True,
    )
    resultado = models.CharField(max_length=20, choices=RESULTADO_CHOICES)
    id_docente = models.ForeignKey(
        Docente, on_delete=models.SET_NULL, db_column='id_docente',
        related_name='registros_rendiciones_previas', blank=True, null=True,
    )
    fecha_rendicion = models.DateTimeField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'registro_rendiciones_previas'

    def __str__(self):
        return f'Registro previa {self.id_registro} - {self.periodo} {self.anio_rendicion}'


class ResultadoActividadAdeudada(models.Model):
    """Nota/resultado de una actividad de intensificación (o previa).

    El alumno entrega la actividad de forma física; el docente registra
    la nota aquí posteriormente.
    """

    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('APROBADA', 'Aprobada'),
        ('DESAPROBADA', 'Desaprobada'),
    ]

    id_resultado = models.AutoField(primary_key=True)
    id_actividad = models.ForeignKey(
        ActividadMateriaAdeudada, on_delete=models.CASCADE, db_column='id_actividad',
        related_name='resultados',
    )
    id_alumno = models.ForeignKey(
        Alumno, on_delete=models.CASCADE, db_column='id_alumno',
        related_name='resultados_actividades_adeudadas',
    )
    id_intensificacion = models.ForeignKey(
        IntensificacionAcademica, on_delete=models.SET_NULL, db_column='id_intensificacion',
        related_name='resultados', blank=True, null=True,
    )
    nota = models.DecimalField(
        max_digits=4, decimal_places=2, blank=True, null=True,
    )
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    fecha_evaluacion = models.DateTimeField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'resultados_actividades_adeudadas'

    def __str__(self):
        return f'Resultado {self.id_resultado} - {self.estado}'


class SituacionMateriaAlumno(models.Model):
    """Situación académica de un alumno en cada materia de cada año.

    Es la fuente para el boletín: CURSANDO, APROBADA, INTENSIFICANDO,
    ADEUDADA, RECURSANDO, BLOQUEADA.
    """

    SITUACION_CHOICES = [
        ('CURSANDO', 'Cursando'),
        ('APROBADA', 'Aprobada'),
        ('INTENSIFICANDO', 'Intensificando'),
        ('ADEUDADA', 'Adeudada'),
        ('RECURSANDO', 'Recursando'),
        ('BLOQUEADA', 'Bloqueada'),
    ]

    id_situacion = models.AutoField(primary_key=True)
    id_alumno = models.ForeignKey(
        Alumno, on_delete=models.CASCADE, db_column='id_alumno',
        related_name='situaciones_materias',
    )
    id_curso_materia = models.ForeignKey(
        CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia',
        related_name='situaciones_materias',
    )
    anio_lectivo = models.IntegerField()
    situacion = models.CharField(max_length=20, choices=SITUACION_CHOICES, default='CURSANDO')
    motivo_bloqueo = models.TextField(blank=True, null=True)
    es_materia_original = models.BooleanField(default=True)
    fecha_inicio = models.DateTimeField(blank=True, null=True)
    fecha_fin = models.DateTimeField(blank=True, null=True)
    estado = models.BooleanField(default=True)
    fecha_eliminacion = models.DateTimeField(blank=True, null=True)

    objects = ActivoManager()
    all_objects = models.Manager()

    class Meta:
        managed = False
        db_table = 'situaciones_materias_alumno'

    def __str__(self):
        return f'{self.id_alumno_id} - {self.id_curso_materia_id} - {self.situacion}'
