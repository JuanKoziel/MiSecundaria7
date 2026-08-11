from django.test import TestCase
from rest_framework.test import APIClient

from .factories import cliente_para, crear_usuario, crear_rol


class LoginTests(TestCase):

    def test_login_correcto_devuelve_tokens_y_roles(self):
        crear_usuario('admin_test', 'admin123', roles=('admin',))
        resp = APIClient().post('/api/login/', {
            'usuario': 'admin_test',
            'contrasena': 'admin123',
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('access', data)
        self.assertIn('refresh', data)
        self.assertIn('admin', data['roles'])

    def test_login_incorrecto_401(self):
        crear_usuario('docente_test', 'docente123', roles=('docente',))
        resp = APIClient().post('/api/login/', {
            'usuario': 'docente_test',
            'contrasena': 'incorrecta',
        })
        self.assertEqual(resp.status_code, 401)

    def test_login_usuario_deshabilitado_401(self):
        crear_usuario('baja_test', 'pass1234', roles=('docente',), estado=False)
        resp = APIClient().post('/api/login/', {
            'usuario': 'baja_test',
            'contrasena': 'pass1234',
        })
        self.assertEqual(resp.status_code, 401)
        self.assertIn('deshabilitado', resp.json()['error'].lower())

    def test_login_usuario_inexistente_401(self):
        resp = APIClient().post('/api/login/', {
            'usuario': 'no_existe',
            'contrasena': 'x',
        })
        self.assertEqual(resp.status_code, 401)


class EndpointsSinAutenticacionTests(TestCase):

    def test_me_sin_token_401(self):
        resp = APIClient().get('/api/me/')
        self.assertEqual(resp.status_code, 401)

    def test_rol_activo_sin_token_401(self):
        resp = APIClient().post('/api/rol-activo/', {'rol': 'admin'})
        self.assertEqual(resp.status_code, 401)

    def test_recurso_restringido_sin_token_401(self):
        for url in ('/api/usuarios/', '/api/docentes/', '/api/actas/', '/api/horarios/'):
            with self.subTest(url=url):
                self.assertEqual(APIClient().get(url).status_code, 401)


class MeTests(TestCase):

    def test_me_devuelve_roles_del_usuario(self):
        crear_usuario('multi_test', roles=('preceptor', 'jefe_preceptores'))
        client = cliente_para('multi_test')
        resp = client.get('/api/me/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data['usuario'], 'multi_test')
        self.assertEqual(sorted(data['roles']), ['jefe_preceptores', 'preceptor'])

    def test_me_de_usuario_sin_rol(self):
        crear_usuario('sinrol_test', roles=())
        client = cliente_para('sinrol_test')
        resp = client.get('/api/me/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['roles'], [])


class RolesCrudTests(TestCase):

    def test_jefe_preceptores_es_un_rol_listable(self):
        crear_rol('jefe_preceptores')
        crear_usuario('admin_test', roles=('admin',))
        resp = cliente_para('admin_test').get('/api/roles/')
        self.assertEqual(resp.status_code, 200)
        nombres = [r['nombre_rol'] for r in resp.json()]
        self.assertIn('jefe_preceptores', nombres)
