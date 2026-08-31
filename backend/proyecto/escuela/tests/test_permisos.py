from django.test import TestCase

from escuela.models import PeriodoEvaluacion
from .factories import (
    cliente_para,
    crear_acta,
    crear_alumno,
    crear_curso,
    crear_curso_materia,
    crear_docente,
    crear_materia,
    crear_tipo_acta,
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


class MatrizPermisosUsuariosTests(TestCase):
    """`/api/usuarios/` escribe solo director (defensa en profundidad:
    la puerta ya lo bloquea; `perform_*` exige 'director' igual que antes)."""

    def test_escritura_denegada_a_no_directores(self):
        for rol in ('familia', 'alumno', 'docente', 'preceptor', 'jefe_preceptores', 'admin'):
            with self.subTest(rol=rol, esperado=403):
                crear_usuario(f'usr_{rol}', roles=(rol,))
                resp = cliente_para(f'usr_{rol}').post(
                    '/api/usuarios/', {'usuario': f'nuevo_{rol}', 'contrasena': 'clave1234'},
                )
                self.assertEqual(resp.status_code, 403)

    def test_lectura_abierta_a_autenticados(self):
        for rol in ('alumno', 'docente', 'familia'):
            with self.subTest(rol=rol):
                crear_usuario(f'lee_usr_{rol}', roles=(rol,))
                resp = cliente_para(f'lee_usr_{rol}').get('/api/usuarios/')
                self.assertEqual(resp.status_code, 200)


class MatrizPermisosCalificacionesTests(TestCase):
    """`/api/calificaciones/`: alumno/familia/preceptor/jefe → 403 en la
    puerta; docente pasa la puerta (el 400 de payload vacío demuestra que
    llegó a validación) y el alcance fino por materia sigue en perform_*."""

    def test_puerta_bloquea_alumnos_familia_y_preceptoria(self):
        for rol in ('familia', 'alumno', 'preceptor', 'jefe_preceptores'):
            with self.subTest(rol=rol, esperado=403):
                crear_usuario(f'cal_{rol}', roles=(rol,))
                resp = cliente_para(f'cal_{rol}').post('/api/calificaciones/', {})
                self.assertEqual(resp.status_code, 403)

    def test_docente_admin_director_pasans_la_puerta(self):
        for rol in ('docente', 'admin', 'director'):
            with self.subTest(rol=rol, esperado=400):
                crear_usuario(f'cal_ok_{rol}', roles=(rol,))
                resp = cliente_para(f'cal_ok_{rol}').post('/api/calificaciones/', {})
                self.assertEqual(resp.status_code, 400)

    def test_docente_crea_calificacion_en_su_materia(self):
        usuario_docente = crear_usuario('dueño_materia', roles=('docente',))
        curso = crear_curso('4°1')
        materia = crear_materia('Química')
        docente = crear_docente(id_usuario=usuario_docente)
        cm = crear_curso_materia(curso, materia, docente)
        alumno = crear_alumno(id_curso=curso)
        periodo = PeriodoEvaluacion.objects.create(nombre_periodo='Diciembre')

        resp = cliente_para('dueño_materia').post('/api/calificaciones/', {
            'id_alumno': alumno.id_alumno,
            'id_curso_materia': cm.id_curso_materia,
            'id_docente': docente.id_docente,
            'id_periodo': periodo.id_periodo,
            'nota_numerica': '8.50',
        })
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(float(resp.json()['nota_numerica']), 8.5)


class MatrizPermisosPersonasTests(TestCase):
    """Alumnos/docentes/tutores: la escritura queda reservada a gestión.
    Docente y familia quedan afuera (antes podían llegar a crear)."""

    def test_creacion_personas_denegada_a_docente_familia_alumno(self):
        for endpoint in ('alumnos', 'docentes', 'padres-tutores'):
            for rol in ('docente', 'familia', 'alumno'):
                with self.subTest(endpoint=endpoint, rol=rol, esperado=403):
                    crear_usuario(f'per_{endpoint}_{rol}', roles=(rol,))
                    resp = cliente_para(f'per_{endpoint}_{rol}').post(f'/api/{endpoint}/', {})
                    self.assertEqual(resp.status_code, 403)

    def test_admin_y_director_pasans_la_puerta_de_personas(self):
        # Payload vacío: pasa la puerta (400 de validación) pero no crea nada.
        for rol in ('admin', 'director'):
            with self.subTest(rol=rol, esperado=400):
                crear_usuario(f'per_ok_{rol}', roles=(rol,))
                resp = cliente_para(f'per_ok_{rol}').post('/api/alumnos/', {})
                self.assertEqual(resp.status_code, 400)

    def test_jefe_pasa_la_puerta_de_alumnos(self):
        # Con payload vacío el 400 llega antes del perform_create (orden DRF);
        # las denegaciones finas de jefe_preceptores siguen en perform_*
        # y se ejercitan con payloads válidos en otros tests.
        crear_usuario('per_jefe', roles=('jefe_preceptores',))
        resp = cliente_para('per_jefe').post('/api/alumnos/', {})
        self.assertEqual(resp.status_code, 400)

    def test_eliminacion_alumno_denegada_a_familia(self):
        familia = crear_usuario('fam_del', roles=('familia',))
        alumno = crear_alumno()
        resp = cliente_para('fam_del').delete(f'/api/alumnos/{alumno.id_alumno}/')
        self.assertEqual(resp.status_code, 403)

    def test_directivos_solo_los_escribe_admin_y_director(self):
        crear_usuario('dir_precep', roles=('preceptor',))
        resp = cliente_para('dir_precep').post('/api/directivos/', {})
        self.assertEqual(resp.status_code, 403)

        leer = crear_usuario('dir_lector', roles=('docente',))
        resp = cliente_para(leer.usuario).get('/api/directivos/')
        self.assertEqual(resp.status_code, 200)


class MatrizPermisosCursosTests(TestCase):
    """`/api/cursos/` escribe solo admin/director (la puerta ahora también
    lo declara; `perform_*` ya lo exigía)."""

    def test_escritura_denegada_a_resto(self):
        for rol in ('familia', 'alumno', 'docente', 'preceptor', 'jefe_preceptores'):
            with self.subTest(rol=rol, esperado=403):
                crear_usuario(f'cur_{rol}', roles=(rol,))
                resp = cliente_para(f'cur_{rol}').post('/api/cursos/', {})
                self.assertEqual(resp.status_code, 403)

    def test_lectura_abierta(self):
        crear_usuario('cur_lector', roles=('docente',))
        resp = cliente_para('cur_lector').get('/api/cursos/')
        self.assertEqual(resp.status_code, 200)


class MatrizPermisosActasTests(TestCase):
    """`/api/actas/`: alumno/familia nunca escriben. Docente SÍ puede crear
    actas según la regla vigente (`ROLES_CREAR_ACTA`), preceptor también."""

    def setUp(self):
        self.tipo = crear_tipo_acta()
        self.payload = {
            'id_tipo_acta': self.tipo.id_tipo_acta,
            'titulo': 'Acta de prueba',
            'descripcion': 'Contenido del acta',
        }

    def test_creacion_denegada_a_alumno_y_familia(self):
        for rol in ('alumno', 'familia'):
            with self.subTest(rol=rol, esperado=403):
                crear_usuario(f'acta_{rol}', roles=(rol,))
                resp = cliente_para(f'acta_{rol}').post('/api/actas/', self.payload)
                self.assertEqual(resp.status_code, 403)

    def test_preceptor_y_docente_crear_actas(self):
        for rol in ('preceptor', 'docente'):
            with self.subTest(rol=rol, esperado=201):
                crear_usuario(f'acta_ok_{rol}', roles=(rol,))
                resp = cliente_para(f'acta_ok_{rol}').post('/api/actas/', self.payload)
                self.assertEqual(resp.status_code, 201)

    def test_anidado_acta_alumno_denegado_a_alumno(self):
        crear_usuario('acta_nest', roles=('alumno',))
        creador = crear_usuario('acta_nest_creador', roles=('preceptor',))
        acta = crear_acta(creador, self.tipo)
        resp = cliente_para('acta_nest').post('/api/acta-alumno/', {'id_acta': acta.id_acta})
        self.assertEqual(resp.status_code, 403)


class MatrizPermisosPlanificacionesTests(TestCase):
    """`/api/planificaciones/` escribe admin/director/docente."""

    def test_escritura_denegada_a_alumno_familia_y_preceptoria(self):
        for rol in ('alumno', 'familia', 'preceptor', 'jefe_preceptores'):
            with self.subTest(rol=rol, esperado=403):
                crear_usuario(f'plan_{rol}', roles=(rol,))
                resp = cliente_para(f'plan_{rol}').post('/api/planificaciones/', {})
                self.assertEqual(resp.status_code, 403)

    def test_docente_pasa_la_puerta(self):
        crear_usuario('plan_doc', roles=('docente',))
        resp = cliente_para('plan_doc').post('/api/planificaciones/', {})
        self.assertEqual(resp.status_code, 400)


class MatrizPermisosComunicadosTests(TestCase):
    """`/api/comunicados/`: publican admin/director/jefe_preceptores."""

    def test_escritura_denegada_a_preceptor_docente_alumno_familia(self):
        for rol in ('preceptor', 'docente', 'alumno', 'familia'):
            with self.subTest(rol=rol, esperado=403):
                crear_usuario(f'com_{rol}', roles=(rol,))
                resp = cliente_para(f'com_{rol}').post('/api/comunicados/', {})
                self.assertEqual(resp.status_code, 403)

    def test_jefe_pasa_la_puerta(self):
        crear_usuario('com_jefe', roles=('jefe_preceptores',))
        resp = cliente_para('com_jefe').post('/api/comunicados/', {})
        self.assertEqual(resp.status_code, 400)

    def test_lectura_abierta(self):
        crear_usuario('com_lector', roles=('alumno',))
        resp = cliente_para('com_lector').get('/api/comunicados/')
        self.assertEqual(resp.status_code, 200)


class MatrizPermisosCatalogosTests(TestCase):
    """Catálogos (módulos): escritura solo admin/director; lectura abierta."""

    def test_escritura_denegada_a_resto(self):
        for rol in ('preceptor', 'docente', 'alumno', 'familia', 'jefe_preceptores'):
            with self.subTest(rol=rol, esperado=403):
                crear_usuario(f'mod_{rol}', roles=(rol,))
                resp = cliente_para(f'mod_{rol}').post('/api/modulos/', {})
                self.assertEqual(resp.status_code, 403)

    def test_admin_pasa_la_puerta(self):
        crear_usuario('mod_admin', roles=('admin',))
        resp = cliente_para('mod_admin').post('/api/modulos/', {})
        self.assertEqual(resp.status_code, 400)

    def test_lectura_abierta(self):
        crear_usuario('mod_lector', roles=('docente',))
        resp = cliente_para('mod_lector').get('/api/modulos/')
        self.assertEqual(resp.status_code, 200)


class MatrizPermisosAcademicosAvanzadosTests(TestCase):
    """Sistema académico avanzado: alumno/familia solo leen; la escritura
    queda en directivos (y docente donde el flujo lo usa, p. ej. rendir)."""

    def test_escritura_denegada_a_alumno_y_familia(self):
        for rol in ('alumno', 'familia'):
            with self.subTest(rol=rol, endpoint='historial-academico'):
                crear_usuario(f'adv_{rol}', roles=(rol,))
                resp = cliente_para(f'adv_{rol}').post('/api/historial-academico/', {})
                self.assertEqual(resp.status_code, 403)

    def test_docente_pasa_puerta_de_materias_adeudadas(self):
        # El docente usa esta familia vía `rendir`; con payload vacío la
        # puerta deja llegar a validación (400) y no crea nada.
        crear_usuario('adv_doc', roles=('docente',))
        resp = cliente_para('adv_doc').post('/api/materias-adeudadas/', {})
        self.assertEqual(resp.status_code, 400)

    def test_lectura_de_materias_adeudadas_abierta(self):
        crear_usuario('adv_lector', roles=('familia',))
        resp = cliente_para('adv_lector').get('/api/materias-adeudadas/')
        self.assertEqual(resp.status_code, 200)
