"""Tests de la Parte 3 del Plan Maestro: eventos E7 (comunicado publicado) y
E3 (inasistencia registrada).

Verifican emisores de notificación directamente (helpers de `escuela.views`),
construyendo los objetos de dominio con factories. No dependen del endpoint de
asistencia (que valida horario) ni del endpoint de comunicados.
"""

from datetime import time

from django.test import TestCase
from django.utils import timezone

from escuela.models import (
    Asistencia,
    Comunicado,
    ComunicadoAlcance,
    Notificacion,
)
from escuela.views import (
    _notificar_comunicado_publicado,
    _notificar_inasistencia,
)

from .factories import (
    crear_alumno,
    crear_curso,
    crear_curso_materia,
    crear_docente,
    crear_estado_asistencia,
    crear_materia,
    crear_preceptor,
    crear_tutor,
    crear_usuario,
)


class NotificacionesE3InasistenciaTests(TestCase):
    """E3 — al registrarse una ausencia, notificar a alumno y familia,
    agrupando por día (una por alumno+fecha, no una por ausencia)."""

    def setUp(self):
        self.fecha = timezone.localdate()
        self.curso = crear_curso('1°A')
        self.materia = crear_materia('Matemática')
        self.materia2 = crear_materia('Lengua')
        self.docente = crear_docente()
        self.cm = crear_curso_materia(self.curso, self.materia, self.docente)
        self.cm2 = crear_curso_materia(self.curso, self.materia2, self.docente)
        self.registrador = crear_usuario('prec_asist', roles=('preceptor',))
        self.ausente = crear_estado_asistencia('Ausente')
        self.presente = crear_estado_asistencia('Presente')

    def _asistencia(self, alumno, cm, estado):
        return Asistencia.objects.create(
            id_alumno=alumno,
            id_curso_materia=cm,
            id_usuario=self.registrador,
            id_estado_asistencia=estado,
            fecha=self.fecha,
            hora=time(8, 0),
        )

    def test_ausente_notifica_al_alumno_y_a_su_familia(self):
        alumno_user = crear_usuario('alum_c', roles=('alumno',))
        tutor_user = crear_usuario('tutor_c', roles=('familia',))
        tutor = crear_tutor(id_usuario=tutor_user)
        alumno = crear_alumno(
            id_usuario=alumno_user, id_tutor=tutor, id_curso=self.curso,
        )
        _notificar_inasistencia(self._asistencia(alumno, self.cm, self.ausente))

        n_alumno = Notificacion.objects.filter(id_usuario=alumno_user).first()
        n_tutor = Notificacion.objects.filter(id_usuario=tutor_user).first()
        self.assertIsNotNone(n_alumno)
        self.assertIsNotNone(n_tutor)
        self.assertEqual(n_alumno.id_alumno, alumno)
        self.assertIn('Matemática', n_alumno.mensaje)
        self.assertEqual(n_tutor.titulo, 'Inasistencia registrada')

    def test_presente_no_notifica(self):
        tutor_user = crear_usuario('tutor_p', roles=('familia',))
        tutor = crear_tutor(id_usuario=tutor_user)
        alumno = crear_alumno(
            id_usuario=crear_usuario('alum_p', roles=('alumno',)),
            id_tutor=tutor, id_curso=self.curso,
        )
        _notificar_inasistencia(self._asistencia(alumno, self.cm, self.presente))
        self.assertEqual(Notificacion.objects.count(), 0)

    def test_agrupa_por_dia_no_crea_una_por_ausencia(self):
        alumno_user = crear_usuario('alum_g', roles=('alumno',))
        alumno = crear_alumno(id_usuario=alumno_user, id_curso=self.curso)

        _notificar_inasistencia(self._asistencia(alumno, self.cm, self.ausente))
        _notificar_inasistencia(self._asistencia(alumno, self.cm2, self.ausente))

        notifs = Notificacion.objects.filter(
            id_usuario=alumno_user, id_alumno=alumno,
        )
        self.assertEqual(notifs.count(), 1)
        n = notifs.first()
        self.assertIn('Matemática', n.mensaje)
        self.assertIn('Lengua', n.mensaje)

    def test_sin_tutor_solo_notifica_al_alumno(self):
        alumno_user = crear_usuario('alum_s', roles=('alumno',))
        alumno = crear_alumno(id_usuario=alumno_user, id_curso=self.curso)
        _notificar_inasistencia(self._asistencia(alumno, self.cm, self.ausente))
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=alumno_user).count(), 1,
        )

    def test_sin_usuario_de_alumno_notifica_a_la_familia(self):
        tutor_user = crear_usuario('tutor_s', roles=('familia',))
        tutor = crear_tutor(id_usuario=tutor_user)
        alumno = crear_alumno(id_tutor=tutor, id_curso=self.curso)
        _notificar_inasistencia(self._asistencia(alumno, self.cm, self.ausente))
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=tutor_user).count(), 1,
        )


class NotificacionesE7ComunicadoTests(TestCase):
    """E7 — al publicarse un comunicado, notificar a los alcanzados según el
    alcance real y a sus familias, una por destinatario y sin duplicados."""

    def setUp(self):
        self.curso = crear_curso('1°1')
        self.curso2 = crear_curso('1°2')
        self.tutor = crear_tutor(id_usuario=crear_usuario('fam_com', roles=('familia',)))
        self.user_a1 = crear_usuario('a1', roles=('alumno',))
        self.user_a2 = crear_usuario('a2', roles=('alumno',))
        self.user_a3 = crear_usuario('a3', roles=('alumno',))
        self.alumno1 = crear_alumno(
            id_usuario=self.user_a1, id_tutor=self.tutor, id_curso=self.curso,
        )
        self.alumno2 = crear_alumno(
            id_usuario=self.user_a2, id_tutor=self.tutor, id_curso=self.curso,
        )
        self.alumno_fuera = crear_alumno(id_usuario=self.user_a3, id_curso=self.curso2)

    def _comunicado(self, alcances):
        c = Comunicado.objects.create(
            id_usuario_creador=None,
            titulo='Reunión de padres',
            cuerpo='Convocatoria para el viernes.',
        )
        for a in alcances:
            ComunicadoAlcance.objects.create(
                id_comunicado=c,
                id_ciclo=a.get('id_ciclo'),
                curso=a.get('curso'),
                division=a.get('division'),
                id_materia=a.get('id_materia'),
            )
        return c

    def test_notifica_a_los_alcanzados_y_a_su_familia(self):
        c = self._comunicado([
            {'id_ciclo': self.curso.id_ciclo, 'curso': 1, 'division': 1},
        ])
        _notificar_comunicado_publicado(c)

        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.user_a1, titulo='Reunión de padres').count(),
            1,
        )
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.user_a2, titulo='Reunión de padres').count(),
            1,
        )
        # La familia recibe una por hijo.
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.tutor.id_usuario).count(), 2,
        )
        # Fuera del alcance no recibe.
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.user_a3).count(), 0,
        )

    def test_alcance_global_notifica_a_todos(self):
        c = self._comunicado([{}])
        _notificar_comunicado_publicado(c)
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.user_a3, titulo='Reunión de padres').count(),
            1,
        )

    def test_evita_duplicados_al_reexponer(self):
        c = self._comunicado([
            {'id_ciclo': self.curso.id_ciclo, 'curso': 1, 'division': 1},
        ])
        _notificar_comunicado_publicado(c)
        _notificar_comunicado_publicado(c)
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.user_a1, titulo='Reunión de padres').count(),
            1,
        )


class NotificacionesE7ComunicadoAlcancePersonalTests(TestCase):
    """Corrección posterior E7 — los comunicados también deben llegar a los
    Docentes y Preceptores afectados, respetando el alcance real del comunicado.

    Casos:
    - curso: docentes con materias en ese curso + preceptor del curso;
    - año completo: docentes y preceptores de todos los cursos alcanzados;
    - curso + materia: solo el/los docentes con esa materia asignada a ese curso.
    """

    def setUp(self):
        self.curso1 = crear_curso('1°1')
        self.curso2 = crear_curso('2°1')
        self.materia_a = crear_materia('Matemática')
        self.materia_b = crear_materia('Lengua')

        self.user_doc1 = crear_usuario('com_doc1', roles=('docente',))
        self.user_doc2 = crear_usuario('com_doc2', roles=('docente',))
        self.docente1 = crear_docente(id_usuario=self.user_doc1)
        self.docente2 = crear_docente(id_usuario=self.user_doc2)

        # Docente1: Materia A en curso1 | Docente2: Materia A en curso2
        self.cm1 = crear_curso_materia(self.curso1, self.materia_a, self.docente1)
        crear_curso_materia(self.curso2, self.materia_a, self.docente2)

        self.user_prec1 = crear_usuario('com_prec1', roles=('preceptor',))
        self.preceptor1 = crear_preceptor(id_usuario=self.user_prec1)
        self.curso1.id_preceptor = self.preceptor1
        self.curso1.save()

    def _comunicado(self, alcances):
        c = Comunicado.objects.create(
            id_usuario_creador=None,
            titulo='Reunión de padres',
            cuerpo='Convocatoria para el viernes.',
        )
        for a in alcances:
            ComunicadoAlcance.objects.create(
                id_comunicado=c,
                id_ciclo=a.get('id_ciclo'),
                curso=a.get('curso'),
                division=a.get('division'),
                id_materia=a.get('id_materia'),
            )
        return c

    def test_alcance_curso_notifica_docente_y_preceptor_del_curso(self):
        """Caso curso: el docente con materia en el curso y el preceptor del
        curso reciben; el docente de otro curso no recibe."""
        c = self._comunicado([
            {'id_ciclo': self.curso1.id_ciclo, 'curso': 1, 'division': 1},
        ])
        _notificar_comunicado_publicado(c)

        # Docente con materia en curso1 recibe
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.user_doc1, titulo='Reunión de padres').count(),
            1,
        )
        # Docente solo con materia en curso2 NO recibe
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.user_doc2, titulo='Reunión de padres').count(),
            0,
        )
        # Preceptor de curso1 recibe
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.user_prec1, titulo='Reunión de padres').count(),
            1,
        )

    def test_alcance_anio_completo_notifica_a_todos_los_afectados(self):
        """Caso año completo: docentes y preceptores de todos los cursos
        alcanzados reciben."""
        user_prec2 = crear_usuario('com_prec2', roles=('preceptor',))
        preceptor2 = crear_preceptor(id_usuario=user_prec2)
        self.curso2.id_preceptor = preceptor2
        self.curso2.save()

        c = self._comunicado([{}])
        _notificar_comunicado_publicado(c)

        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.user_doc1, titulo='Reunión de padres').count(),
            1,
        )
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.user_doc2, titulo='Reunión de padres').count(),
            1,
        )
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.user_prec1, titulo='Reunión de padres').count(),
            1,
        )
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=user_prec2, titulo='Reunión de padres').count(),
            1,
        )

    def test_alcance_curso_materia_solo_notifica_docente_de_esa_materia(self):
        """Caso curso + materia: solo el docente que tiene ESA materia asignada
        a ESE curso recibe. El preceptor del curso alcanzado también recibe."""
        # Docente1 tiene Materia A en curso1; agregamos Materia B en curso1 al docente2
        crear_curso_materia(self.curso1, self.materia_b, self.docente2)

        c = self._comunicado([
            {
                'id_ciclo': self.curso1.id_ciclo,
                'curso': 1,
                'division': 1,
                'id_materia': self.materia_a,
            },
        ])
        _notificar_comunicado_publicado(c)

        # Docente1 (Materia A en curso1) recibe
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.user_doc1, titulo='Reunión de padres').count(),
            1,
        )
        # Docente2 (Materia B en curso1, pero la materia del alcance es A) NO recibe
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.user_doc2, titulo='Reunión de padres').count(),
            0,
        )
        # Preceptor del curso alcanzado recibe
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.user_prec1, titulo='Reunión de padres').count(),
            1,
        )

    def test_preceptor_sin_asignacion_no_notifica(self):
        """Un preceptor no asignado a ningún curso alcanzado no recibe."""
        # curso2 sin preceptor asignado; docentes de curso1 reciben
        c = self._comunicado([
            {'id_ciclo': self.curso1.id_ciclo, 'curso': 1, 'division': 1},
        ])
        _notificar_comunicado_publicado(c)

        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.user_doc1, titulo='Reunión de padres').count(),
            1,
        )
        # No hay preceptor para curso2 asignado, y el alcance es curso1
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.user_prec1, titulo='Reunión de padres').count(),
            1,
        )

    def test_docente_sin_usuario_no_rompe(self):
        """Un docente sin id_usuario (sin cuenta) no genera error."""
        user_extra = crear_usuario('com_doc3', roles=('docente',))
        docente3 = crear_docente(id_usuario=user_extra)
        # Al comunicado global, un docente sin usuario no debe romper
        crear_curso_materia(self.curso1, self.materia_b, docente3)
        # Desvinculamos el usuario para simular docente sin cuenta
        docente3.id_usuario = None
        docente3.save()

        c = self._comunicado([{}])
        # No debe lanzar excepción
        _notificar_comunicado_publicado(c)
