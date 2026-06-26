from django.db import models

# ==========================================
# 1. MÓDULO DE USUARIOS Y ROLES
# ==========================================

class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'roles'

    def __str__(self):
        return self.nombre_rol


class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    usuario = models.CharField(max_length=50, unique=True)
    contrasena = models.CharField(max_length=255)
    estado = models.BooleanField(default=True)
    ultimo_acceso = models.DateTimeField(null=True, blank=True)
    
    # Tabla intermedia explicita para 'usuario_roles'
    roles = models.ManyToManyField(Rol, through='UsuarioRol', related_name='usuarios')

    class Meta:
        db_table = 'usuarios'

    def __str__(self):
        return self.usuario


class UsuarioRol(models.Model):
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_usuario')
    id_rol = models.ForeignKey(Rol, on_delete=models.CASCADE, db_column='id_rol')

    class Meta:
        db_table = 'usuario_roles'
        unique_together = (('id_usuario', 'id_rol'),)


# ==========================================
# 2. MÓDULO DE ACTORES (PERSONAL Y TUTORES)
# ==========================================

class PadreTutor(models.Model):
    id_tutor = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField(Usuario, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_usuario')
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    dni = models.CharField(max_length=20, unique=True)
    telefono = models.CharField(max_length=30, null=True, blank=True)
    direccion = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = 'padres_tutores'

    def __str__(self):
        return f"{self.apellido}, {self.nombre}"


class Preceptor(models.Model):
    id_preceptor = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField(Usuario, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_usuario')
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    dni = models.CharField(max_length=20, unique=True)
    correo = models.CharField(max_length=100, null=True, blank=True)
    telefono = models.CharField(max_length=30, null=True, blank=True)

    class Meta:
        db_table = 'preceptores'

    def __str__(self):
        return f"Preceptor: {self.apellido}, {self.nombre}"


class Docente(models.Model):
    id_docente = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField(Usuario, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_usuario')
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    dni = models.CharField(max_length=20, unique=True)
    correo = models.CharField(max_length=100, null=True, blank=True)
    telefono = models.CharField(max_length=30, null=True, blank=True)

    class Meta:
        db_table = 'docentes'

    def __str__(self):
        return f"Docente: {self.apellido}, {self.nombre}"


class Directivo(models.Model):
    id_directivo = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField(Usuario, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_usuario')
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    dni = models.CharField(max_length=20, unique=True)
    telefono = models.CharField(max_length=30, null=True, blank=True)
    cargo = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = 'directivos'

    def __str__(self):
        return f"Directivo: {self.apellido}, {self.nombre} ({self.cargo})"


# ==========================================
# 3. MÓDULO ACADÉMICO (CURSOS, MATERIAS, ALUMNOS)
# ==========================================

class CicloLectivo(models.Model):
    id_ciclo = models.AutoField(primary_key=True)
    anio = models.IntegerField()  # Django maneja el tipo YEAR de SQL como Integer
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'cycles_lectivos' if hasattr(models, 'cycles_lectivos') else 'ciclos_lectivos'

    def __str__(self):
        return str(self.anio)


class Curso(models.Model):
    id_curso = models.AutoField(primary_key=True)
    id_preceptor = models.ForeignKey(Preceptor, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_preceptor')
    id_ciclo = models.ForeignKey(CicloLectivo, on_delete=models.PROTECT, null=True, blank=True, db_column='id_ciclo')
    nombre_curso = models.CharField(max_length=50)
    turno = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = 'cursos'

    def __str__(self):
        return f"{self.nombre_curso} - {self.turno}"


class Alumno(models.Model):
    id_alumno = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField(Usuario, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_usuario')
    id_tutor = models.ForeignKey(PadreTutor, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_tutor')
    id_curso = models.ForeignKey(Curso, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_curso')
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    dni = models.CharField(max_length=20, unique=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    direccion = models.CharField(max_length=255, null=True, blank=True)
    telefono = models.CharField(max_length=30, null=True, blank=True)
    procedencia = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = 'alumnos'

    def __str__(self):
        return f"Alumno: {self.apellido}, {self.nombre}"


class Materia(models.Model):
    id_materia = models.AutoField(primary_key=True)
    nombre_materia = models.CharField(max_length=100)
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'materias'

    def __str__(self):
        return self.nombre_materia


class CursoMateria(models.Model):
    id_curso_materia = models.AutoField(primary_key=True)
    id_curso = models.ForeignKey(Curso, on_delete=models.CASCADE, db_column='id_curso')
    id_materia = models.ForeignKey(Materia, on_delete=models.CASCADE, db_column='id_materia')
    id_docente = models.ForeignKey(Docente, on_delete=models.PROTECT, db_column='id_docente')

    class Meta:
        db_table = 'curso_materia'

    def __str__(self):
        return f"{self.id_materia} en {self.id_curso}"


class Modulo(models.Model):
    id_modulo = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()

    class Meta:
        db_table = 'modulos'

    def __str__(self):
        return f'{self.hora_inicio} - {self.hora_fin}'


class Horario(models.Model):
    id_horario = models.AutoField(primary_key=True)
    id_curso_materia = models.ForeignKey(CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia')
    dia_semana = models.CharField(max_length=20, null=True, blank=True)
    aula = models.CharField(max_length=50, null=True, blank=True)
    id_modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE, db_column='id_modulo', null=True, blank=True)

    class Meta:
        db_table = 'horarios'


class HorarioEspecial(models.Model):
    id_horario_especial = models.AutoField(primary_key=True)
    id_curso_materia = models.ForeignKey(CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia')
    dia_semana = models.CharField(max_length=20)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    aula = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = 'horarios_especiales'


# ==========================================
# 4. GESTIÓN DIARIA (ASISTENCIAS Y PLANIFICACIONES)
# ==========================================

class EstadoAsistencia(models.Model):
    id_estado_asistencia = models.AutoField(primary_key=True)
    nombre_estado = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'estados_asistencia'

    def __str__(self):
        return self.nombre_estado


class InscripcionMateria(models.Model):
    id_inscripcion = models.AutoField(primary_key=True)
    id_alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, db_column='id_alumno')
    id_curso_materia = models.ForeignKey(CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia')
    estado = models.CharField(max_length=50, null=True, blank=True)
    fecha_inscripcion = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'inscripciones_materias'


class Asistencia(models.Model):
    id_asistencia = models.AutoField(primary_key=True)
    id_alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, db_column='id_alumno')
    id_curso_materia = models.ForeignKey(CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia')
    id_usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario')
    id_estado_asistencia = models.ForeignKey(EstadoAsistencia, on_delete=models.PROTECT, db_column='id_estado_asistencia')
    fecha = models.DateField()
    observacion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'asistencias'


class PeriodoEvaluacion(models.Model):
    id_periodo = models.AutoField(primary_key=True)
    nombre_periodo = models.CharField(max_length=100, null=True, blank=True)
    orden_periodo = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'periodos_evaluacion'

    def __str__(self):
        return self.nombre_periodo or f"Periodo {self.id_periodo}"


class Calificacion(models.Model):
    id_calificacion = models.AutoField(primary_key=True)
    id_alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, db_column='id_alumno')
    id_curso_materia = models.ForeignKey(CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia')
    id_docente = models.ForeignKey(Docente, on_delete=models.PROTECT, db_column='id_docente')
    id_periodo = models.ForeignKey(PeriodoEvaluacion, on_delete=models.PROTECT, db_column='id_periodo')
    pre_nota = models.CharField(max_length=10, null=True, blank=True)
    # CORREGIDO: Removido el max_length que causaba conflicto
    nota_numerica = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    diagnostico = models.TextField(null=True, blank=True)
    fecha_carga = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'calificaciones'


class DiagnosticoGrupal(models.Model):
    id_diagnostico_grupal = models.AutoField(primary_key=True)
    id_curso = models.ForeignKey(Curso, on_delete=models.CASCADE, db_column='id_curso')
    id_docente = models.ForeignKey(Docente, on_delete=models.CASCADE, db_column='id_docente')
    fecha = models.DateField(null=True, blank=True)
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'diagnosticos_grupales'


class Planificacion(models.Model):
    id_planificacion = models.AutoField(primary_key=True)
    id_docente = models.ForeignKey(Docente, on_delete=models.CASCADE, db_column='id_docente')
    id_curso_materia = models.ForeignKey(CursoMateria, on_delete=models.CASCADE, db_column='id_curso_materia')
    titulo = models.CharField(max_length=255, null=True, blank=True)
    descripcion = models.TextField(null=True, blank=True)
    ruta_archivo = models.CharField(max_length=255, null=True, blank=True)
    fecha_subida = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'planificaciones'


# ==========================================
# 5. DOCUMENTACIÓN, COMUNICACIÓN E HISTORIAL
# ==========================================

class TipoActa(models.Model):
    id_tipo_acta = models.AutoField(primary_key=True)
    nombre_tipo = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'tipos_acta'

    def __str__(self):
        return self.nombre_tipo


class Acta(models.Model):
    id_acta = models.AutoField(primary_key=True)
    id_usuario_creador = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario_creador')
    id_tipo_acta = models.ForeignKey(TipoActa, on_delete=models.PROTECT, db_column='id_tipo_acta')
    titulo = models.CharField(max_length=255, null=True, blank=True)
    descripcion = models.TextField(null=True, blank=True)
    fecha = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'actas'


class ActaAlumno(models.Model):
    id_acta_alumno = models.AutoField(primary_key=True)
    id_acta = models.ForeignKey(Acta, on_delete=models.CASCADE, db_column='id_acta')
    id_alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, db_column='id_alumno')

    class Meta:
        db_table = 'acta_alumno'


class ActaCurso(models.Model):
    id_acta_curso = models.AutoField(primary_key=True)
    id_acta = models.ForeignKey(Acta, on_delete=models.CASCADE, db_column='id_acta')
    id_curso = models.ForeignKey(Curso, on_delete=models.CASCADE, db_column='id_curso')

    class Meta:
        db_table = 'acta_curso'


class Notificacion(models.Model):
    id_notificacion = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_usuario')
    titulo = models.CharField(max_length=255, null=True, blank=True)
    mensaje = models.TextField(null=True, blank=True)
    fecha = models.DateTimeField(null=True, blank=True)
    leida = models.BooleanField(default=False)

    class Meta:
        db_table = 'notificaciones'


class TipoAccion(models.Model):
    id_tipo_accion = models.AutoField(primary_key=True)
    nombre_accion = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'tipos_accion'

    def __str__(self):
        return self.nombre_accion


class HistorialCambio(models.Model):
    id_historial = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario')
    id_tipo_accion = models.ForeignKey(TipoAccion, on_delete=models.PROTECT, db_column='id_tipo_accion')
    tabla_modificada = models.CharField(max_length=100, null=True, blank=True)
    id_registro = models.IntegerField(null=True, blank=True)
    valor_anterior = models.TextField(null=True, blank=True)
    valor_nuevo = models.TextField(null=True, blank=True)
    fecha = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'historial_cambios'