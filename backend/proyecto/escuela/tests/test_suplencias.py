from datetime import date

from django.test import TestCase

from escuela.utils import ResultadoDocenteActivo, obtener_docente_activo

from .factories import (
    cliente_para,
    crear_curso,
    crear_curso_materia,
    crear_docente,
    crear_materia,
    crear_suplencia,
    crear_usuario,
)


class ObtenerDocenteActivoTests(TestCase):

    def setUp(self):
        self.curso = crear_curso('3°A')
        self.materia = crear_materia('Lengua')
        self.titular = crear_docente('Titular', 'Principal')
        self.cm = crear_curso_materia(self.curso, self.materia, self.titular)

    def test_sin_suplencias_el_activo_es_el_titular(self):
        resultado = obtener_docente_activo(self.cm.id_curso_materia, date(2026, 5, 10))
        self.assertIsInstance(resultado, ResultadoDocenteActivo)
        self.assertEqual(resultado.docente, self.titular)
        self.assertFalse(resultado.es_suplencia)

    def test_suplencia_vigente_desplaza_al_titular(self):
        suplente = crear_docente('Suplente', 'Uno')
        crear_suplencia(
            self.cm, suplente,
            fecha_inicio=date(2026, 5, 1), fecha_fin=date(2026, 5, 31),
        )
        resultado = obtener_docente_activo(self.cm.id_curso_materia, date(2026, 5, 10))
        self.assertTrue(resultado.es_suplencia)
        self.assertEqual(resultado.docente, suplente)
        self.assertEqual(resultado.titular, self.titular)

    def test_suplencia_vencida_restaura_al_titular(self):
        suplente = crear_docente('Suplente', 'Dos')
        crear_suplencia(
            self.cm, suplente,
            fecha_inicio=date(2026, 4, 1), fecha_fin=date(2026, 4, 30),
        )
        resultado = obtener_docente_activo(self.cm.id_curso_materia, date(2026, 5, 10))
        self.assertFalse(resultado.es_suplencia)
        self.assertEqual(resultado.docente, self.titular)

    def test_nivel_mayor_gana_sobre_nivel_anterior(self):
        s1 = crear_docente('Suplente', 'NivelUno')
        s2 = crear_docente('Suplente', 'NivelDos')
        crear_suplencia(
            self.cm, s1, nivel=1,
            fecha_inicio=date(2026, 5, 1), fecha_fin=date(2026, 5, 31),
        )
        crear_suplencia(
            self.cm, s2, nivel=2,
            fecha_inicio=date(2026, 5, 1), fecha_fin=date(2026, 5, 31),
        )
        resultado = obtener_docente_activo(self.cm.id_curso_materia, date(2026, 5, 10))
        self.assertEqual(resultado.docente, s2)

    def test_suplencia_con_estado_false_no_se_tiene_en_cuenta(self):
        suplente = crear_docente('Suplente', 'Desactivada')
        crear_suplencia(
            self.cm, suplente,
            fecha_inicio=date(2026, 5, 1), fecha_fin=date(2026, 5, 31),
            estado=False,
        )
        resultado = obtener_docente_activo(self.cm.id_curso_materia, date(2026, 5, 10))
        self.assertEqual(resultado.docente, self.titular)

    def test_curso_materia_inexistente_devuelve_sin_docente(self):
        resultado = obtener_docente_activo(999999, date(2026, 5, 10))
        self.assertIsNone(resultado.docente)


class SuplenciaEndpointTests(TestCase):

    def setUp(self):
        self.curso = crear_curso('1°C')
        self.materia = crear_materia('Historia')
        self.titular = crear_docente('Titular', 'Hist')
        self.cm = crear_curso_materia(self.curso, self.materia, self.titular)
        self.suplente = crear_docente('Suplente', 'Hist')
        self.payload = {
            'id_curso_materia': self.cm.id_curso_materia,
            'id_docente_suplente': self.suplente.id_docente,
            'nivel': 1,
            'motivo': 'Licencia',
            'fecha_inicio': '2026-05-01',
            'fecha_fin': '2026-05-31',
        }

    def test_admin_puede_crear_suplencia(self):
        crear_usuario('admin_sup', roles=('admin',))
        resp = cliente_para('admin_sup').post('/api/suplencias/', self.payload)
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.json()['nivel'], 1)

    def test_director_puede_crear_suplencia(self):
        crear_usuario('dir_sup', roles=('director',))
        resp = cliente_para('dir_sup').post('/api/suplencias/', self.payload)
        self.assertEqual(resp.status_code, 201)

    def test_docente_no_puede_crear_suplencia(self):
        crear_usuario('doc_sup', roles=('docente',))
        resp = cliente_para('doc_sup').post('/api/suplencias/', self.payload)
        self.assertEqual(resp.status_code, 403)

    def test_familia_no_puede_crear_suplencia(self):
        crear_usuario('fam_sup', roles=('familia',))
        resp = cliente_para('fam_sup').post('/api/suplencias/', self.payload)
        self.assertEqual(resp.status_code, 403)
