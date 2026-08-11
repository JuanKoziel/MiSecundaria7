from django.test import TestCase

from .factories import (
    cliente_para,
    crear_curso,
    crear_curso_materia,
    crear_docente,
    crear_materia,
    crear_usuario,
)


class MatrizPermisosMateriasTests(TestCase):
    """`/api/materias/` usa IsAdminOrDirectorForWrite: solo admin/director
    escriben; el resto 403. La lectura está abierta a autenticados."""

    def test_lectura_abierta_a_cualquier_autenticado(self):
        for rol in ('admin', 'director', 'preceptor', 'docente', 'familia', 'alumno'):
            with self.subTest(rol=rol):
                crear_usuario(f'lector_{rol}', roles=(rol,))
                resp = cliente_para(f'lector_{rol}').get('/api/materias/')
                self.assertEqual(resp.status_code, 200)

    def test_escritura_solo_admin_director(self):
        for rol in ('familia', 'alumno', 'docente', 'preceptor', 'jefe_preceptores'):
            with self.subTest(rol=rol, esperado=403):
                crear_usuario(f'escritor_{rol}', roles=(rol,))
                resp = cliente_para(f'escritor_{rol}').post(
                    '/api/materias/', {'nombre_materia': f'Mat {rol}'},
                )
                self.assertEqual(resp.status_code, 403)

    def test_admin_y_director_pueden_crear(self):
        for rol in ('admin', 'director'):
            with self.subTest(rol=rol):
                crear_usuario(f'admin_{rol}', roles=(rol,))
                resp = cliente_para(f'admin_{rol}').post(
                    '/api/materias/', {'nombre_materia': f'Matemática {rol}'},
                )
                self.assertEqual(resp.status_code, 201)
                self.assertEqual(resp.json()['nombre_materia'], f'Matemática {rol}')


class MatrizPermisosSuplenciasTests(TestCase):
    """`/api/suplencias/` también usa IsAdminOrDirectorForWrite."""

    def setUp(self):
        self.curso = crear_curso('1°A')
        self.materia = crear_materia('Historia')
        self.docente = crear_docente()
        self.cm = crear_curso_materia(self.curso, self.materia, self.docente)
        self.suplente = crear_docente('Luis', 'Suplente')
        self.payload = {
            'id_curso_materia': self.cm.id_curso_materia,
            'id_docente_suplente': self.suplente.id_docente,
            'nivel': 1,
            'fecha_inicio': '2026-08-01',
            'fecha_fin': '2026-08-15',
        }

    def test_solo_admin_director_crean_suplencias(self):
        for rol in ('familia', 'alumno', 'docente', 'preceptor', 'jefe_preceptores'):
            with self.subTest(rol=rol):
                crear_usuario(f'sup_{rol}', roles=(rol,))
                resp = cliente_para(f'sup_{rol}').post('/api/suplencias/', self.payload)
                self.assertEqual(resp.status_code, 403)

    def test_admin_crea_suplencia(self):
        crear_usuario('sup_admin', roles=('admin',))
        resp = cliente_para('sup_admin').post('/api/suplencias/', self.payload)
        self.assertEqual(resp.status_code, 201)


class MatrizPermisosAdelantosTests(TestCase):
    """`/api/adelantos-horas/` usa PuedeGestionarAdelantos: admin/director/
    jefe/preceptor sí; familia/alumno/docente no."""

    def test_lectura_permitida_a_roles_gestionantes(self):
        for rol in ('admin', 'director', 'jefe_preceptores', 'preceptor'):
            with self.subTest(rol=rol):
                crear_usuario(f'adel_{rol}', roles=(rol,))
                resp = cliente_para(f'adel_{rol}').get('/api/adelantos-horas/')
                self.assertEqual(resp.status_code, 200)

    def test_lectura_denegada_a_resto(self):
        for rol in ('familia', 'alumno', 'docente'):
            with self.subTest(rol=rol):
                crear_usuario(f'adel_{rol}', roles=(rol,))
                resp = cliente_para(f'adel_{rol}').get('/api/adelantos-horas/')
                self.assertEqual(resp.status_code, 403)


class MatrizPermisosHistorialTests(TestCase):
    """`/api/historial/` usa PuedeVerHistorial: admin/director/jefe sí."""

    def test_historial_visible_para_admin_director_jefe(self):
        for rol in ('admin', 'director', 'jefe_preceptores'):
            with self.subTest(rol=rol):
                crear_usuario(f'hist_{rol}', roles=(rol,))
                resp = cliente_para(f'hist_{rol}').get('/api/historial/')
                self.assertEqual(resp.status_code, 200)

    def test_historial_denegado_a_preceptor_docente_familia_alumno(self):
        for rol in ('preceptor', 'docente', 'familia', 'alumno'):
            with self.subTest(rol=rol):
                crear_usuario(f'hist_{rol}', roles=(rol,))
                resp = cliente_para(f'hist_{rol}').get('/api/historial/')
                self.assertEqual(resp.status_code, 403)


class PermisosAsistenciasTests(TestCase):
    """`/api/asistencias/` (POST) tiene check de rol propio del viewset:
    familia/alumno/jefe_preceptores → 403."""

    def test_asistencia_denegada_a_familia_y_alumno(self):
        for rol in ('familia', 'alumno'):
            with self.subTest(rol=rol):
                crear_usuario(f'asist_{rol}', roles=(rol,))
                resp = cliente_para(f'asist_{rol}').post('/api/asistencias/', {})
                self.assertEqual(resp.status_code, 403)

    def test_asistencia_denegada_a_jefe_preceptores(self):
        crear_usuario('asist_jefe', roles=('jefe_preceptores',))
        resp = cliente_para('asist_jefe').post('/api/asistencias/', {})
        self.assertEqual(resp.status_code, 403)
