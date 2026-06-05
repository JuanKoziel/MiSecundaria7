from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.conf import settings


class Usuario(AbstractUser):

    ROLES = (
        ("ALUMNO", "Alumno"),
        ("DOCENTE", "Docente"),
        ("PRECEPTOR", "Preceptor"),
        ("DIRECTIVO", "Directivo"),
        ("TUTOR", "Tutor"),
        ("ADMIN", "Administrador"),
    )

    rol = models.CharField(
        max_length=20,
        choices=ROLES
    )

    dni = models.CharField(
        max_length=8,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^\d{7,8}$',
                message="DNI inválido"
            )
        ]
    )

    REQUIRED_FIELDS = ["email", "dni", "rol"]

    def __str__(self):
        return self.username

class Persona(models.Model):

    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name="persona"
    )

    nombre = models.CharField(max_length=150)
    apellido = models.CharField(max_length=150)

    fecha_nacimiento = models.DateField()

    class Meta:
        ordering = ["apellido", "nombre"]

    def __str__(self):
        return f"{self.apellido}, {self.nombre}"

class Alumno(models.Model):

    persona = models.OneToOneField(
        Persona,
        on_delete=models.CASCADE
    )

    legajo = models.CharField(
        max_length=50,
        unique=True
    )

    procedencia = models.CharField(
        max_length=200,
        blank=True,
        null=True
    )

    fecha_ingreso = models.DateField()

    def __str__(self):
        return str(self.persona)


class Tutor(models.Model):

    persona = models.OneToOneField(
        Persona,
        on_delete=models.CASCADE
    )

    ocupacion = models.CharField(
        max_length=150,
        blank=True,
        null=True
    )

    def __str__(self):
        return str(self.persona)

class Docente(models.Model):

    persona = models.OneToOneField(
        Persona,
        on_delete=models.CASCADE
    )

    cuil = models.CharField(
        max_length=11,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^\d{11}$',
                message="CUIL inválido"
            )
        ]
    )

    def __str__(self):
        return str(self.persona)

class Empleado(models.Model):

    CARGOS = (
        ("PRECEPTOR", "Preceptor"),
        ("DIRECTOR", "Director"),
        ("VICE", "Vicedirector"),
        ("SECRETARIO", "Secretario"),
    )

    persona = models.OneToOneField(
        Persona,
        on_delete=models.CASCADE
    )

    cargo = models.CharField(
        max_length=30,
        choices=CARGOS
    )

    def __str__(self):
        return f"{self.persona} - {self.cargo}"

