from datetime import date, time

from django.test import TestCase

from escuela.models import AdelantoHoras
from escuela.views import AsistenciaViewSet

from .factories import (
    cliente_para,
    crear_adelanto,
    crear_curso,
    crear_curso_materia,
    crear_docente,
    crear_horario,
    crear_materia,
    crear_modulo,
    crear_preceptor,
    crear_usuario,
)


class AdelantoPermisosTests(TestCase):

    def setUp(self):
        self.curso = crear_curso('4°A')
        self.materia = crear_materia('Biología')
        self.docente = crear_docente('Docente', 'Bio')
        # El adelanto valida que el docente tenga asignada la materia en ese curso.
        self.cm = crear_curso_materia(self.curso, self.materia, self.docente)
        self.payload = {
            'id_curso': self.curso.id_curso,
            'id_materia': self.materia.id_materia,
            'id_docente': self.docente.id_docente,
            'fecha_adelanto': '2026-06-01',
            'hora_inicio': '09:00:00',
            'hora_fin': '10:00:00',
            'mantener_horario_original': True,
        }

    def test_roles_habilitados_pueden_crear(self):
        for idx, rol in enumerate(('admin', 'director', 'jefe_preceptores')):
            username = f'user_{rol}'
            crear_usuario(username, roles=(rol,))
            payload = dict(self.payload, fecha_adelanto=f'2026-06-0{idx + 1}')
            resp = cliente_para(username).post('/api/adelantos-horas/', payload)
            self.assertEqual(resp.status_code, 201, f'falló para {rol}: {resp.content}')

    def test_autorizador_se_asigna_al_usuario_autenticado(self):
        crear_usuario('admin_aut', roles=('admin',))
        resp = cliente_para('admin_aut').post('/api/adelantos-horas/', self.payload)
        self.assertEqual(resp.status_code, 201)
        adelanto = AdelantoHoras.objects.get(pk=resp.json()['id_adelanto'])
        self.assertEqual(adelanto.id_usuario_autorizador.usuario, 'admin_aut')

    def test_docente_no_puede_crear(self):
        crear_usuario('doc_adel', roles=('docente',))
        resp = cliente_para('doc_adel').post('/api/adelantos-horas/', self.payload)
        self.assertEqual(resp.status_code, 403)

    def test_familia_y_alumno_no_pueden_crear(self):
        for rol in ('familia', 'alumno'):
            username = f'user_{rol}'
            crear_usuario(username, roles=(rol,))
            resp = cliente_para(username).post('/api/adelantos-horas/', self.payload)
            self.assertEqual(resp.status_code, 403, f'falló para {rol}')

    def test_preceptor_del_curso_puede_crear(self):
        user = crear_usuario('prec_adel', roles=('preceptor',))
        preceptor = crear_preceptor('P', 'DelCurso', id_usuario=user)
        self.curso.id_preceptor = preceptor
        self.curso.save()
        resp = cliente_para('prec_adel').post('/api/adelantos-horas/', self.payload)
        self.assertEqual(resp.status_code, 201)

    def test_preceptor_de_otro_curso_no_puede_crear(self):
        user = crear_usuario('prec_otro', roles=('preceptor',))
        otro_curso = crear_curso('4°B')
        preceptor = crear_preceptor('P', 'OtroCurso', id_usuario=user)
        otro_curso.id_preceptor = preceptor
        otro_curso.save()
        resp = cliente_para('prec_otro').post('/api/adelantos-horas/', self.payload)
        self.assertEqual(resp.status_code, 403)


class AdelantoReemplazoHorarioTests(TestCase):

    def setUp(self):
        self.curso = crear_curso('1°B')
        self.materia = crear_materia('Geografía')
        self.docente = crear_docente('Docente', 'Geo')
        self.cm = crear_curso_materia(self.curso, self.materia, self.docente)
        self.modulo = crear_modulo(time(8, 0), time(9, 0), 'M1')
        self.horario = crear_horario(self.cm, 'Lunes', self.modulo)
        self.autorizador = crear_usuario('admin_geo', roles=('admin',))
        self.view = AsistenciaViewSet()

    def _horarios(self, fecha):
        return self.view._horarios_hoy(self.cm.id_curso_materia, 'Lunes', fecha)

    def test_sin_adelanto_solo_esta_el_bloque_normal(self):
        horarios = self._horarios(date(2026, 6, 1))
        self.assertEqual(len(horarios), 1)
        self.assertEqual(horarios[0]['hora_inicio'], '08:00')

    def test_adelanto_con_mantener_horario_no_cancela_el_original(self):
        crear_adelanto(
            self.curso, self.materia, self.docente,
            fecha=date(2026, 6, 1), hora_inicio=time(8, 30), hora_fin=time(9, 30),
            id_usuario_autorizador=self.autorizador, mantener_horario_original=True,
        )
        horarios = self._horarios(date(2026, 6, 1))
        franjas = sorted((h['hora_inicio'], h['hora_fin']) for h in horarios)
        self.assertEqual(franjas, [('08:00', '09:00'), ('08:30', '09:30')])

    def test_adelanto_sin_mantener_horario_reemplaza_el_bloque_solapado(self):
        # 08:30-09:30 se solapa con el bloque normal 08:00-09:00.
        crear_adelanto(
            self.curso, self.materia, self.docente,
            fecha=date(2026, 6, 1), hora_inicio=time(8, 30), hora_fin=time(9, 30),
            id_usuario_autorizador=self.autorizador, mantener_horario_original=False,
        )
        horarios = self._horarios(date(2026, 6, 1))
        self.assertEqual(len(horarios), 1)
        self.assertEqual(horarios[0]['hora_inicio'], '08:30')
        self.assertEqual(horarios[0]['hora_fin'], '09:30')

    def test_adelanto_de_otra_fecha_no_afecta(self):
        crear_adelanto(
            self.curso, self.materia, self.docente,
            fecha=date(2026, 6, 8), hora_inicio=time(9, 0), hora_fin=time(10, 0),
            id_usuario_autorizador=self.autorizador, mantener_horario_original=False,
        )
        horarios = self._horarios(date(2026, 6, 1))
        self.assertEqual(len(horarios), 1)
        self.assertEqual(horarios[0]['hora_inicio'], '08:00')
