from django.db import models
from django.conf import settings

from usuarios.models import (
    Alumno,
    Tutor,
    Docente,
    Empleado
)


# ==========================================
# CICLOS LECTIVOS
# ==========================================

class CicloLectivo(models.Model):

    anio = models.IntegerField(
        unique=True
    )

    activo = models.BooleanField(
        default=False
    )

    def __str__(self):
        return str(self.anio)


# ==========================================
# ORIENTACIONES
# ==========================================

class Orientacion(models.Model):

    nombre = models.CharField(
        max_length=150,
        unique=True
    )

    def __str__(self):
        return self.nombre


# ==========================================
# CURSOS
# ==========================================

class Curso(models.Model):

    anio = models.IntegerField()

    division = models.CharField(max_length=50)

    orientacion = models.ForeignKey(
        Orientacion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cursos"
    )

    class Meta:
        unique_together = (
            "anio",
            "division",
            "orientacion"
        )

    def __str__(self):

        if self.orientacion:
            return f"{self.anio}° {self.division} - {self.orientacion.nombre}"

        return f"{self.anio}° {self.division}"


# ==========================================
# ALUMNOS EN CURSOS
# ==========================================

class AlumnoCurso(models.Model):

    alumno = models.ForeignKey(
        Alumno,
        on_delete=models.CASCADE,
        related_name="cursos"
    )

    curso = models.ForeignKey(
        Curso,
        on_delete=models.CASCADE,
        related_name="alumnos"
    )

    ciclo_lectivo = models.ForeignKey(
        CicloLectivo,
        on_delete=models.CASCADE
    )

    fecha_ingreso = models.DateField()

    class Meta:
        unique_together = (
            "alumno",
            "curso",
            "ciclo_lectivo"
        )

    def __str__(self):
        return f"{self.alumno} - {self.curso}"


# ==========================================
# MATERIAS
# ==========================================

class Materia(models.Model):

    nombre = models.CharField(
        max_length=150,
        unique=True
    )

    class Meta:
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


# ==========================================
# MATERIAS POR CURSO
# ==========================================

class MateriaCurso(models.Model):

    materia = models.ForeignKey(
        Materia,
        on_delete=models.CASCADE,
        related_name="cursos"
    )

    curso = models.ForeignKey(
        Curso,
        on_delete=models.CASCADE,
        related_name="materias"
    )

    carga_horaria = models.PositiveIntegerField()

    class Meta:
        unique_together = (
            "materia",
            "curso"
        )

    def __str__(self):
        return f"{self.materia} - {self.curso}"


# ==========================================
# DOCENTES POR MATERIA
# ==========================================

class DocenteMateria(models.Model):

    docente = models.ForeignKey(
        Docente,
        on_delete=models.CASCADE,
        related_name="materias"
    )

    materia_curso = models.ForeignKey(
        MateriaCurso,
        on_delete=models.CASCADE,
        related_name="docentes"
    )

    ciclo_lectivo = models.ForeignKey(
        CicloLectivo,
        on_delete=models.CASCADE
    )

    situacion_revista = models.CharField(
        max_length=50
    )

    fecha_inicio = models.DateField()

    fecha_fin = models.DateField(
        blank=True,
        null=True
    )

    class Meta:
        unique_together = (
            "docente",
            "materia_curso",
            "ciclo_lectivo"
        )

    def __str__(self):
        return f"{self.docente} - {self.materia_curso}"


# ==========================================
# PRECEPTORES POR CURSO
# ==========================================

class PreceptorCurso(models.Model):

    preceptor = models.ForeignKey(
        Empleado,
        on_delete=models.CASCADE,
        related_name="cursos_asignados"
    )

    curso = models.ForeignKey(
        Curso,
        on_delete=models.CASCADE
    )

    ciclo_lectivo = models.ForeignKey(
        CicloLectivo,
        on_delete=models.CASCADE
    )

    class Meta:
        unique_together = (
            "preceptor",
            "curso",
            "ciclo_lectivo"
        )


# ==========================================
# TUTORES Y ALUMNOS
# ==========================================

class TutorAlumno(models.Model):

    tutor = models.ForeignKey(
        Tutor,
        on_delete=models.CASCADE,
        related_name="alumnos"
    )

    alumno = models.ForeignKey(
        Alumno,
        on_delete=models.CASCADE,
        related_name="tutores"
    )

    parentesco = models.CharField(
        max_length=50
    )

    direccion = models.CharField(
        max_length=255
    )

    es_conviviente = models.BooleanField(
        default=True
    )

    class Meta:
        unique_together = (
            "tutor",
            "alumno"
        )

    def __str__(self):
        return f"{self.tutor} -> {self.alumno}"


# ==========================================
# ALUMNO - MATERIA
# ==========================================

class AlumnoMateria(models.Model):

    alumno = models.ForeignKey(
        Alumno,
        on_delete=models.CASCADE,
        related_name="materias"
    )

    materia_curso = models.ForeignKey(
        MateriaCurso,
        on_delete=models.CASCADE,
        related_name="alumnos"
    )

    ciclo_lectivo = models.ForeignKey(
        CicloLectivo,
        on_delete=models.CASCADE
    )

    estado_rite = models.CharField(
        max_length=50,
        default="Cursando"
    )

    class Meta:
        unique_together = (
            "alumno",
            "materia_curso",
            "ciclo_lectivo"
        )

    def __str__(self):
        return f"{self.alumno} - {self.materia_curso}"


# ==========================================
# NOTAS
# ==========================================

class Nota(models.Model):

    INSTANCIAS_RITE = [
        ('1CUAT_PRE', '1° Cuatrimestre - Preliminar'),
        ('1CUAT_CIE', '1° Cuatrimestre - Cierre'),
        ('2CUAT_PRE', '2° Cuatrimestre - Preliminar'),
        ('2CUAT_CIE', '2° Cuatrimestre - Cierre'),
        ('NOTA_FINAL', 'Nota Final'),
        ('INT_DIC', 'Intensificación Diciembre'),
        ('INT_FEB', 'Intensificación Febrero'),
    ]

    alumno_materia = models.ForeignKey(
        AlumnoMateria,
        on_delete=models.CASCADE,
        related_name="notas"
    )

    instancia = models.CharField(
        max_length=20,
        choices=INSTANCIAS_RITE
    )

    valor = models.CharField(
        max_length=10
    )

    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="notas_creadas"
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        unique_together = (
            "alumno_materia",
            "instancia"
        )

    def __str__(self):
        return (
            f"{self.alumno_materia.alumno} - "
            f"{self.instancia} - "
            f"{self.valor}"
        )