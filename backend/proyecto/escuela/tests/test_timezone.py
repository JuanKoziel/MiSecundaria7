from datetime import date, datetime
from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from escuela.models import Directivo, Rol, Usuario, UsuarioRol
from escuela.views import _dia_semana_es

from .factories import cliente_para, crear_usuario


class DiaSemanaESTests(TestCase):

    def test_mapping_de_dias_en_espanol(self):
        # 2026-03-02 es Lunes, 2026-03-07 es Sábado (solo de lunes a sábado).
        esperado = [
            ('Lunes', date(2026, 3, 2)),
            ('Martes', date(2026, 3, 3)),
            ('Miércoles', date(2026, 3, 4)),
            ('Jueves', date(2026, 3, 5)),
            ('Viernes', date(2026, 3, 6)),
            ('Sábado', date(2026, 3, 7)),
        ]
        for dia_es, d in esperado:
            dt = timezone.make_aware(datetime.combine(d, datetime.min.time()))
            self.assertEqual(_dia_semana_es(dt), dia_es)


class ServerTimeTests(TestCase):

    def test_server_time_devuelve_fecha_hora_y_dia_del_servidor(self):
        crear_usuario('doc_ts', roles=('docente',))
        fijo = timezone.make_aware(datetime(2026, 3, 4, 14, 30, 15))
        with patch('django.utils.timezone.localtime', return_value=fijo):
            resp = cliente_para('doc_ts').get('/api/asistencias/server-time/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data['fecha'], '2026-03-04')
        self.assertEqual(data['hora'], '14:30:15')
        self.assertEqual(data['dia_semana'], 'Miércoles')
