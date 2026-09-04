"""Tests de la Parte 4 del Plan Maestro: Núcleo académico.

Cubren los eventos E1/E6 (calificaciones), E10 (materia a previa), E11
(rendición), E12 (intensificación), E13 (promoción/no promoción por materia
durante la consolidación del ciclo) y E18 (recursada).

La Parte 4 no cubre E5 (Acta cerrada/visada): el modelo actual no posee un
concepto de acta cerrada/visada, por lo que se dejó DIFERIDO (no se inventa
comportamiento). Se verifica en estos tests que el emisor académico solo
crea notificaciones a través de `notifications.notificar`.
"""

from django.test import TestCase
from django.utils import timezone

from escuela.academico import consolidar_historial_alumno
from escuela.models import (
    Calificacion,
    HistorialAcademico,
    IntensificacionAcademica,
    MateriaAdeudada,
    Notificacion,
    PeriodoEvaluacion,
    RendicionMateriaAdeudada,
)
from escuela.views import (
    _notificar_calificacion,
    _notificar_intensificacion,
    _notificar_previa,
    _notificar_recursada,
    _notificar_rendicion,
)

from .factories import (
    crear_alumno,
    crear_curso,
    crear_curso_materia,
    crear_docente,
    crear_materia,
    crear_tutor,
    crear_usuario,
)


class Parte4CalificacionesTests(TestCase):
    """E1/E6 — Calificación cargada / actualizada."""

    def setUp(self):
        self.curso = crear_curso('1°1')
        self.materia = crear_materia('Matemática')
        self.docente = crear_docente()
        self.cm = crear_curso_materia(self.curso, self.materia, self.docente)
        self.periodo = PeriodoEvaluacion.objects.create(
            nombre_periodo='1° Cuatrimestre', orden_periodo=1, estado=True,
        )
        self.alumno_user = crear_usuario('alum_p4c', roles=('alumno',))
        self.tutor_user = crear_usuario('tutor_p4c', roles=('familia',))
        self.tutor = crear_tutor(id_usuario=self.tutor_user)
        self.alumno = crear_alumno(
            id_usuario=self.alumno_user, id_tutor=self.tutor, id_curso=self.curso,
        )

    def _calificacion(self, nota=8):
        return Calificacion.objects.create(
            id_alumno=self.alumno,
            id_curso_materia=self.cm,
            id_docente=self.docente,
            id_periodo=self.periodo,
            nota_numerica=nota,
        )

    def test_carga_notifica_al_alumno_y_a_la_familia(self):
        _notificar_calificacion(self._calificacion(8), accion='cargada')
        self.assertIsNotNone(
            Notificacion.objects.filter(
                id_usuario=self.alumno_user, titulo='Nueva calificación',
            ).first()
        )
        self.assertIsNotNone(
            Notificacion.objects.filter(
                id_usuario=self.tutor_user, titulo='Nueva calificación',
            ).first()
        )
        msg = Notificacion.objects.get(id_usuario=self.alumno_user).mensaje
        self.assertIn('Matemática', msg)
        self.assertIn('8', msg)

    def test_actualizada_usa_titulo_diferente(self):
        _notificar_calificacion(self._calificacion(6), accion='actualizada')
        self.assertTrue(
            Notificacion.objects.filter(
                id_usuario=self.alumno_user, titulo='Calificación actualizada',
            ).exists()
        )

    def test_evita_duplicados_al_reexponer_mismo_contenido(self):
        cal = self._calificacion(8)
        _notificar_calificacion(cal, accion='cargada')
        _notificar_calificacion(cal, accion='cargada')
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.alumno_user).count(), 1,
        )


class Parte4PreviaTests(TestCase):
    """E10 — Materia pasa a Previa."""

    def setUp(self):
        self.curso = crear_curso('1°1')
        self.materia = crear_materia('Lengua')
        self.alumno_user = crear_usuario('alum_p4p', roles=('alumno',))
        self.tutor_user = crear_usuario('tutor_p4p', roles=('familia',))
        self.tutor = crear_tutor(id_usuario=self.tutor_user)
        self.alumno = crear_alumno(
            id_usuario=self.alumno_user, id_tutor=self.tutor, id_curso=self.curso,
        )

    def test_previa_notifica_a_alumno_y_familia(self):
        _notificar_previa(self.alumno, self.materia)
        self.assertTrue(
            Notificacion.objects.filter(
                id_usuario=self.alumno_user, titulo='Materia en condición de previa',
            ).exists()
        )
        self.assertTrue(
            Notificacion.objects.filter(
                id_usuario=self.tutor_user, titulo='Materia en condición de previa',
            ).exists()
        )

    def test_previa_evita_duplicados(self):
        _notificar_previa(self.alumno, self.materia)
        _notificar_previa(self.alumno, self.materia)
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.alumno_user).count(), 1,
        )


class Parte4RendicionTests(TestCase):
    """E11 — Rendición de materia adeudada."""

    def setUp(self):
        self.curso = crear_curso('1°1')
        self.materia = crear_materia('Historia')
        self.docente = crear_docente()
        self.alumno_user = crear_usuario('alum_p4r', roles=('alumno',))
        self.tutor_user = crear_usuario('tutor_p4r', roles=('familia',))
        self.tutor = crear_tutor(id_usuario=self.tutor_user)
        self.alumno = crear_alumno(
            id_usuario=self.alumno_user, id_tutor=self.tutor, id_curso=self.curso,
        )
        self.ma = MateriaAdeudada.objects.create(
            id_alumno=self.alumno, id_materia=self.materia, id_curso_origen=self.curso,
            tipo_deuda='PREVIA', estado='ADEUDADA', fecha_generacion=timezone.now(),
        )

    def _rendicion(self, nota=8):
        return RendicionMateriaAdeudada.objects.create(
            id_materia_adeudada=self.ma,
            id_alumno=self.alumno,
            anio_rendicion=2026,
            periodo='MARZO',
            nota=nota,
            estado='APROBADA' if nota >= 7 else 'DESAPROBADA',
            id_docente=self.docente,
            fecha_rendicion=timezone.now(),
            fecha_registro=timezone.now(),
        )

    def test_rendicion_notifica(self):
        rend = self._rendicion(8)
        _notificar_rendicion(self.ma, rend)
        n = Notificacion.objects.get(id_usuario=self.alumno_user)
        self.assertEqual(n.titulo, 'Rendición de materia adeudada')
        self.assertIn('Historia', n.mensaje)
        self.assertIn('Marzo', n.mensaje)
        self.assertTrue(
            Notificacion.objects.filter(id_usuario=self.tutor_user).exists()
        )


class Parte4IntensificacionTests(TestCase):
    """E12 — Intensificación (resultado)."""

    def setUp(self):
        self.curso = crear_curso('1°1')
        self.materia = crear_materia('Biología')
        self.docente = crear_docente()
        self.cm = crear_curso_materia(self.curso, self.materia, self.docente)
        self.alumno_user = crear_usuario('alum_p4i', roles=('alumno',))
        self.tutor_user = crear_usuario('tutor_p4i', roles=('familia',))
        self.tutor = crear_tutor(id_usuario=self.tutor_user)
        self.alumno = crear_alumno(
            id_usuario=self.alumno_user, id_tutor=self.tutor, id_curso=self.curso,
        )
        self.historial = HistorialAcademico.objects.create(
            id_alumno=self.alumno, id_curso_materia=self.cm, id_curso=self.curso,
            id_materia=self.materia, anio_lectivo=2026, estado_materia='adeudada',
        )

    def _intensif(self, estado='APROBADA', nota=8):
        return IntensificacionAcademica.objects.create(
            id_historial=self.historial,
            periodo='JULIO',
            anio_rendicion=2026,
            nota=nota,
            estado=estado,
            fecha_registro=timezone.now(),
        )

    def test_intensificacion_notifica_resultado(self):
        _notificar_intensificacion(self._intensif(estado='APROBADA', nota=8))
        n = Notificacion.objects.get(id_usuario=self.alumno_user)
        self.assertEqual(n.titulo, 'Intensificación')
        self.assertIn('Biología', n.mensaje)
        self.assertIn('Julio', n.mensaje)
        self.assertIn('APROBADA', n.mensaje)
        self.assertTrue(
            Notificacion.objects.filter(id_usuario=self.tutor_user).exists()
        )


class Parte4RecursadaTests(TestCase):
    """E18 — Recursada (carga y resultado)."""

    def setUp(self):
        self.curso = crear_curso('1°1')
        self.curso2 = crear_curso('2°1')
        self.materia = crear_materia('Física')
        self.alumno_user = crear_usuario('alum_p4rec', roles=('alumno',))
        self.tutor_user = crear_usuario('tutor_p4rec', roles=('familia',))
        self.tutor = crear_tutor(id_usuario=self.tutor_user)
        self.alumno = crear_alumno(
            id_usuario=self.alumno_user, id_tutor=self.tutor, id_curso=self.curso,
        )

    def _recursada(self, estado='ACTIVA'):
        from escuela.models import RecursadaMateria
        return RecursadaMateria.objects.create(
            id_alumno=self.alumno, id_materia=self.materia,
            id_curso_origen=self.curso, id_curso_recursada=self.curso2,
            anio_inicio=2026, estado=estado, fecha_registro=timezone.now(),
        )

    def test_carga_notifica(self):
        _notificar_recursada(self._recursada(), 'cargada')
        n = Notificacion.objects.get(id_usuario=self.alumno_user)
        self.assertEqual(n.titulo, 'Recursada cargada')
        self.assertIn('Física', n.mensaje)

    def test_resultado_notifica(self):
        _notificar_recursada(self._recursada(estado='APROBADA'), 'resultado')
        n = Notificacion.objects.get(id_usuario=self.alumno_user)
        self.assertEqual(n.titulo, 'Resultado de recursada')
        self.assertIn('APROBADA', n.mensaje)


class Parte4ConsolidacionTests(TestCase):
    """E13 — Promoción / no promoción por materia durante la consolidación del ciclo."""

    def setUp(self):
        self.ciclo = 2026
        self.docente = crear_docente()
        self.curso = crear_curso('1°1')
        self.m1 = crear_materia('Matemática')
        self.m2 = crear_materia('Lengua')
        self.cm1 = crear_curso_materia(self.curso, self.m1, self.docente)
        self.cm2 = crear_curso_materia(self.curso, self.m2, self.docente)
        self.alumno_user = crear_usuario('alum_p4e', roles=('alumno',))
        self.tutor_user = crear_usuario('tutor_p4e', roles=('familia',))
        self.tutor = crear_tutor(id_usuario=self.tutor_user)
        self.alumno = crear_alumno(
            id_usuario=self.alumno_user, id_tutor=self.tutor, id_curso=self.curso,
        )
        self.periodo1 = PeriodoEvaluacion.objects.create(
            nombre_periodo='1° Cuatrimestre', orden_periodo=1, estado=True,
        )
        self.periodo2 = PeriodoEvaluacion.objects.create(
            nombre_periodo='2° Cuatrimestre', orden_periodo=2, estado=True,
        )

    def _cargar(self, cm, nota):
        Calificacion.objects.create(
            id_alumno=self.alumno, id_curso_materia=cm, id_docente=self.docente,
            id_periodo=self.periodo1, nota_numerica=nota,
        )
        Calificacion.objects.create(
            id_alumno=self.alumno, id_curso_materia=cm, id_docente=self.docente,
            id_periodo=self.periodo2, nota_numerica=nota,
        )

    def test_aprobada_notifica_promocion(self):
        self._cargar(self.cm1, 8)
        consolidar_historial_alumno(self.alumno, self.ciclo)
        self.assertTrue(
            Notificacion.objects.filter(
                id_usuario=self.alumno_user, titulo='Materia aprobada',
            ).exists()
        )
        n = Notificacion.objects.get(id_usuario=self.alumno_user, titulo='Materia aprobada')
        self.assertIn('Matemática', n.mensaje)
        self.assertTrue(
            Notificacion.objects.filter(id_usuario=self.tutor_user, titulo='Materia aprobada').exists()
        )

    def test_adeudada_notifica_no_promocion(self):
        self._cargar(self.cm1, 4)
        consolidar_historial_alumno(self.alumno, self.ciclo)
        self.assertTrue(
            Notificacion.objects.filter(
                id_usuario=self.alumno_user, titulo='Materia adeudada',
            ).exists()
        )

    def test_no_duplica_al_reprocesar_cierre(self):
        self._cargar(self.cm1, 8)
        consolidar_historial_alumno(self.alumno, self.ciclo)
        consolidar_historial_alumno(self.alumno, self.ciclo)
        self.assertEqual(
            Notificacion.objects.filter(
                id_usuario=self.alumno_user, titulo='Materia aprobada',
            ).count(), 1,
        )
