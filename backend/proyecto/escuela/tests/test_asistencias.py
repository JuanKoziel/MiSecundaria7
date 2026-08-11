from datetime import date, datetime, time
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone

from escuela.models import Asistencia

from .factories import (
    cliente_para,
    crear_alumno,
    crear_curso,
    crear_curso_materia,
    crear_docente,
    crear_estado_asistencia,
    crear_horario,
    crear_materia,
    crear_modulo,
    crear_suplencia,
    crear_usuario,
)

LUNES_0830 = timezone.make_aware(datetime(2026, 3, 2, 8, 30))
LUNES_0700 = timezone.make_aware(datetime(2026, 3, 2, 7, 0))
MARTES_0830 = timezone.make_aware(datetime(2026, 3, 3, 8, 30))


class AsistenciaCreateTests(TestCase):

    def setUp(self):
        self.curso = crear_curso('1°A')
        self.materia = crear_materia('Matemática')
        self.docente_titular = crear_docente('Ana', 'Titular')
        self.docente_titular_usuario = crear_usuario('docente_titular', roles=('docente',))
        self.docente_titular.id_usuario = self.docente_titular_usuario
        self.docente_titular.save()
        self.cm = crear_curso_materia(self.curso, self.materia, self.docente_titular)
        self.modulo = crear_modulo(time(8, 0), time(9, 0), 'M1')
        self.horario = crear_horario(self.cm, 'Lunes', self.modulo)
        self.alumno = crear_alumno(id_curso=self.curso)
        self.estado = crear_estado_asistencia('Presente')
        crear_usuario('preceptor_as', roles=('preceptor',))
        self.payload = {
            'id_curso_materia': self.cm.id_curso_materia,
            'id_alumno': self.alumno.id_alumno,
            'id_estado_asistencia': self.estado.id_estado_asistencia,
        }

    @patch('django.utils.timezone.localtime', return_value=LUNES_0830)
    def test_preceptor_en_horario_pasa_los_checks_y_tropieza_con_bug_id_usuario(self, _m):
        """Comportamiento REAL actual del backend.

        El registro en horario supera el control de rol y de franja, pero
        falla con 400 porque AsistenciaViewSet.create pasa una instancia de
        Usuario como `id_usuario` y el serializador espera una PK. BUG REAL
        documentado (el endpoint nunca devuelve 201 hoy).
        """
        resp = cliente_para('preceptor_as').post('/api/asistencias/', self.payload)
        self.assertEqual(resp.status_code, 400)
        self.assertIn('id_usuario', resp.json())
        self.assertFalse(Asistencia.objects.exists())

    @patch('django.utils.timezone.localtime', return_value=LUNES_0700)
    def test_fuera_de_horario_es_rechazado(self, _m):
        resp = cliente_para('preceptor_as').post('/api/asistencias/', self.payload)
        self.assertEqual(resp.status_code, 403)
        self.assertIn('error', resp.json())

    @patch('django.utils.timezone.localtime', return_value=MARTES_0830)
    def test_sin_clases_ese_dia_es_rechazado(self, _m):
        resp = cliente_para('preceptor_as').post('/api/asistencias/', self.payload)
        self.assertEqual(resp.status_code, 403)

    @patch('django.utils.timezone.localtime', return_value=LUNES_0830)
    def test_docente_titular_pasa_los_checks_y_tropieza_con_bug_id_usuario(self, _m):
        """Idem bug real: el docente titular supera los controles de materia
        y suplencia pero el registro cae en el mismo 400 de `id_usuario`."""
        resp = cliente_para('docente_titular').post('/api/asistencias/', self.payload)
        self.assertEqual(resp.status_code, 400)
        self.assertIn('id_usuario', resp.json())

    @patch('django.utils.timezone.localtime', return_value=LUNES_0830)
    def test_titular_bloqueado_mientras_hay_suplencia_activa(self, _m):
        suplente = crear_docente('Luis', 'Suplente')
        crear_suplencia(
            self.cm, suplente,
            fecha_inicio=date(2026, 3, 1), fecha_fin=date(2026, 3, 31),
        )
        resp = cliente_para('docente_titular').post('/api/asistencias/', self.payload)
        self.assertEqual(resp.status_code, 403)
        # El suplente, con rol docente y suplencia vigente, sí pasa los
        # controles (pero cae en el mismo bug real de `id_usuario` → 400).
        suplente_usuario = crear_usuario('docente_suplente', roles=('docente',))
        suplente.id_usuario = suplente_usuario
        suplente.save()
        resp = cliente_para('docente_suplente').post('/api/asistencias/', self.payload)
        self.assertEqual(resp.status_code, 400)
        self.assertIn('id_usuario', resp.json())
