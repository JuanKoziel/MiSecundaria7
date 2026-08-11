"""Factories reutilizables para los tests de `escuela`.

Crean datos solo en la base de testing (nunca tocan la base real).
"""

from datetime import time

from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User as DjangoUser
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from escuela.models import (
    Acta,
    ActaAlumno,
    ActaCurso,
    ActaDocente,
    AdelantoHoras,
    Alumno,
    CicloLectivo,
    Curso,
    CursoMateria,
    Docente,
    EstadoAsistencia,
    Horario,
    HorariosEspeciales,
    Materia,
    Modulos,
    PadreTutor,
    Preceptor,
    Rol,
    SuplenciaDocente,
    TipoActa,
    Usuario,
    UsuarioRol,
)

_COUNTER = {'n': 0}


def _dni():
    _COUNTER['n'] += 1
    return f'{_COUNTER["n"]:08d}'


def crear_rol(nombre):
    rol, _ = Rol.objects.get_or_create(nombre_rol=nombre)
    return rol


def crear_usuario(username=None, contrasena='test1234', roles=('docente',), estado=True):
    """Crea un `Usuario` del sistema con sus roles en `usuario_roles`."""
    username = username or f'user{_COUNTER["n"]}'
    u = Usuario.objects.create(
        usuario=username,
        contrasena=make_password(contrasena),
        estado=estado,
    )
    for nombre in roles:
        UsuarioRol.objects.create(id_usuario=u, id_rol=crear_rol(nombre))
    return u


def token_para(username):
    """Devuelve un access token JWT para un username del sistema.

    El backend de auth (`UsuarioBackend`) traduce el usuario del sistema a
    un `django.contrib.auth.User`, que es el que el token simplejwt usa.
    """
    django_user, _ = DjangoUser.objects.get_or_create(username=username)
    return str(RefreshToken.for_user(django_user).access_token)


def cliente_para(username):
    """APIClient autenticado con JWT para un username.

    Los POST/PATCH se envían en JSON (como el frontend real); si se
    usara multipart, DRF interpreta los booleanos ausentes como False
    y el comportamiento no coincide con el de la app real.
    """
    client = JsonAPIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_para(username)}')
    return client


class JsonAPIClient(APIClient):
    """APIClient que usa JSON por defecto para escrituras."""

    def post(self, path, data=None, format='json', **kwargs):
        return super().post(path, data=data, format=format, **kwargs)

    def patch(self, path, data=None, format='json', **kwargs):
        return super().patch(path, data=data, format=format, **kwargs)

    def put(self, path, data=None, format='json', **kwargs):
        return super().put(path, data=data, format=format, **kwargs)


def crear_ciclo(anio=2026):
    return CicloLectivo.objects.create(anio=anio)


def crear_preceptor(nombre='Juan', apellido='Preceptor', id_usuario=None):
    return Preceptor.objects.create(
        nombre=nombre, apellido=apellido, dni=_dni(), id_usuario=id_usuario,
    )


def crear_curso(nombre='1°A', id_preceptor=None, id_ciclo=None):
    return Curso.objects.create(
        nombre_curso=nombre,
        id_preceptor=id_preceptor,
        id_ciclo=id_ciclo or crear_ciclo(),
    )


def crear_materia(nombre='Matemática'):
    return Materia.objects.create(nombre_materia=nombre)


def crear_docente(nombre='Ana', apellido='Docente', id_usuario=None):
    return Docente.objects.create(
        nombre=nombre, apellido=apellido, dni=_dni(), id_usuario=id_usuario,
    )


def crear_tutor(nombre='Rosa', apellido='Tutor', id_usuario=None):
    return PadreTutor.objects.create(
        nombre=nombre, apellido=apellido, dni=_dni(), id_usuario=id_usuario,
    )


def crear_alumno(nombre='Lucas', apellido='Alumno', id_usuario=None, id_tutor=None, id_curso=None):
    return Alumno.objects.create(
        nombre=nombre, apellido=apellido, dni=_dni(),
        id_usuario=id_usuario, id_tutor=id_tutor, id_curso=id_curso,
    )


def crear_curso_materia(id_curso, id_materia, id_docente):
    return CursoMateria.objects.create(
        id_curso=id_curso, id_materia=id_materia, id_docente=id_docente,
    )


def crear_modulo(hora_inicio=time(8, 0), hora_fin=time(9, 0), nombre='M1'):
    return Modulos.objects.create(
        nombre=nombre, hora_inicio=hora_inicio, hora_fin=hora_fin,
    )


def crear_horario(id_curso_materia, dia='Lunes', id_modulo=None, aula='Aula 1'):
    return Horario.objects.create(
        id_curso_materia=id_curso_materia,
        dia_semana=dia,
        id_modulo=id_modulo,
        aula=aula,
    )


def crear_horario_especial(id_curso_materia, dia='Miércoles', hora_inicio=time(9, 0), hora_fin=time(10, 0)):
    return HorariosEspeciales.objects.create(
        id_curso_materia=id_curso_materia,
        dia_semana=dia,
        hora_inicio=hora_inicio,
        hora_fin=hora_fin,
    )


def crear_tipo_acta(nombre='Comunicación'):
    return TipoActa.objects.create(nombre_tipo=nombre)


def crear_acta(usuario_creador, tipo=None, titulo='Acta de prueba', descripcion='Descripción'):
    return Acta.objects.create(
        id_usuario_creador=usuario_creador,
        id_tipo_acta=tipo or crear_tipo_acta(),
        titulo=titulo,
        descripcion=descripcion,
    )


def crear_estado_asistencia(nombre='Presente'):
    ea, _ = EstadoAsistencia.objects.get_or_create(nombre_estado=nombre)
    return ea


def crear_suplencia(id_curso_materia, id_docente_suplente, fecha_inicio, fecha_fin, nivel=1, estado=True):
    return SuplenciaDocente.objects.create(
        id_curso_materia=id_curso_materia,
        id_docente_suplente=id_docente_suplente,
        nivel=nivel,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        estado=estado,
    )


def crear_adelanto(id_curso, id_materia, id_docente, fecha, hora_inicio, hora_fin,
                   id_usuario_autorizador, mantener_horario_original=False, estado=True):
    return AdelantoHoras.objects.create(
        id_curso=id_curso,
        id_materia=id_materia,
        id_docente=id_docente,
        fecha_adelanto=fecha,
        hora_inicio=hora_inicio,
        hora_fin=hora_fin,
        id_usuario_autorizador=id_usuario_autorizador,
        mantener_horario_original=mantener_horario_original,
        estado=estado,
    )
