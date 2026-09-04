"""Tests de la Parte 1 del Plan Maestro: infraestructura y seguridad.

Cubren:
- lectura únicamente de las notificaciones del usuario autenticado;
- imposibilidad de leer/marcar como leída notificaciones ajenas;
- imposibilidad de crear arbitrariamente una notificación para otro usuario
  a través de la API pública (la creación es interna, vía notifications.notificar);
- soporte de `id_alumno` (presente y NULL para históricas);
- Familia con múltiples hijos y sin acceso a un alumno ajeno.
"""

from django.test import TestCase

from escuela.models import Notificacion
from escuela.notifications import notificar

from .factories import (
    cliente_para,
    crear_alumno,
    crear_curso,
    crear_tutor,
    crear_usuario,
)


class NotificacionesLecturaTests(TestCase):
    """Lectura y privacidad básica."""

    def setUp(self):
        self.usuario_a = crear_usuario('notif_a')
        self.usuario_b = crear_usuario('notif_b')

    def test_lectura_propia(self):
        notificar(id_usuario=self.usuario_a, titulo='Aviso A', mensaje='Solo A')
        resp = cliente_para('notif_a').get('/api/notificaciones/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['titulo'], 'Aviso A')
        self.assertEqual(data[0]['id_usuario'], self.usuario_a.id_usuario)

    def test_no_se_leen_notificaciones_ajenas(self):
        notificar(id_usuario=self.usuario_a, titulo='Privado de A')
        resp = cliente_para('notif_b').get('/api/notificaciones/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), [])

    def test_no_se_puede_filtrar_por_usuario_ajeno(self):
        """`?usuario=` no debe permitir leer notificaciones de otro."""
        notificar(id_usuario=self.usuario_a, titulo='Privado de A')
        resp = cliente_para('notif_b').get(
            f'/api/notificaciones/?usuario={self.usuario_a.id_usuario}'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), [])

    def test_no_se_marca_leida_una_ajena(self):
        n = notificar(id_usuario=self.usuario_a, titulo='Privado de A')
        resp = cliente_para('notif_b').patch(
            f'/api/notificaciones/{n.id_notificacion}/marcar_leida/'
        )
        self.assertEqual(resp.status_code, 404)
        n.refresh_from_db()
        self.assertFalse(n.leida)

    def test_se_marca_leida_una_propia(self):
        n = notificar(id_usuario=self.usuario_a, titulo='Mío')
        resp = cliente_para('notif_a').patch(
            f'/api/notificaciones/{n.id_notificacion}/marcar_leida/'
        )
        self.assertEqual(resp.status_code, 200)
        n.refresh_from_db()
        self.assertTrue(n.leida)


class NotificacionesCreacionTests(TestCase):
    """La creación es interna; la API no permite crear para otros."""

    def setUp(self):
        self.origen = crear_usuario('origen_creador')

    def test_no_se_puede_crear_notificacion_por_api_para_otro_usuario(self):
        destino = crear_usuario('destino_ajeno')
        antes = Notificacion.objects.count()
        resp = cliente_para('origen_creador').post(
            '/api/notificaciones/',
            {'id_usuario': destino.id_usuario, 'titulo': 'Lo creo yo', 'mensaje': 'x'},
        )
        self.assertEqual(resp.status_code, 405)
        self.assertEqual(Notificacion.objects.count(), antes)


class NotificacionesIdAlumnoTests(TestCase):
    """Soporte de `id_alumno` (presente y NULL para históricas)."""

    def setUp(self):
        self.usuario = crear_usuario('alum_owner')
        self.curso = crear_curso('1°A')
        self.alumno = crear_alumno('Lucas', 'Perez', id_curso=self.curso)

    def test_id_alumno_presente(self):
        notificar(
            id_usuario=self.usuario,
            titulo='Calificación',
            id_alumno=self.alumno,
        )
        resp = cliente_para('alum_owner').get('/api/notificaciones/')
        notif = resp.json()[0]
        self.assertEqual(notif['id_alumno'], self.alumno.id_alumno)

    def test_id_alumno_null_historica_funciona(self):
        notificar(id_usuario=self.usuario, titulo='Aviso general')
        resp = cliente_para('alum_owner').get('/api/notificaciones/')
        notif = resp.json()[0]
        self.assertIsNone(notif['id_alumno'])
        self.assertEqual(notif['titulo'], 'Aviso general')


class NotificacionesFamiliaTests(TestCase):
    """Familia con varios hijos y sin acceso a alumnos ajenos."""

    def setUp(self):
        self.familia = crear_usuario('familia_uno', roles=('familia',))
        self.tutor = crear_tutor('Rosa', 'Tutor', id_usuario=self.familia)
        self.hijo1 = crear_alumno('Hijo', 'Uno', id_tutor=self.tutor)
        self.hijo2 = crear_alumno('Hijo', 'Dos', id_tutor=self.tutor)
        # Alumno ajeno (otra familia) con su propio usuario.
        self.tutor_ajeno = crear_tutor('Otro', 'Tutor')
        self.ajeno = crear_alumno('Ajeno', 'Alumno', id_tutor=self.tutor_ajeno)
        self.usuario_ajeno = crear_usuario('familia_dos', roles=('familia',))
        self.tutor_ajeno.id_usuario = self.usuario_ajeno
        self.tutor_ajeno.save()

    def test_familia_recibe_notificaciones_independientes_por_hijo(self):
        notificar(
            id_usuario=self.familia, titulo='Nota Hijo 1', id_alumno=self.hijo1,
        )
        notificar(
            id_usuario=self.familia, titulo='Nota Hijo 2', id_alumno=self.hijo2,
        )

        client = cliente_para('familia_uno')

        resp1 = client.get(f'/api/notificaciones/?id_alumno={self.hijo1.id_alumno}')
        titulos1 = [n['titulo'] for n in resp1.json()]
        self.assertEqual(titulos1, ['Nota Hijo 1'])

        resp2 = client.get(f'/api/notificaciones/?id_alumno={self.hijo2.id_alumno}')
        titulos2 = [n['titulo'] for n in resp2.json()]
        self.assertEqual(titulos2, ['Nota Hijo 2'])

        resp_todas = client.get('/api/notificaciones/')
        self.assertEqual(len(resp_todas.json()), 2)

    def test_familia_no_lee_notificaciones_de_familia_ajena(self):
        notificar(
            id_usuario=self.usuario_ajeno,
            titulo='Secreto de la otra familia',
            id_alumno=self.ajeno,
        )
        resp = cliente_para('familia_uno').get('/api/notificaciones/')
        self.assertEqual(resp.json(), [])

    def test_familia_no_accede_con_id_alumno_ajeno(self):
        notificar(
            id_usuario=self.usuario_ajeno,
            titulo='Secreto',
            id_alumno=self.ajeno,
        )
        resp = cliente_para('familia_uno').get(
            f'/api/notificaciones/?id_alumno={self.ajeno.id_alumno}'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), [])


class NotificacionesMarcarTodasTests(TestCase):
    """`marcar_todas_leidas`: solo afecta a las propias (y, en Familia, a las
    del hijo seleccionado mediante `?id_alumno=`).
    """

    def setUp(self):
        self.usuario_a = crear_usuario('mas_owner_a')
        self.usuario_b = crear_usuario('mas_owner_b')

    def test_marca_todas_propias(self):
        n1 = notificar(id_usuario=self.usuario_a, titulo='A1')
        n2 = notificar(id_usuario=self.usuario_a, titulo='A2')
        resp = cliente_para('mas_owner_a').patch(
            '/api/notificaciones/marcar_todas_leidas/'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['actualizadas'], 2)
        n1.refresh_from_db()
        n2.refresh_from_db()
        self.assertTrue(n1.leida)
        self.assertTrue(n2.leida)

    def test_no_afecta_las_ajenas(self):
        ajena = notificar(id_usuario=self.usuario_b, titulo='De B')
        propia = notificar(id_usuario=self.usuario_a, titulo='De A')
        resp = cliente_para('mas_owner_a').patch(
            '/api/notificaciones/marcar_todas_leidas/'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['actualizadas'], 1)
        propia.refresh_from_db()
        ajena.refresh_from_db()
        self.assertTrue(propia.leida)
        self.assertFalse(ajena.leida)

    def test_familia_marca_todas_solo_del_hijo_seleccionado(self):
        familia = crear_usuario('mas_familia')
        tutor = crear_tutor('T', 'Fam', id_usuario=familia)
        hijo1 = crear_alumno('H', 'Uno', id_tutor=tutor)
        hijo2 = crear_alumno('H', 'Dos', id_tutor=tutor)

        n1 = notificar(id_usuario=familia, titulo='Hijo 1', id_alumno=hijo1)
        n2 = notificar(id_usuario=familia, titulo='Hijo 2', id_alumno=hijo2)

        resp = cliente_para('mas_familia').patch(
            f'/api/notificaciones/marcar_todas_leidas/?id_alumno={hijo1.id_alumno}'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['actualizadas'], 1)
        n1.refresh_from_db()
        n2.refresh_from_db()
        self.assertTrue(n1.leida)
        self.assertFalse(n2.leida)

    def test_no_afecta_las_personales_al_filtrar_por_hijo(self):
        """Con `?id_alumno=`, la personal (id_alumno NULL) queda intacta."""
        tutor = crear_tutor('T', 'Fam')
        hijo = crear_alumno('H', 'Uno', id_tutor=tutor)
        familia = crear_usuario('mas_fam2')
        tutor.id_usuario = familia
        tutor.save()

        personal = notificar(id_usuario=familia, titulo='Personal')
        del_hijo = notificar(id_usuario=familia, titulo='Del hijo', id_alumno=hijo)

        resp = cliente_para('mas_fam2').patch(
            f'/api/notificaciones/marcar_todas_leidas/?id_alumno={hijo.id_alumno}'
        )
        self.assertEqual(resp.json()['actualizadas'], 1)
        del_hijo.refresh_from_db()
        personal.refresh_from_db()
        self.assertTrue(del_hijo.leida)
        self.assertFalse(personal.leida)
