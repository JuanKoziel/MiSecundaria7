"""Tests del módulo Administración → Configuración (datos maestros).

Cubre los cinco catálogos de la v1:

* ciclos lectivos
* módulos horarios
* períodos de evaluación
* estados de asistencia
* tipos de acta

Para cada uno verifica: listado, alta, edición, desactivación o eliminación,
reacción a un registro en uso (HTTP 400 y NO 500), permisos de escritura,
inclusión de inactivos y —para estados de asistencia— el seed idempotente.

Nunca escribe en la base real: el runner `escuela.test_runner
.EscuelaDiscoverRunner` crea `test_<base>` y le replica solo la estructura.
"""
from datetime import date, datetime, time

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from escuela.models import (
    Acta,
    Asistencia,
    Calificacion,
    CicloLectivo,
    Curso,
    CursoMateria,
    EstadoAsistencia,
    Horario,
    Materia,
    Modulos,
    PeriodoEvaluacion,
    Rol,
    TipoActa,
    Usuario,
    UsuarioRol,
)
from escuela.utils import (
    ESTADOS_ASISTENCIA_BASE,
    es_estado_asistencia_base,
    seed_estados_asistencia_base,
)

# Centinela para pedir un cliente sin autenticar (el `None` de "sin usuario"
# ya significa "el admin del test").
SIN_AUTENTICAR = object()


class BaseConfiguracionTests(TestCase):
    """Infraestructura común: clientes autenticados con roles reales."""

    host = settings.ALLOWED_HOSTS[0]

    def setUp(self):
        # La migración 0008 deja los cinco estados base en la base de test.
        # Los tests de catálogo arrancan sin datos para poder medir exactamente
        # lo que crean.
        EstadoAsistencia.objects.filter(
            nombre_estado__in=ESTADOS_ASISTENCIA_BASE,
        ).delete()
        EstadoAsistencia.objects.all().delete()
        CicloLectivo.objects.all().delete()
        Modulos.objects.all().delete()
        PeriodoEvaluacion.objects.all().delete()
        TipoActa.objects.all().delete()

        # Roles reales de `roles` (catálogo del sistema, no lo creamos).
        self.rol_admin = self._rol('admin')
        self.rol_director = self._rol('director')
        self.rol_preceptor = self._rol('preceptor')
        self.rol_docente = self._rol('docente')

        self.admin = self._usuario_admin('cfg_admin')
        self.director = self._usuario_admin('cfg_director')
        self.preceptor = self._usuario_preceptor('cfg_preceptor')
        self.docente = self._usuario_preceptor('cfg_docente')

    # -- helpers ---------------------------------------------------------

    def _rol(self, nombre):
        rol, _created = Rol.objects.get_or_create(nombre_rol=nombre)
        return rol

    def _usuario_admin(self, nombre):
        """Usuario Django (para el JWT) con fila en `usuarios` y rol."""
        django_user, _ = User.objects.get_or_create(
            username=nombre, defaults={'is_active': True},
        )
        usuario, _ = Usuario.objects.get_or_create(
            usuario=nombre,
            defaults={'contrasena': 'x', 'estado': True},
        )
        UsuarioRol.objects.get_or_create(id_usuario=usuario, id_rol=self.rol_admin)
        UsuarioRol.objects.get_or_create(id_usuario=usuario, id_rol=self.rol_director)
        return django_user

    def _usuario_preceptor(self, nombre):
        django_user, _ = User.objects.get_or_create(
            username=nombre, defaults={'is_active': True},
        )
        usuario, _ = Usuario.objects.get_or_create(
            usuario=nombre,
            defaults={'contrasena': 'x', 'estado': True},
        )
        UsuarioRol.objects.get_or_create(id_usuario=usuario, id_rol=self.rol_preceptor)
        UsuarioRol.objects.get_or_create(id_usuario=usuario, id_rol=self.rol_docente)
        return django_user

    def _cliente(self, django_user=None):
        cliente = APIClient(raise_request_exception=False)
        if django_user is not None:
            token = RefreshToken.for_user(django_user).access_token
            cliente.credentials(HTTP_AUTHORIZATION='Bearer ' + str(token))
        return cliente

    def _cli(self, usuario=None):
        """Cliente del usuario indicado; sin argumento, el admin del test.

        Para probar el caso sin autenticar se pasa `SIN_AUTENTICAR`.
        """
        if usuario is SIN_AUTENTICAR:
            return self._cliente(None)
        return self._cliente(usuario or self.admin)

    def _get(self, ruta, params=None, usuario=None):
        return self._cli(usuario).get(ruta, params or {}, HTTP_HOST=self.host)

    def _post(self, ruta, payload, usuario=None):
        return self._cli(usuario).post(
            ruta, payload, format='json', HTTP_HOST=self.host,
        )

    def _patch(self, ruta, payload, usuario=None):
        return self._cli(usuario).patch(
            ruta, payload, format='json', HTTP_HOST=self.host,
        )

    def _delete(self, ruta, usuario=None):
        return self._cli(usuario).delete(ruta, HTTP_HOST=self.host)


# ---------------------------------------------------------------------------
# Ciclos lectivos
# ---------------------------------------------------------------------------

class CicloLectivoTests(BaseConfiguracionTests):
    url = '/api/ciclos-lectivos/'

    def _crear(self, anio=2026, usuario=None, **extra):
        payload = {'anio': anio, 'estado': True}
        payload.update(extra)
        return self._post(self.url, payload, usuario or self.admin)

    def test_listar_requiere_autenticacion(self):
        respuesta = self._get(self.url, usuario=SIN_AUTENTICAR)
        self.assertIn(respuesta.status_code, (401, 403))

    def test_listar_devuelve_lista(self):
        self._crear()
        respuesta = self._get(self.url)
        self.assertEqual(200, respuesta.status_code)
        self.assertEqual(1, len(respuesta.json()))

    def test_crear(self):
        respuesta = self._crear(
            2027, fecha_inicio='2027-03-01', fecha_fin='2027-12-15',
        )
        self.assertEqual(201, respuesta.status_code)
        self.assertEqual(2027, respuesta.json()['anio'])
        self.assertTrue(CicloLectivo.all_objects.filter(anio=2027).exists())

    def test_crear_anio_obligatorio(self):
        respuesta = self._post(self.url, {'estado': True}, self.admin)
        self.assertEqual(400, respuesta.status_code)

    def test_crear_anio_de_cuatro_digitos(self):
        for anio in (25, 999, 1000, 3000, 9999, 10000, -2026):
            respuesta = self._crear(anio)
            self.assertEqual(
                400, respuesta.status_code,
                'El año %r debería ser rechazado' % anio,
            )

    def test_anio_fuera_del_rango_de_la_columna_year_no_tira_500(self):
        """`ciclos_lectivos.anio` es `YEAR(4)`: solo admite 1901..2155.

        Sin acotar el rango, un año como 3000 pasaba la validación del
        serializer y reventaba al insertar con un DataError de MariaDB
        (HTTP 500) en lugar de un 400 con mensaje útil.
        """
        for anio in (1900, 2156, 3000):
            respuesta = self._crear(anio)
            self.assertEqual(
                400, respuesta.status_code,
                'El año %r debería dar 400, no 500' % anio,
            )

    def test_acepta_los_extremos_del_rango_valido(self):
        for anio in (1901, 2155):
            respuesta = self._crear(anio)
            self.assertEqual(201, respuesta.status_code)
            self.assertEqual(anio, respuesta.json()['anio'])

    def test_no_permite_dos_ciclos_activos_con_el_mismo_anio(self):
        self.assertEqual(201, self._crear(2026).status_code)
        respuesta = self._crear(2026)
        self.assertEqual(400, respuesta.status_code)

    def test_fecha_fin_no_puede_preceder_al_inicio(self):
        respuesta = self._crear(
            2028, fecha_inicio='2028-03-01', fecha_fin='2028-01-01',
        )
        self.assertEqual(400, respuesta.status_code)

    def test_fecha_eliminacion_es_read_only(self):
        respuesta = self._crear(2029)
        id_ciclo = respuesta.json()['id_ciclo']
        # Aunque el cliente mande el campo, no debe escribirse.
        r = self._patch(
            '%s%d/' % (self.url, id_ciclo),
            {'fecha_eliminacion': '2030-01-01 00:00:00'},
        )
        self.assertEqual(200, r.status_code)
        ciclo = CicloLectivo.all_objects.get(pk=id_ciclo)
        self.assertIsNone(ciclo.fecha_eliminacion)

    def test_editar(self):
        id_ciclo = self._crear(2030).json()['id_ciclo']
        respuesta = self._patch(
            '%s%d/' % (self.url, id_ciclo), {'anio': 2031},
        )
        self.assertEqual(200, respuesta.status_code)
        self.assertEqual(2031, CicloLectivo.all_objects.get(pk=id_ciclo).anio)

    def test_desactivar_es_borrado_logico_no_fisico(self):
        id_ciclo = self._crear(2032).json()['id_ciclo']
        respuesta = self._delete('%s%d/' % (self.url, id_ciclo))
        self.assertEqual(204, respuesta.status_code)

        # La fila sigue existiendo: se desactivó, no se borró.
        ciclo = CicloLectivo.all_objects.get(pk=id_ciclo)
        self.assertFalse(ciclo.estado)
        self.assertIsNotNone(ciclo.fecha_eliminacion)

    def test_desactivar_omite_los_inactivos_del_listado(self):
        id_ciclo = self._crear(2033).json()['id_ciclo']
        self._delete('%s%d/' % (self.url, id_ciclo))
        self.assertEqual([], self._get(self.url).json())

    def test_incluir_inactivos(self):
        id_ciclo = self._crear(2034).json()['id_ciclo']
        self._delete('%s%d/' % (self.url, id_ciclo))
        respuesta = self._get(self.url, {'incluir_inactivos': 'true'})
        self.assertEqual(200, respuesta.status_code)
        self.assertEqual([id_ciclo], [c['id_ciclo'] for c in respuesta.json()])

    def test_reactivar(self):
        id_ciclo = self._crear(2035).json()['id_ciclo']
        self._delete('%s%d/' % (self.url, id_ciclo))

        respuesta = self._patch('%s%d/' % (self.url, id_ciclo), {'estado': True})
        self.assertEqual(200, respuesta.status_code)
        self.assertTrue(CicloLectivo.all_objects.get(pk=id_ciclo).estado)

    def test_desactivar_con_cursos_responde_400_no_500(self):
        id_ciclo = self._crear(2036).json()['id_ciclo']
        Curso.objects.create(
            nombre_curso='1°1', id_ciclo_id=id_ciclo, estado=True, activo=True,
        )
        respuesta = self._delete('%s%d/' % (self.url, id_ciclo))
        self.assertEqual(400, respuesta.status_code)
        self.assertIn('No se puede desactivar', str(respuesta.json()))
        # No debe haber quedado desactivado.
        self.assertTrue(CicloLectivo.all_objects.get(pk=id_ciclo).estado)

    def test_desactivar_con_alcances_de_comunicado_responde_400(self):
        from escuela.models import Comunicado, ComunicadoAlcance

        id_ciclo = self._crear(2037).json()['id_ciclo']
        comunicado = Comunicado.objects.create(
            titulo='Prueba',
            cuerpo='Prueba',
            fecha=timezone.make_aware(datetime(2026, 1, 1, 9, 0)),
        )
        ComunicadoAlcance.objects.create(id_comunicado=comunicado, id_ciclo_id=id_ciclo)

        respuesta = self._delete('%s%d/' % (self.url, id_ciclo))
        self.assertEqual(400, respuesta.status_code)

    def test_escritura_solo_admin_director(self):
        for usuario in (self.preceptor, self.docente):
            self.assertEqual(
                403, self._crear(2038, usuario).status_code,
                'Un usuario sin rol admin/director no debería crear ciclos',
            )
            self.assertEqual(
                403, self._delete(self.url, usuario).status_code,
            )

    def test_escritura_permitida_a_director(self):
        self.assertEqual(201, self._crear(2039, usuario=self.director).status_code)

    def test_lectura_abierta_a_autenticados(self):
        self._crear(2040)
        for usuario in (self.admin, self.preceptor, self.docente):
            self.assertEqual(200, self._get(self.url, usuario=usuario).status_code)


# ---------------------------------------------------------------------------
# Módulos horarios
# ---------------------------------------------------------------------------

class ModuloHorarioTests(BaseConfiguracionTests):
    url = '/api/modulos/'

    def _crear(self, usuario=None, **extra):
        payload = {
            'nombre': 'Módulo 1',
            'hora_inicio': '07:30',
            'hora_fin': '08:10',
        }
        payload.update(extra)
        return self._post(self.url, payload, usuario or self.admin)

    def test_listar(self):
        self._crear()
        respuesta = self._get(self.url)
        self.assertEqual(200, respuesta.status_code)
        self.assertEqual(1, len(respuesta.json()))

    def test_crear(self):
        respuesta = self._crear()
        self.assertEqual(201, respuesta.status_code)
        self.assertTrue(Modulos.objects.filter(nombre='Módulo 1').exists())

    def test_nombre_obligatorio(self):
        respuesta = self._post(
            self.url,
            {'nombre': '   ', 'hora_inicio': '07:30', 'hora_fin': '08:10'},
            self.admin,
        )
        self.assertEqual(400, respuesta.status_code)

    def test_nombre_duplicado(self):
        self._crear()
        self.assertEqual(400, self._crear().status_code)

    def test_hora_fin_debe_ser_posterior_a_la_de_inicio(self):
        respuesta = self._crear(hora_inicio='08:10', hora_fin='07:30')
        self.assertEqual(400, respuesta.status_code)

    def test_hora_fin_igual_a_la_de_inicio(self):
        self.assertEqual(400, self._crear(hora_inicio='08:10', hora_fin='08:10').status_code)

    def test_editar(self):
        id_modulo = self._crear().json()['id_modulo']
        respuesta = self._patch(
            '%s%d/' % (self.url, id_modulo), {'nombre': 'Módulo A'},
        )
        self.assertEqual(200, respuesta.status_code)
        self.assertEqual('Módulo A', Modulos.objects.get(pk=id_modulo).nombre)

    def test_eliminar_sin_uso(self):
        id_modulo = self._crear().json()['id_modulo']
        self.assertEqual(204, self._delete('%s%d/' % (self.url, id_modulo)).status_code)
        self.assertFalse(Modulos.objects.filter(pk=id_modulo).exists())

    def test_eliminar_en_uso_responde_400_no_500(self):
        """`horarios.id_modulo` es RESTRICT: sin guarda, esto daba HTTP 500."""
        id_modulo = self._crear().json()['id_modulo']
        cm = self._curso_materia()
        Horario.objects.create(
            id_curso_materia=cm, id_modulo_id=id_modulo,
            dia_semana='Lunes', aula='Aula 1',
        )

        respuesta = self._delete('%s%d/' % (self.url, id_modulo))
        self.assertEqual(400, respuesta.status_code)
        self.assertIn('No se puede eliminar', str(respuesta.json()))
        self.assertTrue(Modulos.objects.filter(pk=id_modulo).exists())

    def _curso_materia(self):
        ciclo = CicloLectivo.objects.create(anio=2041, estado=True)
        curso = Curso.objects.create(
            nombre_curso='1°1', id_ciclo=ciclo, estado=True, activo=True,
        )
        materia = Materia.objects.create(nombre_materia='Matemática', estado=True)
        return CursoMateria.objects.create(
            id_curso=curso, id_materia=materia, estado=True, activo=True,
        )

    def test_escritura_solo_admin_director(self):
        self.assertEqual(403, self._crear(self.preceptor).status_code)
        self.assertEqual(403, self._create_como(self.docente))
        self.assertEqual(201, self._crear(self.director).status_code)

    def _create_como(self, usuario):
        return self._post(
            self.url,
            {'nombre': 'X', 'hora_inicio': '07:30', 'hora_fin': '08:10'},
            usuario,
        ).status_code


# ---------------------------------------------------------------------------
# Períodos de evaluación
# ---------------------------------------------------------------------------

class PeriodoEvaluacionTests(BaseConfiguracionTests):
    url = '/api/periodos/'

    def _crear(self, usuario=None, **extra):
        payload = {'nombre_periodo': '1er Cuatrimestre', 'orden_periodo': 1}
        payload.update(extra)
        return self._post(self.url, payload, usuario or self.admin)

    def test_listar(self):
        self._crear()
        self.assertEqual(200, self._get(self.url).status_code)
        self.assertEqual(1, len(self._get(self.url).json()))

    def test_crear(self):
        respuesta = self._crear()
        self.assertEqual(201, respuesta.status_code)
        self.assertTrue(PeriodoEvaluacion.objects.filter(orden_periodo=1).exists())

    def test_nombre_obligatorio(self):
        respuesta = self._post(
            self.url, {'nombre_periodo': '', 'orden_periodo': 3}, self.admin,
        )
        self.assertEqual(400, respuesta.status_code)

    def test_orden_obligatorio(self):
        respuesta = self._post(
            self.url, {'nombre_periodo': 'Sin orden'}, self.admin,
        )
        self.assertEqual(400, respuesta.status_code)

    def test_orden_positivo(self):
        for orden in (0, -1, -10):
            self.assertEqual(
                400, self._crear(orden_periodo=orden).status_code,
                'El orden %r debería ser rechazado' % orden,
            )

    def test_orden_unico_entre_activos(self):
        self._crear(orden_periodo=1)
        respuesta = self._crear(nombre_periodo='Otro', orden_periodo=1)
        self.assertEqual(400, respuesta.status_code)

    def test_editar(self):
        id_periodo = self._crear().json()['id_periodo']
        respuesta = self._patch(
            '%s%d/' % (self.url, id_periodo), {'nombre_periodo': 'Primer cuatrimestre'},
        )
        self.assertEqual(200, respuesta.status_code)
        self.assertEqual(
            'Primer cuatrimestre',
            PeriodoEvaluacion.objects.get(pk=id_periodo).nombre_periodo,
        )

    def test_desactivar_es_borrado_logico(self):
        id_periodo = self._crear().json()['id_periodo']
        self.assertEqual(204, self._delete('%s%d/' % (self.url, id_periodo)).status_code)
        periodo = PeriodoEvaluacion.all_objects.get(pk=id_periodo)
        self.assertFalse(periodo.estado)
        self.assertIsNotNone(periodo.fecha_eliminacion)

    def test_incluir_inactivos_y_reactivar(self):
        id_periodo = self._crear().json()['id_periodo']
        self._delete('%s%d/' % (self.url, id_periodo))

        respuesta = self._get(self.url, {'incluir_inactivos': 'true'})
        self.assertEqual([id_periodo], [p['id_periodo'] for p in respuesta.json()])

        r = self._patch('%s%d/' % (self.url, id_periodo), {'estado': True})
        self.assertEqual(200, r.status_code)
        self.assertTrue(PeriodoEvaluacion.all_objects.get(pk=id_periodo).estado)

    def test_desactivar_con_calificaciones_responde_400(self):
        from escuela.models import Alumno, Docente

        id_periodo = self._crear().json()['id_periodo']
        ciclo = CicloLectivo.objects.create(anio=2042, estado=True)
        curso = Curso.objects.create(
            nombre_curso='1°1', id_ciclo=ciclo, estado=True, activo=True,
        )
        materia = Materia.objects.create(nombre_materia='Física', estado=True)
        cm = CursoMateria.objects.create(
            id_curso=curso, id_materia=materia, estado=True, activo=True,
        )
        alumno = Alumno.objects.create(dni='40.000.001', nombre='A', apellido='B', estado=True)
        docente = Docente.objects.create(dni='40.000.002', nombre='C', apellido='D', estado=True)
        Calificacion.objects.create(
            id_alumno=alumno, id_curso_materia=cm, id_docente=docente,
            id_periodo_id=id_periodo, nota_numerica=8,
        )

        respuesta = self._delete('%s%d/' % (self.url, id_periodo))
        self.assertEqual(400, respuesta.status_code)
        self.assertIn('No se puede desactivar', str(respuesta.json()))

    def test_escritura_solo_admin_director(self):
        self.assertEqual(403, self._crear(self.preceptor).status_code)
        self.assertEqual(201, self._crear(self.director).status_code)


# ---------------------------------------------------------------------------
# Estados de asistencia
# ---------------------------------------------------------------------------

class EstadoAsistenciaTests(BaseConfiguracionTests):
    url = '/api/estados-asistencia/'

    def test_el_seed_base_crea_los_cinco_estados(self):
        self.assertEqual([], self._get(self.url).json())

        creados = seed_estados_asistencia_base()

        self.assertEqual(sorted(ESTADOS_ASISTENCIA_BASE), sorted(creados))
        self.assertEqual(
            sorted(ESTADOS_ASISTENCIA_BASE),
            sorted(e.nombre_estado for e in EstadoAsistencia.objects.all()),
        )

    def test_el_seed_base_es_idempotente(self):
        seed_estados_asistencia_base()
        self.assertEqual(5, EstadoAsistencia.objects.count())

        # Segunda y tercera corrida: no duplica nada.
        self.assertEqual([], seed_estados_asistencia_base())
        self.assertEqual([], seed_estados_asistencia_base())
        self.assertEqual(5, EstadoAsistencia.objects.count())

    def test_el_comando_de_seed_es_idempotente(self):
        from io import StringIO

        salida = StringIO()
        call_command('seed_estados_asistencia', stdout=salida)
        self.assertEqual(5, EstadoAsistencia.objects.count())

        salida2 = StringIO()
        call_command('seed_estados_asistencia', stdout=salida2)
        self.assertEqual(5, EstadoAsistencia.objects.count())
        self.assertIn('ya existían todos', salida2.getvalue())

    def test_la_migracion_declara_el_seed(self):
        """El seed no puede quedar solo como comando manual."""
        import importlib
        import inspect

        import escuela.migrations as pkg

        modulo = importlib.import_module(
            '%s.0008_seed_estados_asistencia' % pkg.__name__,
        )
        fuente = inspect.getsource(modulo)
        self.assertIn('seed_estados_asistencia_base', fuente)

    def test_es_estado_asistencia_base(self):
        self.assertTrue(es_estado_asistencia_base('Presente'))
        self.assertTrue(es_estado_asistencia_base('Justificado'))
        self.assertFalse(es_estado_asistencia_base('Otro estado'))
        self.assertFalse(es_estado_asistencia_base(None))

    def test_listar(self):
        self._post(self.url, {'nombre_estado': 'Presente'}, self.admin)
        self.assertEqual(200, self._get(self.url).status_code)
        self.assertEqual(1, len(self._get(self.url).json()))

    def test_crear(self):
        respuesta = self._post(self.url, {'nombre_estado': 'Presente'}, self.admin)
        self.assertEqual(201, respuesta.status_code)
        self.assertEqual('Presente', respuesta.json()['nombre_estado'])

    def test_marca_los_estados_base(self):
        r = self._post(self.url, {'nombre_estado': 'Presente'}, self.admin)
        self.assertTrue(r.json()['es_base'])

        r2 = self._post(self.url, {'nombre_estado': 'Otro'}, self.admin)
        self.assertFalse(r2.json()['es_base'])

    def test_nombre_obligatorio(self):
        self.assertEqual(
            400, self._post(self.url, {'nombre_estado': '  '}, self.admin).status_code,
        )

    def test_nombre_duplicado(self):
        self._post(self.url, {'nombre_estado': 'Presente'}, self.admin)
        self.assertEqual(
            400,
            self._post(self.url, {'nombre_estado': 'presente'}, self.admin).status_code,
        )

    def test_editar(self):
        id_estado = self._post(
            self.url, {'nombre_estado': 'Otro'}, self.admin,
        ).json()['id_estado_asistencia']

        respuesta = self._patch(
            '%s%d/' % (self.url, id_estado), {'nombre_estado': 'Otro nombre'},
        )
        self.assertEqual(200, respuesta.status_code)
        self.assertEqual('Otro nombre', EstadoAsistencia.objects.get(pk=id_estado).nombre_estado)

    def test_no_se_puede_editar_un_estado_base_a_otro_nombre(self):
        """Renombrar 'Presente' rompería la lógica de asistencia cableada."""
        id_estado = EstadoAsistencia.objects.create(nombre_estado='Presente').pk
        respuesta = self._patch(
            '%s%d/' % (self.url, id_estado), {'nombre_estado': 'presente_old'},
        )
        self.assertEqual(400, respuesta.status_code)
        self.assertEqual(
            'Presente', EstadoAsistencia.objects.get(pk=id_estado).nombre_estado,
        )

    def test_no_se_puede_eliminar_un_estado_base(self):
        for nombre in ESTADOS_ASISTENCIA_BASE:
            id_estado = EstadoAsistencia.objects.create(nombre_estado=nombre).pk
            respuesta = self._delete('%s%d/' % (self.url, id_estado))
            self.assertEqual(
                400, respuesta.status_code,
                'El estado base %r no debería poder eliminarse' % nombre,
            )
            self.assertTrue(EstadoAsistencia.objects.filter(pk=id_estado).exists())

    def test_eliminar_sin_uso(self):
        id_estado = self._post(
            self.url, {'nombre_estado': 'Otro'}, self.admin,
        ).json()['id_estado_asistencia']
        self.assertEqual(204, self._delete('%s%d/' % (self.url, id_estado)).status_code)
        self.assertFalse(EstadoAsistencia.objects.filter(pk=id_estado).exists())

    def test_eliminar_en_uso_responde_400_no_500(self):
        from escuela.models import Alumno

        id_estado = EstadoAsistencia.objects.create(nombre_estado='Otro').pk
        ciclo = CicloLectivo.objects.create(anio=2043, estado=True)
        curso = Curso.objects.create(
            nombre_curso='1°1', id_ciclo=ciclo, estado=True, activo=True,
        )
        materia = Materia.objects.create(nombre_materia='Química', estado=True)
        cm = CursoMateria.objects.create(
            id_curso=curso, id_materia=materia, estado=True, activo=True,
        )
        alumno = Alumno.objects.create(dni='41.000.001', nombre='A', apellido='B', estado=True)
        usuario = Usuario.objects.create(usuario='asis_user', contrasena='x')
        Asistencia.objects.create(
            id_alumno=alumno, id_curso_materia=cm, id_usuario=usuario,
            id_estado_asistencia_id=id_estado, fecha=date(2026, 5, 1),
            hora=time(8, 0),
        )

        respuesta = self._delete('%s%d/' % (self.url, id_estado))
        self.assertEqual(400, respuesta.status_code)
        self.assertIn('No se puede eliminar', str(respuesta.json()))

    def test_escritura_solo_admin_director(self):
        self.assertEqual(
            403,
            self._post(self.url, {'nombre_estado': 'X'}, self.preceptor).status_code,
        )
        self.assertEqual(
            201,
            self._post(self.url, {'nombre_estado': 'X'}, self.director).status_code,
        )

    def test_lectura_sigue_abierta_a_autenticados(self):
        EstadoAsistencia.objects.create(nombre_estado='Presente')
        for usuario in (self.admin, self.preceptor, self.docente):
            self.assertEqual(200, self._get(self.url, usuario=usuario).status_code)


# ---------------------------------------------------------------------------
# Tipos de acta
# ---------------------------------------------------------------------------

class TipoActaTests(BaseConfiguracionTests):
    url = '/api/tipos-acta/'

    def test_listar(self):
        self._post(self.url, {'nombre_tipo': 'Acta de evaluación'}, self.admin)
        self.assertEqual(200, self._get(self.url).status_code)
        self.assertEqual(1, len(self._get(self.url).json()))

    def test_crear(self):
        respuesta = self._post(self.url, {'nombre_tipo': 'Acta de evaluación'}, self.admin)
        self.assertEqual(201, respuesta.status_code)
        self.assertTrue(TipoActa.objects.filter(nombre_tipo='Acta de evaluación').exists())

    def test_nombre_obligatorio(self):
        self.assertEqual(
            400, self._post(self.url, {'nombre_tipo': ''}, self.admin).status_code,
        )

    def test_nombre_duplicado(self):
        self._post(self.url, {'nombre_tipo': 'Acta'}, self.admin)
        self.assertEqual(
            400, self._post(self.url, {'nombre_tipo': 'acta'}, self.admin).status_code,
        )

    def test_editar(self):
        id_tipo = self._post(
            self.url, {'nombre_tipo': 'Acta'}, self.admin,
        ).json()['id_tipo_acta']
        respuesta = self._patch(
            '%s%d/' % (self.url, id_tipo), {'nombre_tipo': 'Acta de reunión'},
        )
        self.assertEqual(200, respuesta.status_code)
        self.assertEqual(
            'Acta de reunión', TipoActa.objects.get(pk=id_tipo).nombre_tipo,
        )

    def test_eliminar_sin_uso(self):
        id_tipo = self._post(
            self.url, {'nombre_tipo': 'Acta'}, self.admin,
        ).json()['id_tipo_acta']
        self.assertEqual(204, self._delete('%s%d/' % (self.url, id_tipo)).status_code)
        self.assertFalse(TipoActa.objects.filter(pk=id_tipo).exists())

    def test_eliminar_en_uso_responde_400_no_500(self):
        id_tipo = TipoActa.objects.create(nombre_tipo='Acta de evaluación').pk
        usuario = Usuario.objects.create(usuario='acta_user', contrasena='x')
        Acta.objects.create(
            titulo='Acta 1', fecha=timezone.make_aware(datetime(2026, 5, 1, 10, 0)),
            id_tipo_acta_id=id_tipo, id_usuario_creador=usuario,
        )

        respuesta = self._delete('%s%d/' % (self.url, id_tipo))
        self.assertEqual(400, respuesta.status_code)
        self.assertIn('No se puede eliminar', str(respuesta.json()))

    def test_escritura_solo_admin_director(self):
        self.assertEqual(
            403, self._post(self.url, {'nombre_tipo': 'X'}, self.preceptor).status_code,
        )
        self.assertEqual(
            201, self._post(self.url, {'nombre_tipo': 'X'}, self.director).status_code,
        )

class ActivarOCrearTests(BaseConfiguracionTests):
    """Regresión del `TypeError` al crear cursos vía API.

    `escuela.utils.activar_o_crear` es la dueña del flag `activo`, pero lo
    splateaba ciegamente dentro de `objects.create(**lookup, **defaults,
    activo=True)`. Como `activo` es un campo escribible del
    `CursoSerializer`, un cliente que mandara `"activo": true` en el cuerpo
    hacía que `defaults` ya trajera `activo` y el `create()` explotasera con
    `TypeError: got multiple values for keyword argument 'activo'`, es decir un
    HTTP 500 en el alta de cursos.

    Se incluye acá porque el flujo verificado de Configuración (crear ciclo →
    crear curso que lo usa) es justamente lo que lo disparaba.
    """

    def setUp(self):
        super().setUp()

    def _ciclo(self, anio):
        return CicloLectivo.objects.create(anio=anio, estado=True)

    def test_crear_curso_con_activo_en_el_cuerpo_no_tira_500(self):
        ciclo = self._ciclo(2030)
        respuesta = self._post('/api/cursos/', {
            'nombre_curso': '2°A',
            'id_ciclo': ciclo.id_ciclo,
            'activo': True,
        }, self.admin)
        self.assertEqual(
            201, respuesta.status_code,
            'Mandar `activo` en el cuerpo no debe romper el alta: %s' % respuesta.content,
        )
        self.assertTrue(Curso.all_objects.get(nombre_curso='2°A').activo)

    def test_activo_en_el_cuerpo_no_revive_un_curso_inactivo(self):
        """`activo` del cuerpo no puede contradecir la regla de reactivación.

        `activar_o_crear` reactiva un registro dado de baja si existe; el
        `activo` del cuerpo se descarta, así que el resultado es siempre
        `activo=True`. Lo que se verifica es que no se crea un duplicado.
        """
        ciclo = self._ciclo(2031)
        curso = Curso.objects.create(
            nombre_curso='3°A', id_ciclo=ciclo, activo=False, estado=True,
        )
        from escuela.utils import activar_o_crear

        instancia, reactivado = activar_o_crear(
            Curso,
            {'nombre_curso': '3°A', 'id_ciclo': ciclo},
            {'activo': False, 'orientacion': 'Ciencias'},
        )
        self.assertTrue(reactivado)
        self.assertEqual(curso.id_curso, instancia.id_curso)
        instancia.refresh_from_db()
        self.assertTrue(instancia.activo)
        self.assertEqual(1, Curso.all_objects.filter(nombre_curso='3°A').count())

    def test_crear_modulo_no_necesita_activo(self):
        """Control: el camino normal de Configuración nunca manda `activo`."""
        respuesta = self._post('/api/modulos/', {
            'nombre': '07:30-08:10', 'hora_inicio': '07:30', 'hora_fin': '08:10',
        }, self.admin)
        self.assertEqual(201, respuesta.status_code)
