from django.conf import settings
from django.db import models


class Perfil(models.Model):
    ROLES = (
        ('admin', 'Administrador'),
        ('docente', 'Docente'),
        ('preceptor', 'Preceptor'),
        ('familia', 'Familia'),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='perfil')
    role = models.CharField(max_length=20, choices=ROLES)
    dni = models.CharField(max_length=20, blank=True)
    nombre = models.CharField(max_length=100, blank=True)
    apellido = models.CharField(max_length=100, blank=True)
    materia_principal = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f'{self.user.username} ({self.role})'


class Alumno(models.Model):
    dni = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    curso = models.CharField(max_length=10)

    class Meta:
        ordering = ['apellido', 'nombre']

    def __str__(self):
        return f'{self.apellido}, {self.nombre}'


class VinculoFamilia(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='hijos_vinculados')
    alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, related_name='familias')
    vinculo = models.CharField(max_length=50, default='Padre/Madre/Tutor')

    class Meta:
        unique_together = ('usuario', 'alumno')


class Calificacion(models.Model):
    alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, related_name='calificaciones')
    materia = models.CharField(max_length=100)
    prenota1 = models.CharField(max_length=3, blank=True)
    nota1 = models.PositiveSmallIntegerField(null=True, blank=True)
    prenota2 = models.CharField(max_length=3, blank=True)
    nota2 = models.PositiveSmallIntegerField(null=True, blank=True)
    diagnostico = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ('alumno', 'materia')


class AsistenciaDiaria(models.Model):
    ESTADOS = (
        ('Presente', 'Presente'),
        ('Ausente', 'Ausente'),
        ('Tarde', 'Tarde'),
    )
    alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, related_name='asistencias_diarias')
    fecha = models.DateField()
    estado = models.CharField(max_length=10, choices=ESTADOS, default='Presente')

    class Meta:
        unique_together = ('alumno', 'fecha')


class NotaPreceptor(models.Model):
    alumno = models.OneToOneField(Alumno, on_delete=models.CASCADE, related_name='nota_preceptor')
    nota = models.PositiveSmallIntegerField(null=True, blank=True)


class SesionClase(models.Model):
    curso = models.CharField(max_length=10)
    materia = models.CharField(max_length=100)
    fecha = models.DateField()
    libro_temas = models.CharField(max_length=500, blank=True)
    docente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sesiones_dictadas',
    )

    class Meta:
        unique_together = ('curso', 'materia', 'fecha')


class AsistenciaClase(models.Model):
    ESTADOS = (
        ('Presente', 'Presente'),
        ('Ausente', 'Ausente'),
        ('Tarde', 'Tarde'),
    )
    sesion = models.ForeignKey(SesionClase, on_delete=models.CASCADE, related_name='lineas')
    alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE)
    estado = models.CharField(max_length=10, choices=ESTADOS, default='Presente')

    class Meta:
        unique_together = ('sesion', 'alumno')


class ActaCurso(models.Model):
    curso = models.CharField(max_length=10)
    fecha = models.DateField()
    descripcion = models.CharField(max_length=500)

    class Meta:
        ordering = ['-fecha']


class ActaAlumno(models.Model):
    alumno = models.ForeignKey(Alumno, on_delete=models.CASCADE, related_name='actas')
    titulo = models.CharField(max_length=200)
    materia = models.CharField(max_length=100)
    fecha = models.DateField()
    cargado_por = models.CharField(max_length=150)
    archivo = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['-fecha']


class Comunicado(models.Model):
    curso = models.CharField(max_length=10)
    fecha = models.DateField()
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()

    class Meta:
        ordering = ['-fecha']
