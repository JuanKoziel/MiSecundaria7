"""Tests de la Parte 6 del Plan Maestro: Administración, actas y eventos institucionales.

Cubren E4 (conducta/apercibimientos), E14 (usuario habilitado/deshabilitado),
E16 (evento institucional) y E19 (bloqueo/modificación de horario).
"""

from django.test import TestCase
from django.utils import timezone

from escuela.models import (
    Acta,
    ActaAlumno,
    BloqueoHorarioAlumno,
    EventoInstitucional,
    Notificacion,
    TipoActa,
    Usuario,
)
from escuela.views import (
    _notificar_acta_conducta,
    _notificar_bloqueo_horario,
    _notificar_evento_institucional,
    _notificar_usuario_estado,
)

from .factories import (
    crear_alumno,
    crear_curso,
    crear_curso_materia,
    crear_docente,
    crear_materia,
    crear_tipo_acta,
    crear_tutor,
    crear_usuario,
)


class Parte6ActaConductaTests(TestCase):
    """E4 — Conducta/apercibimientos."""

    def setUp(self):
        self.curso = crear_curso('1°1')
        self.alumno_user = crear_usuario('alum_p6a', roles=('alumno',))
        self.tutor_user = crear_usuario('tutor_p6a', roles=('familia',))
        self.tutor = crear_tutor(id_usuario=self.tutor_user)
        self.alumno = crear_alumno(
            id_usuario=self.alumno_user, id_tutor=self.tutor, id_curso=self.curso,
        )
        self.tipo_conducta = crear_tipo_acta('Apercibimiento')
        self.tipo_comunicacion = crear_tipo_acta('Comunicación')

    def test_acta_conducta_notifica_a_alumno_y_familia(self):
        """Al asociar un acta de tipo conducta, notifica a alumno y familia."""
        creador = crear_usuario('creador_acta', roles=('docente',))
        acta = Acta.objects.create(
            id_tipo_acta=self.tipo_conducta,
            id_usuario_creador=creador,
            titulo='Apercibimiento por comportamiento',
            descripcion='Incidente en el patio',
        )
        acta_alumno = ActaAlumno.objects.create(id_acta=acta, id_alumno=self.alumno)

        _notificar_acta_conducta(acta_alumno)

        self.assertTrue(Notificacion.objects.filter(id_usuario=self.alumno_user).exists())
        self.assertTrue(Notificacion.objects.filter(id_usuario=self.tutor_user).exists())
        n = Notificacion.objects.get(id_usuario=self.alumno_user)
        self.assertEqual(n.titulo, 'Acta de Apercibimiento')
        self.assertIn('comportamiento', n.mensaje)

    def test_acta_comunicacion_no_notifica(self):
        """Las actas de tipo comunicación no disparan notificación de conducta."""
        creador = crear_usuario('creador_acta2', roles=('docente',))
        acta = Acta.objects.create(
            id_tipo_acta=self.tipo_comunicacion,
            id_usuario_creador=creador,
            titulo='Comunicado general',
        )
        acta_alumno = ActaAlumno.objects.create(id_acta=acta, id_alumno=self.alumno)

        _notificar_acta_conducta(acta_alumno)
        self.assertEqual(Notificacion.objects.count(), 0)

    def test_sin_tipo_acta_no_notifica(self):
        """Si el acta no tiene tipo, no notifica."""
        from unittest.mock import MagicMock
        acta = MagicMock()
        acta.id_tipo_acta = None
        acta_alumno = MagicMock()
        acta_alumno.id_acta = acta
        acta_alumno.id_alumno = self.alumno

        _notificar_acta_conducta(acta_alumno)
        self.assertEqual(Notificacion.objects.count(), 0)


class Parte6UsuarioEstadoTests(TestCase):
    """E14 — Usuario habilitado/deshabilitado."""

    def setUp(self):
        self.usuario = Usuario.objects.create(
            usuario='user_p6e', contrasena='test1234', estado=True,
        )

    def test_habilitar_notifica(self):
        """Al habilitar un usuario deshabilitado, notifica."""
        self.usuario.estado = False
        self.usuario.save()
        self.usuario.estado = True
        _notificar_usuario_estado(self.usuario, estado_anterior=False)

        n = Notificacion.objects.get(id_usuario=self.usuario)
        self.assertEqual(n.titulo, 'Cuenta habilitada')
        self.assertIn('habilitada', n.mensaje)

    def test_deshabilitar_notifica(self):
        """Al deshabilitar un usuario habilitado, notifica."""
        self.usuario.estado = False
        self.usuario.save()
        self.usuario.estado = True
        _notificar_usuario_estado(self.usuario, estado_anterior=False)

        n = Notificacion.objects.get(id_usuario=self.usuario.id_usuario)
        self.assertEqual(n.titulo, 'Cuenta habilitada')
        self.assertIn('habilitada', n.mensaje)

    def test_sin_cambio_no_notifica(self):
        """Si el estado no cambia, no notifica."""
        _notificar_usuario_estado(self.usuario, estado_anterior=True)
        self.assertEqual(Notificacion.objects.count(), 0)

    def test_sin_usuario_no_falla(self):
        """Si el usuario no existe (None), no falla."""
        class FakeUser:
            estado = True
            id_usuario = None
        _notificar_usuario_estado(FakeUser(), estado_anterior=False)
        self.assertEqual(Notificacion.objects.count(), 0)


class Parte6EventoInstitucionalTests(TestCase):
    """E16 — Evento institucional."""

    def setUp(self):
        self.curso = crear_curso('1°1')
        self.alumno_user = crear_usuario('alum_p6ev', roles=('alumno',))
        self.tutor_user = crear_usuario('tutor_p6ev', roles=('familia',))
        self.tutor = crear_tutor(id_usuario=self.tutor_user)
        self.alumno = crear_alumno(
            id_usuario=self.alumno_user, id_tutor=self.tutor, id_curso=self.curso,
        )

    def test_evento_todo_dia_notifica_alumnos_y_familia(self):
        """Evento todo_dia notifica a alumnos del curso y sus familias."""
        evento = EventoInstitucional.objects.create(
            tipo_evento='Feriado',
            descripcion='Día de la Soberanía',
            fecha=timezone.now().date(),
            alcance='todo_dia',
            estado=True,
        )

        _notificar_evento_institucional(evento)

        self.assertTrue(Notificacion.objects.filter(id_usuario=self.alumno_user).exists())
        self.assertTrue(Notificacion.objects.filter(id_usuario=self.tutor_user).exists())
        n = Notificacion.objects.get(id_usuario=self.alumno_user)
        self.assertEqual(n.titulo, 'Evento: Feriado')
        self.assertIn('Soberanía', n.mensaje)

    def test_evita_duplicados(self):
        """Re-exponer el mismo evento no duplica notificaciones."""
        evento = EventoInstitucional.objects.create(
            tipo_evento='Jornada Institucional',
            descripcion='Jornada de reflexión',
            fecha=timezone.now().date(),
            alcance='todo_dia',
            estado=True,
        )
        _notificar_evento_institucional(evento)
        _notificar_evento_institucional(evento)
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.alumno_user, titulo='Evento: Jornada Institucional').count(), 1
        )


class Parte6BloqueoHorarioTests(TestCase):
    """E19 — Bloqueo/modificación de horario del estudiante."""

    def setUp(self):
        self.curso = crear_curso('1°1')
        self.curso2 = crear_curso('2°1')
        self.materia_bloq = crear_materia('Matemática')
        self.materia_prio = crear_materia('Física')
        self.docente = crear_docente()
        self.cm_bloq = crear_curso_materia(self.curso, self.materia_bloq, self.docente)
        self.cm_prio = crear_curso_materia(self.curso2, self.materia_prio, self.docente)

        self.alumno_user = crear_usuario('alum_p6b', roles=('alumno',))
        self.tutor_user = crear_usuario('tutor_p6b', roles=('familia',))
        self.tutor = crear_tutor(id_usuario=self.tutor_user)
        self.alumno = crear_alumno(
            id_usuario=self.alumno_user, id_tutor=self.tutor, id_curso=self.curso,
        )

    def test_bloqueo_creado_notifica(self):
        """Al crear un bloqueo activo, notifica a alumno y familia."""
        bloqueo = BloqueoHorarioAlumno.objects.create(
            id_alumno=self.alumno,
            id_materia_bloqueada=self.materia_bloq,
            id_curso_materia_bloqueada=self.cm_bloq,
            id_materia_prioritaria=self.materia_prio,
            id_curso_materia_prioritaria=self.cm_prio,
            id_materia_recursada=self.materia_prio,
            id_curso_materia_recursada=self.cm_prio,
            estado=True,
            fecha_bloqueo=timezone.now(),
        )

        _notificar_bloqueo_horario(bloqueo, accion='creado')

        self.assertTrue(Notificacion.objects.filter(id_usuario=self.alumno_user).exists())
        n = Notificacion.objects.get(id_usuario=self.alumno_user)
        self.assertEqual(n.titulo, 'Bloqueo de horario por superposición')
        self.assertIn('Matemática', n.mensaje)
        self.assertIn('Física', n.mensaje)

    def test_bloqueo_desactivado_notifica(self):
        """Al desactivar un bloqueo, notifica que se levantó."""
        bloqueo = BloqueoHorarioAlumno.objects.create(
            id_alumno=self.alumno,
            id_materia_bloqueada=self.materia_bloq,
            id_curso_materia_bloqueada=self.cm_bloq,
            id_materia_prioritaria=self.materia_prio,
            id_curso_materia_prioritaria=self.cm_prio,
            id_materia_recursada=self.materia_prio,
            id_curso_materia_recursada=self.cm_prio,
            estado=True,
            fecha_bloqueo=timezone.now(),
        )

        bloqueo.estado = False
        bloqueo.save(update_fields=['estado'])
        _notificar_bloqueo_horario(bloqueo, accion='desactivado')

        n = Notificacion.objects.get(id_usuario=self.alumno_user)
        self.assertEqual(n.titulo, 'Bloqueo de horario levantado')
        self.assertIn('levantado', n.mensaje)

    def test_creado_inactivo_no_notifica(self):
        """Si se crea inactivo (estado=False), no notifica como 'creado'."""
        bloqueo = BloqueoHorarioAlumno.objects.create(
            id_alumno=self.alumno,
            id_materia_bloqueada=self.materia_bloq,
            id_curso_materia_bloqueada=self.cm_bloq,
            id_materia_prioritaria=self.materia_prio,
            id_curso_materia_prioritaria=self.cm_prio,
            id_materia_recursada=self.materia_prio,
            id_curso_materia_recursada=self.cm_prio,
            estado=False,
            fecha_bloqueo=timezone.now(),
        )
        _notificar_bloqueo_horario(bloqueo, accion='creado')
        self.assertEqual(Notificacion.objects.count(), 0)