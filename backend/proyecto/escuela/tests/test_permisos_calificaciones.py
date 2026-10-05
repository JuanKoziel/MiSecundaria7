"""Permisos de escritura y de lectura de calificaciones y asistencias.

Cubre cuatro regresiones:

* ``CalificacionViewSet`` y ``AsistenciaViewSet`` no tenian ``perform_create``:
  el alta individual se saltaba la pertenencia del docente a la materia (y, en
  asistencias, el dia suspendido y el bloqueo de carga). El codigo de
  calificaciones quedo dead code despues del ``return`` del ``batch``.
* ``get_queryset`` de ambos viewsets no aplicaba ``alumnos_permitidos``, asi que
  cualquier usuario autenticado (incluido un alumno) listaba las notas y
  asistencias de todo el colegio.
* ``quitar_rol`` no miraba que rol se quitaba: un preceptor podia dejar sin rol
  admin/director a cualquier persona con dos o mas roles.

Nunca escribe en la base real: el runner ``escuela.test_runner
.EscuelaDiscoverRunner`` crea ``test_<base>`` y le replica solo la estructura.
"""

from datetime import date, time

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from escuela.models import (
    Alumno,
    Asistencia,
    Calificacion,
    Curso,
    CursoMateria,
    Docente,
    EstadoAsistencia,
    Horario,
    Materia,
    Modulos,
    PeriodoEvaluacion,
    Rol,
    Usuario,
    UsuarioRol,
)
from escuela.views import _dia_semana_es

FECHA = date(2026, 3, 11)  # miércoles, sin eventos institucionales


class BaseAlcance(TestCase):
    """Usuarios, cursos y materias mínimas para montar el escenario."""

    def setUp(self):
        materia, _ = Materia.objects.get_or_create(nombre_materia='Matemática')
        self.materia = materia
        self.curso1, _ = Curso.objects.get_or_create(nombre_curso='1°1')
        self.curso2, _ = Curso.objects.get_or_create(nombre_curso='2°1')

        # El vínculo con `usuarios` es lo que resuelve `alumnos_permitidos` y
        # `_verificar_docente_activo_materia`: sin él, ambos ven "nada".
        self.usuario_docente1 = self._usuario('docente1', ['docente'])
        self.usuario_docente2 = self._usuario('docente2', ['docente'])
        self.usuario_alumno1 = self._usuario('alumno1', ['alumno'])

        self.docente_propio = self._docente('docente1', 'Uno', 'Docente', self.usuario_docente1)
        self.docente_ajeno = self._docente('docente2', 'Dos', 'Docente', self.usuario_docente2)

        self.cm_propio = CursoMateria.objects.create(
            id_curso=self.curso1, id_materia=materia, id_docente=self.docente_propio,
        )
        self.cm_ajeno = CursoMateria.objects.create(
            id_curso=self.curso2, id_materia=materia, id_docente=self.docente_ajeno,
        )

        self.periodo, _ = PeriodoEvaluacion.objects.get_or_create(
            nombre_periodo='Primer trimestre',
        )
        self.estado, _ = EstadoAsistencia.objects.get_or_create(
            nombre_estado='Presente',
        )

        self.alumno1 = self._alumno('30000001', 'Alumno', 'Uno', self.curso1, self.usuario_alumno1)
        self.alumno2 = self._alumno('30000002', 'Alumno', 'Dos', self.curso2)

    # -- helpers ------------------------------------------------------------

    def _rol(self, nombre):
        rol, _ = Rol.objects.get_or_create(nombre_rol=nombre)
        return rol

    def _usuario(self, nombre, roles=()):
        django_user, _ = User.objects.get_or_create(
            username=nombre, defaults={'is_active': True},
        )
        usuario, _ = Usuario.objects.get_or_create(
            usuario=nombre, defaults={'contrasena': 'x', 'estado': True},
        )
        for nombre_rol in roles:
            UsuarioRol.objects.get_or_create(id_usuario=usuario, id_rol=self._rol(nombre_rol))
        return usuario

    def _docente(self, dni, nombre, apellido, usuario):
        docente, _ = Docente.objects.get_or_create(
            dni=dni,
            defaults={
                'nombre': nombre, 'apellido': apellido, 'id_usuario': usuario,
            },
        )
        return docente

    def _alumno(self, dni, nombre, apellido, curso, usuario=None):
        alumno, _ = Alumno.objects.get_or_create(
            dni=dni,
            defaults={
                'nombre': nombre, 'apellido': apellido,
                'id_curso': curso, 'id_usuario': usuario,
            },
        )
        return alumno

    def _cliente(self, nombre):
        cliente = APIClient(raise_request_exception=True)
        django_user = User.objects.get(username=nombre)
        token = RefreshToken.for_user(django_user).access_token
        cliente.credentials(HTTP_AUTHORIZATION='Bearer ' + str(token))
        return cliente

    def _payload_calificacion(self, alumno, cm, docente):
        return {
            'id_alumno': alumno.id_alumno,
            'id_curso_materia': cm.id_curso_materia,
            'id_docente': docente.id_docente,
            'id_periodo': self.periodo.id_periodo,
            'nota_numerica': '8.00',
        }

    def _payload_asistencia(self, alumno, cm, usuario):
        return {
            'id_alumno': alumno.id_alumno,
            'id_curso_materia': cm.id_curso_materia,
            'id_usuario': usuario.id_usuario,
            'id_estado_asistencia': self.estado.id_estado_asistencia,
            'fecha': FECHA.isoformat(),
            'hora': '09:00:00',
        }


class AltaDeCalificacionesTests(BaseAlcance):
    """El alta individual tiene que validar lo mismo que el `batch`."""

    def test_docente_carga_en_su_materia(self):
        r = self._cliente('docente1').post(
            '/api/calificaciones/',
            self._payload_calificacion(self.alumno1, self.cm_propio, self.docente_propio),
            format='json',
        )
        self.assertEqual(r.status_code, 201, r.data)
        self.assertTrue(Calificacion.objects.filter(id_alumno=self.alumno1).exists())

    def test_docente_no_carga_en_materia_ajena(self):
        r = self._cliente('docente1').post(
            '/api/calificaciones/',
            self._payload_calificacion(self.alumno2, self.cm_ajeno, self.docente_ajeno),
            format='json',
        )
        self.assertEqual(r.status_code, 403, r.data)
        self.assertFalse(Calificacion.objects.filter(id_alumno=self.alumno2).exists())

    def test_alumno_no_carga_calificaciones(self):
        r = self._cliente('alumno1').post(
            '/api/calificaciones/',
            self._payload_calificacion(self.alumno1, self.cm_propio, self.docente_propio),
            format='json',
        )
        self.assertEqual(r.status_code, 403, r.data)
        self.assertFalse(Calificacion.objects.exists())


class AltaDeAsistenciasTests(BaseAlcance):
    """El alta tiene que aplicar día suspendido, bloqueo y docente activo.

    `AsistenciaViewSet.create` exige estar en horario (o con ventana de carga
    otorgada), así que el escenario arma un módulo de 00:00 a 23:59 para hoy.
    """

    def setUp(self):
        super().setUp()
        self.hoy = timezone.localdate()
        modulo, _ = Modulos.objects.get_or_create(
            nombre='Todo el día', defaults={'hora_inicio': time(0, 0), 'hora_fin': time(23, 59)},
        )
        dia = _dia_semana_es(timezone.localtime())
        for cm in (self.cm_propio, self.cm_ajeno):
            Horario.objects.get_or_create(
                id_curso_materia=cm, id_modulo=modulo, dia_semana=dia,
            )
        self.fecha_hoy = self.hoy.isoformat()

    def test_docente_registra_en_su_materia(self):
        r = self._cliente('docente1').post(
            '/api/asistencias/',
            self._payload_asistencia(self.alumno1, self.cm_propio, self.usuario_docente1),
            format='json',
        )
        self.assertEqual(r.status_code, 201, getattr(r, 'data', r.content))
        self.assertTrue(Asistencia.objects.filter(id_alumno=self.alumno1).exists())

    def test_docente_no_registra_en_materia_ajena(self):
        r = self._cliente('docente1').post(
            '/api/asistencias/',
            self._payload_asistencia(self.alumno2, self.cm_ajeno, self.usuario_docente1),
            format='json',
        )
        self.assertEqual(r.status_code, 403, getattr(r, 'data', r.content))
        self.assertFalse(Asistencia.objects.exists())

    def test_fecha_invalida_no_revienta(self):
        """La fecha llega como string desde el frontend: no puede dar 500."""
        payload = self._payload_asistencia(
            self.alumno1, self.cm_propio, self.usuario_docente1,
        )
        payload['fecha'] = 'no-es-fecha'
        r = self._cliente('docente1').post('/api/asistencias/', payload, format='json')
        self.assertEqual(r.status_code, 400, getattr(r, 'data', r.content))
        self.assertFalse(Asistencia.objects.exists())

    def test_alumno_no_registra_asistencias(self):
        r = self._cliente('alumno1').post(
            '/api/asistencias/',
            self._payload_asistencia(self.alumno1, self.cm_propio, self.usuario_docente1),
            format='json',
        )
        self.assertEqual(r.status_code, 403, getattr(r, 'data', r.content))


class LecturaAcotadaTests(BaseAlcance):
    """Un alumno no puede listar las notas ni las asistencias del colegio."""

    def setUp(self):
        super().setUp()
        self.cal1 = Calificacion.objects.create(
            id_alumno=self.alumno1, id_curso_materia=self.cm_propio,
            id_docente=self.docente_propio, id_periodo=self.periodo, nota_numerica=9,
        )
        self.cal2 = Calificacion.objects.create(
            id_alumno=self.alumno2, id_curso_materia=self.cm_ajeno,
            id_docente=self.docente_ajeno, id_periodo=self.periodo, nota_numerica=4,
        )
        self.as1 = Asistencia.objects.create(
            id_alumno=self.alumno1, id_curso_materia=self.cm_propio,
            id_usuario=self.usuario_docente1, id_estado_asistencia=self.estado,
            fecha=FECHA, hora='09:00',
        )
        self.as2 = Asistencia.objects.create(
            id_alumno=self.alumno2, id_curso_materia=self.cm_ajeno,
            id_usuario=self.usuario_docente2, id_estado_asistencia=self.estado,
            fecha=FECHA, hora='09:00',
        )

    def test_alumno_solo_ve_sus_calificaciones(self):
        r = self._cliente('alumno1').get('/api/calificaciones/')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual({c['id_alumno'] for c in r.data}, {self.alumno1.id_alumno})

    def test_alumno_solo_ve_sus_asistencias(self):
        r = self._cliente('alumno1').get('/api/asistencias/')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual({a['id_alumno'] for a in r.data}, {self.alumno1.id_alumno})

    def test_docente_ve_las_sus_materias(self):
        """El docente sí conserva la lectura de los cursos donde da clases."""
        r = self._cliente('docente1').get('/api/calificaciones/')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual({c['id_calificacion'] for c in r.data}, {self.cal1.id_calificacion})

    def test_admin_ve_todo(self):
        self._usuario('jefe_admin', ['admin'])
        r = self._cliente('jefe_admin').get('/api/calificaciones/')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(len(r.data), 2)


class QuitarRolTests(TestCase):
    """Quitar un rol nunca puede dar a alguien más alcance del que tiene."""

    def setUp(self):
        self._usuario('admin1', ['admin', 'preceptor'])
        self._usuario('jefe1', ['jefe_preceptores'])
        self._usuario('director1', ['director'])
        self.objetivo = self._usuario('objetivo', ['admin', 'preceptor'])
        self.rol_admin = self._rol('admin')
        self.rol_preceptor = self._rol('preceptor')

    def _rol(self, nombre):
        rol, _ = Rol.objects.get_or_create(nombre_rol=nombre)
        return rol

    def _usuario(self, nombre, roles=()):
        django_user, _ = User.objects.get_or_create(
            username=nombre, defaults={'is_active': True},
        )
        usuario, _ = Usuario.objects.get_or_create(
            usuario=nombre, defaults={'contrasena': 'x', 'estado': True},
        )
        for nombre_rol in roles:
            UsuarioRol.objects.get_or_create(id_usuario=usuario, id_rol=self._rol(nombre_rol))
        return usuario

    def _quitar(self, nombre_usuario, nombre_rol):
        cliente = APIClient(raise_request_exception=True)
        django_user = User.objects.get(username=nombre_usuario)
        token = RefreshToken.for_user(django_user).access_token
        cliente.credentials(HTTP_AUTHORIZATION='Bearer ' + str(token))
        return cliente.post(
            '/api/usuarios/quitar-rol/',
            {'id_usuario': self.objetivo.id_usuario, 'nombre_rol': nombre_rol},
            format='json',
        )

    def _tiene(self, rol):
        return UsuarioRol.objects.filter(id_usuario=self.objetivo, id_rol=rol).exists()

    def test_admin_no_puede_quitar_admin(self):
        r = self._quitar('admin1', 'admin')
        self.assertEqual(r.status_code, 403, r.data)
        self.assertTrue(self._tiene(self.rol_admin))

    def test_jefe_no_puede_quitar_admin(self):
        r = self._quitar('jefe1', 'admin')
        self.assertEqual(r.status_code, 403, r.data)
        self.assertTrue(self._tiene(self.rol_admin))

    def test_director_puede_quitar_admin(self):
        r = self._quitar('director1', 'admin')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertFalse(self._tiene(self.rol_admin))
        self.assertTrue(self._tiene(self.rol_preceptor))

    def test_jefe_puede_quitar_preceptor(self):
        """Flujo real del panel Jefes: dar de baja el rol preceptor."""
        r = self._quitar('jefe1', 'preceptor')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertFalse(self._tiene(self.rol_preceptor))
        self.assertTrue(self._tiene(self.rol_admin))

    def test_docente_no_puede_quitar_ningun_rol(self):
        self._usuario('docente_r', ['docente'])
        r = self._quitar('docente_r', 'preceptor')
        self.assertEqual(r.status_code, 403, r.data)