from django.test import TestCase
from rest_framework.test import APIClient

from .factories import cliente_para, crear_usuario


class SeleccionarRolTests(TestCase):

    def test_usuario_con_un_rol_puede_seleccionarlo(self):
        crear_usuario('un_rol', roles=('docente',))
        client = cliente_para('un_rol')
        resp = client.post('/api/rol-activo/', {'rol': 'docente'})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['rol_activo'], 'docente')

    def test_usuario_con_multiples_roles_puede_seleccionar_cada_uno(self):
        crear_usuario('multi', roles=('docente', 'preceptor'))
        client = cliente_para('multi')
        for rol in ('docente', 'preceptor'):
            with self.subTest(rol=rol):
                resp = client.post('/api/rol-activo/', {'rol': rol})
                self.assertEqual(resp.status_code, 200)
                self.assertEqual(resp.json()['rol_activo'], rol)

    def test_rol_no_perteneciente_rechazado(self):
        crear_usuario('docente_solo', roles=('docente',))
        client = cliente_para('docente_solo')
        for rol in ('admin', 'director', 'jefe_preceptores', 'preceptor'):
            with self.subTest(rol=rol):
                resp = client.post('/api/rol-activo/', {'rol': rol})
                self.assertEqual(resp.status_code, 403)

    def test_rol_inexistente_rechazado(self):
        crear_usuario('normal', roles=('docente',))
        resp = cliente_para('normal').post('/api/rol-activo/', {'rol': 'emperador'})
        self.assertEqual(resp.status_code, 403)

    def test_seleccionar_rol_no_concede_permisos_adicionales(self):
        """Un docente que intenta actuar como admin sigue siendo denegado
        en endpoints de solo admin/director."""
        crear_usuario('docente_falso', roles=('docente',))
        client = cliente_para('docente_falso')
        ok = client.post('/api/rol-activo/', {'rol': 'admin'})
        self.assertEqual(ok.status_code, 403)
        # Aun con un payload manual no puede escribir materias.
        resp = client.post('/api/materias/', {'nombre_materia': 'Inglés'})
        self.assertEqual(resp.status_code, 403)

    def test_roles_del_usuario_son_los_reales_de_la_bd(self):
        crear_usuario('multi_real', roles=('familia', 'alumno'))
        resp = cliente_para('multi_real').post('/api/rol-activo/', {'rol': 'alumno'})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(sorted(resp.json()['roles']), ['alumno', 'familia'])


class PanelSegunRolTests(TestCase):

    def test_rol_activo_es_una_eleccion_de_sesion(self):
        """El endpoint devuelve solo el rol elegido; no devuelve permisos
        extra ni un rol distinto al solicitado."""
        crear_usuario('elegido', roles=('preceptor', 'jefe_preceptores'))
        resp = cliente_para('elegido').post('/api/rol-activo/', {'rol': 'preceptor'})
        data = resp.json()
        self.assertEqual(data['rol_activo'], 'preceptor')
        self.assertEqual(set(data['roles']), {'preceptor', 'jefe_preceptores'})
