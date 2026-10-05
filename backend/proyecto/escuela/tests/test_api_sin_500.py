"""Regresión de los HTTP 500 por `Unknown column` en los listados de la API.

Antes del arreglo, casi todos los endpoints de la API devolvían 500 con
`(1054, "Unknown column '<tabla>.<columna>' in 'SELECT'")` porque el esquema
físico de las tablas `managed=False` no tenía las columnas de borrado lógico,
ni `activo`, ni varias columnas de funcionalidad.

Este test recorre TODOS los ViewSet registrados en `escuela.urls.router` y
verifica que ningún listado devuelva 5xx con un usuario autenticado. Se
autentica con un JWT real (igual que en producción) para no abrir ningún
permiso, y además comprueba que los mismos endpoints sigan rechazados sin
autenticación.

Nunca escribe en la base real: el runner `escuela.test_runner
.EscuelaDiscoverRunner` crea `test_<base>` y le replica solo la estructura.
"""

from django.conf import settings
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from escuela.urls import router

# Vistasets cuyo listado necesita un parámetro o no es un listado GET simple.
EXCLUIDOS = set()


def _rutas_de_listado():
    """`/api/<prefijo>/` para cada ViewSet registrado en el router."""
    return sorted(f'/api/{prefijo}/' for prefijo, _vs, _bn in router.registry)


class ListadosDeLaApiTests(TestCase):
    """Ningún listado debe devolver 5xx una vez alineado el esquema."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.rutas = [r for r in _rutas_de_listado() if r not in EXCLUIDOS]
        cls.host = settings.ALLOWED_HOSTS[0]

    def _cliente(self, usuario=None):
        cliente = APIClient(raise_request_exception=False)
        if usuario is not None:
            token = RefreshToken.for_user(usuario).access_token
            cliente.credentials(HTTP_AUTHORIZATION='Bearer ' + str(token))
        return cliente

    def _usuario(self, nombre):
        usuario, _created = User.objects.get_or_create(
            username=nombre, defaults={'is_active': True},
        )
        return usuario

    def test_hay_listados_que_barrear(self):
        """Guarda contra una refactorización que vacíe el router."""
        self.assertGreater(len(self.rutas), 30)

    def test_listados_sin_5xx(self):
        usuario = self._usuario('test_esquema_admin')
        cliente = self._cliente(usuario)

        fallos = {}
        for ruta in self.rutas:
            respuesta = cliente.get(ruta, HTTP_HOST=self.host)
            if respuesta.status_code >= 500:
                fallos[ruta] = respuesta.status_code

        self.assertEqual(
            {}, fallos,
            'Endpoints que devuelven 5xx (esquema desalineado con los '
            'modelos): %s' % fallos,
        )

    def test_listados_sin_autenticar_siguen_rechazados(self):
        """La corrección no debe abrir rutas ni desactivar permisos.

        Se acepta cualquier respuesta de error (401 por falta de credenciales,
        403 por permisos, 404 por rutas que exigen contexto): lo que no debe
        pasar es que una petición sin autenticar devuelva datos.
        """
        cliente = self._cliente(None)

        publicos = []
        for ruta in self.rutas:
            respuesta = cliente.get(ruta, HTTP_HOST=self.host)
            if respuesta.status_code < 400:
                publicos.append((ruta, respuesta.status_code))

        self.assertEqual(
            [], publicos,
            'Endpoints que responden sin autenticar (se esperaba 4xx): %s' % publicos,
        )
