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
    crear_preceptor,
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
    """E16 — Evento institucional.

    Correcciones posteriores: el evento no se limita a estudiantes/familias,
    alcanza a todas las personas afectadas (Docentes, Preceptores, Jefe de
    Preceptores, Directivos, Admin) y el mensaje muestra la fecha del evento.
    """

    def setUp(self):
        self.curso = crear_curso('1°1')
        self.alumno_user = crear_usuario('alum_p6ev', roles=('alumno',))
        self.tutor_user = crear_usuario('tutor_p6ev', roles=('familia',))
        self.tutor = crear_tutor(id_usuario=self.tutor_user)
        self.alumno = crear_alumno(
            id_usuario=self.alumno_user, id_tutor=self.tutor, id_curso=self.curso,
        )

        # Docentes
        self.doc_user = crear_usuario('doc_p6ev', roles=('docente',))
        self.docente = crear_docente(id_usuario=self.doc_user)

        # Preceptores / Jefe de Preceptores
        self.prec_user = crear_usuario('prec_p6ev', roles=('preceptor',))
        self.preceptor = crear_preceptor(id_usuario=self.prec_user)

        # Directivos / Admin
        self.admin_user = crear_usuario('admin_p6ev', roles=('admin',))
        self.director_user = crear_usuario('dir_p6ev', roles=('director',))

    def _evento(self, tipo='Feriado', descripcion='Día de la Soberanía', fecha=None):
        return EventoInstitucional.objects.create(
            tipo_evento=tipo,
            descripcion=descripcion,
            fecha=fecha or timezone.now().date(),
            alcance='todo_dia',
            estado=True,
        )

    def test_evento_todo_dia_notifica_alumnos_y_familia(self):
        """Evento todo_dia notifica a alumnos del curso y sus familias."""
        evento = self._evento()
        _notificar_evento_institucional(evento)

        self.assertTrue(Notificacion.objects.filter(id_usuario=self.alumno_user).exists())
        self.assertTrue(Notificacion.objects.filter(id_usuario=self.tutor_user).exists())
        n = Notificacion.objects.get(id_usuario=self.alumno_user)
        self.assertEqual(n.titulo, 'Feriado')
        self.assertIn('Soberanía', n.mensaje)
        # La fecha del evento aparece en el mensaje
        self.assertIn(evento.fecha.strftime('%d/%m/%Y'), n.mensaje)

    def test_evento_notifica_a_docentes_preceptores_y_directivos(self):
        """Corrección posterior — el evento también llega a Docentes,
        Preceptores, Directivos y Admin."""
        evento = self._evento(tipo='Suspension', descripcion='por falta de luz')
        _notificar_evento_institucional(evento)

        # Docente
        n = Notificacion.objects.get(id_usuario=self.doc_user)
        self.assertEqual(n.titulo, 'Suspensión de clases')
        self.assertIn('por falta de luz', n.mensaje)

        # Preceptor
        self.assertTrue(Notificacion.objects.filter(id_usuario=self.prec_user).exists())

        # Directivo / Admin
        self.assertTrue(Notificacion.objects.filter(id_usuario=self.director_user).exists())
        self.assertTrue(Notificacion.objects.filter(id_usuario=self.admin_user).exists())

    def test_mensaje_muestra_fecha_del_evento(self):
        """El mensaje informa la fecha en que ocurre el evento, no la de
        creación. No debe verse el patrón 'Evento: ...' ni una fecha/hora de
        creación."""
        fecha_evento = timezone.localdate()
        evento = self._evento(tipo='Suspension', descripcion='por falta de luz', fecha=fecha_evento)
        _notificar_evento_institucional(evento)

        n = Notificacion.objects.get(id_usuario=self.alumno_user)
        self.assertNotIn('Evento:', n.titulo)
        self.assertIn(fecha_evento.strftime('%d/%m/%Y'), n.mensaje)
        self.assertIn('Se suspenden las clases', n.mensaje)
        self.assertIn('por falta de luz', n.mensaje)

    def test_evita_duplicados(self):
        """Re-exponer el mismo evento no duplica notificaciones."""
        evento = self._evento(tipo='Jornada Institucional', descripcion='Jornada de reflexión')
        _notificar_evento_institucional(evento)
        _notificar_evento_institucional(evento)
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.alumno_user, titulo='Jornada Institucional').count(), 1
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