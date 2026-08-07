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
