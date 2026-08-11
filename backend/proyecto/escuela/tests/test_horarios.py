from datetime import time

from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext

from .factories import (
    cliente_para,
    crear_alumno,
    crear_curso,
    crear_curso_materia,
    crear_docente,
    crear_horario,
    crear_horario_especial,
    crear_materia,
    crear_modulo,
    crear_preceptor,
    crear_tutor,
    crear_usuario,
)


class HorarioScopingTests(TestCase):

    def setUp(self):
        self.curso_a = crear_curso('1°A')
        self.curso_b = crear_curso('2°B')
        self.modulo = crear_modulo(time(8, 0), time(9, 0), 'M1')
        self.docente = crear_docente('Docente', 'Uno')
        self.cm_a = crear_curso_materia(self.curso_a, crear_materia('Matemática'), self.docente)
        self.cm_b = crear_curso_materia(self.curso_b, crear_materia('Lengua'), self.docente)
        crear_horario(self.cm_a, 'Lunes', self.modulo, aula='A1')
        crear_horario(self.cm_b, 'Martes', self.modulo, aula='A2')
        crear_usuario('admin_hor', roles=('admin',))

    def _cursos_visibles(self, username):
        resp = cliente_para(username).get('/api/horarios/')
        self.assertEqual(resp.status_code, 200)
        return {h['id_curso'] for h in resp.json()}

    def test_admin_ve_todos_los_horarios(self):
        self.assertEqual(self._cursos_visibles('admin_hor'), {self.curso_a.id_curso, self.curso_b.id_curso})

    def test_alumno_solo_ve_el_horario_de_su_curso(self):
        user = crear_usuario('alumno_hor', roles=('alumno',))
        crear_alumno('Lucas', 'A', id_usuario=user, id_curso=self.curso_a)
        self.assertEqual(self._cursos_visibles('alumno_hor'), {self.curso_a.id_curso})

    def test_familia_ve_los_cursos_de_sus_hijos(self):
        user = crear_usuario('familia_hor', roles=('familia',))
        tutor = crear_tutor('Rosa', 'T', id_usuario=user)
        crear_alumno('Lucas', 'A', id_tutor=tutor, id_curso=self.curso_a)
        crear_alumno('Sofía', 'B', id_tutor=tutor, id_curso=self.curso_b)
        self.assertEqual(
            self._cursos_visibles('familia_hor'),
            {self.curso_a.id_curso, self.curso_b.id_curso},
        )

    def test_preceptor_solo_ve_los_cursos_asignados(self):
        user = crear_usuario('prec_hor', roles=('preceptor',))
        preceptor = crear_preceptor('P', 'Asignado', id_usuario=user)
        self.curso_a.id_preceptor = preceptor
        self.curso_a.save()
        self.assertEqual(self._cursos_visibles('prec_hor'), {self.curso_a.id_curso})


class HorariosEspecialesScopingTests(TestCase):

    def setUp(self):
        self.curso_a = crear_curso('1°A')
        self.curso_b = crear_curso('2°B')
        self.docente = crear_docente('Docente', 'Dos')
        self.cm_a = crear_curso_materia(self.curso_a, crear_materia('Matemática'), self.docente)
        self.cm_b = crear_curso_materia(self.curso_b, crear_materia('Lengua'), self.docente)
        crear_horario_especial(self.cm_a, 'Miércoles', time(9, 0), time(10, 0))
        crear_horario_especial(self.cm_b, 'Jueves', time(9, 0), time(10, 0))
        crear_usuario('admin_hes', roles=('admin',))

    def test_alumno_solo_ve_horarios_especiales_de_su_curso(self):
        user = crear_usuario('alumno_hes', roles=('alumno',))
        crear_alumno('Lucas', 'A', id_usuario=user, id_curso=self.curso_a)
        resp = cliente_para('alumno_hes').get('/api/horarios-especiales/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()), 1)


class NoN1RegressionTests(TestCase):

    """Los endpoints de horarios deben consultar en forma constante sin N+1."""

    def _contar_consultas_listado(self, cantidad):
        for i in range(cantidad):
            curso = crear_curso(f'{cantidad}X{i}A')
            cm = crear_curso_materia(curso, crear_materia(f'{cantidad}M{i}'), crear_docente(f'D{cantidad}{i}'))
            crear_horario(cm, 'Lunes', crear_modulo(time(8, 0), time(9, 0), f'K{cantidad}{i}'))
        crear_usuario(f'admin_n1_{cantidad}', roles=('admin',))
        client = cliente_para(f'admin_n1_{cantidad}')
        with CaptureQueriesContext(connection) as ctx:
            resp = client.get('/api/horarios/')
        self.assertEqual(resp.status_code, 200)
        return len(ctx)

    def test_horarios_no_genera_n1(self):
        q_poco = self._contar_consultas_listado(2)
        q_mucho = self._contar_consultas_listado(8)
        self.assertEqual(q_poco, q_mucho, 'El listado crece con los registros (N+1).')
