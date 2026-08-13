"""Verificación de persistencia/rollback/limpieza contra la base MySQL real.

Escenario 14 del plan: verificar con datos FICTICIOS (marcadores únicos)
que el flujo académico del boletín persiste correctamente en la base real
y que, al hacer ROLLBACK, no queda NINGÚN registro ficticio.

SEGURIDAD:
- Todo corre dentro de una única transacción (transaction.atomic).
- Al final se fuerza `set_rollback(True)`: no se escribe nada definitivo.
- Después del rollback se comprueba por SQL directo que los marcadores
  ficticios ya no existen en ninguna tabla involucrada.

USO:
    python manage.py verificar_boletin_mysql
"""

from datetime import time

from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.utils import timezone

from escuela.academico import (
    consolidar_historial_alumno,
    detectar_superposiciones_y_bloqueos,
)
from escuela.models import (
    ActividadMateriaAdeudada,
    Alumno,
    Calificacion,
    CicloLectivo,
    Curso,
    CursoMateria,
    Docente,
    HistorialAcademico,
    MateriaAdeudada,
    Modulos,
    PeriodoEvaluacion,
    RecursadaMateria,
    ResultadoActividadAdeudada,
    Rol,
    Usuario,
    UsuarioRol,
)

APELLIDO_MARCA = 'FICTICIO_E2E'
MATERIA_PREFIJO = 'E2E-'


def _dni_libre(prefijo):
    n = 0
    while True:
        dni = f'{prefijo}{n:03d}'
        if not Alumno.objects.filter(dni=dni).exists():
            return dni
        n += 1


def _filas(tabla, where, params):
    with connection.cursor() as cur:
        cur.execute(f'SELECT COUNT(*) FROM `{tabla}` WHERE {where}', params)
        return cur.fetchone()[0]


class Command(BaseCommand):
    help = 'Verifica persistencia, rollback y limpieza en MySQL real con datos ficticios.'

    def handle(self, *args, **options):
        out = self.stdout.write
        anio = 2100
        prefijo_dni = '98800'
        curso_nombre = 'E2E-CURSO'
        nombres_materia = [
            f'{MATERIA_PREFIJO}Matematica',
            f'{MATERIA_PREFIJO}Lengua',
            f'{MATERIA_PREFIJO}Historia',
        ]
        usuario_admin = 'e2e_admin_test'

        out('=' * 72)
        out('Verificación en MySQL real (sistema_escolar) con ROLLBACK final')
        out(f'  Anio lectivo de prueba: {anio}  |  Marcador: {APELLIDO_MARCA}')
        out('=' * 72)

        try:
            with transaction.atomic():
                out('\n[1/5] Creando datos ficticios dentro de la transacción...')

                ciclo = CicloLectivo.objects.create(anio=anio)
                curso = Curso.objects.create(
                    nombre_curso=curso_nombre, id_ciclo=ciclo, activo=True,
                )
                curso_id = curso.id_curso

                doc = Docente.objects.create(
                    nombre='Docente', apellido=APELLIDO_MARCA, dni=_dni_libre(prefijo_dni),
                )

                cms = {}
                for n in nombres_materia:
                    from escuela.models import Materia
                    materia = Materia.objects.create(nombre_materia=n)
                    cm = CursoMateria.objects.create(
                        id_curso=curso, id_materia=materia, id_docente=doc, activo=True,
                    )
                    cms[n] = (materia, cm)

                alumno = Alumno.objects.create(
                    nombre='Lucas', apellido=APELLIDO_MARCA,
                    dni=_dni_libre(prefijo_dni), id_curso=curso,
                )
                alumno_id = alumno.id_alumno

                periodos = PeriodoEvaluacion.objects.filter(estado=True).order_by('orden_periodo')
                p1 = periodos.filter(orden_periodo=1).first()
                p2 = periodos.filter(orden_periodo=2).first()
                if p1 is None or p2 is None:
                    raise RuntimeError('No hay periodos de evaluacion activos (1 y 2) en la base real.')

                materias_names = list(cms)
                for n in materias_names[:2]:  # dos materias desaprobadas
                    _, cm = cms[n]
                    Calificacion.objects.create(
                        id_alumno=alumno, id_curso_materia=cm, id_docente=doc,
                        id_periodo=p1, nota_numerica=4,
                    )
                    Calificacion.objects.create(
                        id_alumno=alumno, id_curso_materia=cm, id_docente=doc,
                        id_periodo=p2, nota_numerica=4,
                    )
                _, cm_aprobada = cms[materias_names[2]]  # una materia aprobada
                Calificacion.objects.create(
                    id_alumno=alumno, id_curso_materia=cm_aprobada, id_docente=doc,
                    id_periodo=p1, nota_numerica=8,
                )
                Calificacion.objects.create(
                    id_alumno=alumno, id_curso_materia=cm_aprobada, id_docente=doc,
                    id_periodo=p2, nota_numerica=9,
                )

                out(f'    Alumno {alumno_id} / curso {curso_id} / docentes/materias creados.')

                out('[2/5] Ejecutando lógica académica real (cierre por alumno)...')
                consolidar_historial_alumno(alumno, anio)

                out('[3/5] Verificación de PERSISTENCIA por SQL directo...')
                checks = [
                    ('alumnos', f"id_alumno={alumno_id} AND apellido='{APELLIDO_MARCA}'", 1),
                    ('cursos', f'id_curso={curso_id} AND nombre_curso=%s', 1, (curso_nombre,)),
                    ('calificaciones', 'id_alumno=%s', 6, (alumno_id,)),
                    ('historial_academico', 'id_alumno=%s', 3, (alumno_id,)),
                    ('materias_adeudadas', "id_alumno=%s AND tipo_deuda='PREVIA' AND estado='ADEUDADA'", 2, (alumno_id,)),
                    ('historial_cursos_alumno', 'id_alumno=%s', 0, (alumno_id,)),
                ]
                ok_persistencia = True
                for tabla, where, esperado, params in [
                    c if len(c) == 4 else (c[0], c[1], c[2], ())
                    for c in checks
                ]:
                    total = _filas(tabla, where, params)
                    estado = 'OK' if total == esperado else 'DIFERENTE'
                    if total != esperado:
                        ok_persistencia = False
                    out(f'    {estado}: {tabla} = {total} (esperado {esperado})')

                if not ok_persistencia:
                    raise RuntimeError('La persistencia por SQL no coincide con lo esperado.')

                out('[4/5] Endpoint real /api/boletin-academico/...')
                from django.contrib.auth.models import User as DjangoUser
                from rest_framework.test import APIClient
                from rest_framework_simplejwt.tokens import RefreshToken

                from escuela.auth_backend import make_password

                rol_admin, rol_creado = Rol.objects.get_or_create(nombre_rol='admin')
                usr = Usuario.objects.create(
                    usuario=usuario_admin, contrasena=make_password('x'), estado=True,
                )
                UsuarioRol.objects.create(id_usuario=usr, id_rol=rol_admin)
                duser, _ = DjangoUser.objects.get_or_create(username=usuario_admin)
                token = str(RefreshToken.for_user(duser).access_token)

                client = APIClient()
                client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}', HTTP_HOST='localhost')
                resp = client.get(f'/api/boletin-academico/{alumno_id}/')
                if resp.status_code != 200:
                    raise RuntimeError(f'boletin endpoint devolvio {resp.status_code}: {resp.content[:200]}')
                data = resp.json()
                if len(data['previas']) != 2:
                    raise RuntimeError(f'Boletin: se esperaban 2 previas, llego {len(data["previas"])}')
                if len(data['recursadas']) != 0 or len(data['intensificaciones_1c']) != 0:
                    raise RuntimeError('Boletin: no deberia haber recursadas ni intensificaciones 1C.')
                out('    Boletín OK: 2 previas, 0 recursadas, 0 intensificaciones 1C.')

                out('    Previas del boletín:')
                for p in data['previas']:
                    out(f"      - {p['materia']} | {p['anio']} | {p['periodo']!r} | {p['calificacion']!r}")

                out('    Rendición de previa (endpoint real rendir/)...')
                ma = MateriaAdeudada.objects.get(id_alumno=alumno, id_materia=cms[materias_names[0]][0])
                resp = client.post(
                    f'/api/materias-adeudadas/{ma.id_materia_adeudada}/rendir/',
                    {'nota': 8, 'periodo': 'MARZO', 'anio_rendicion': anio + 1,
                     'id_docente': doc.id_docente},
                    format='json',
                )
                if resp.status_code != 200:
                    raise RuntimeError(f'rendir devolvio {resp.status_code}: {resp.content[:200]}')
                out(f"    Rendir OK: {resp.json()['estado']}")

                out('    Verificación por SQL de la rendición...')
                checks_rend = [
                    ('rendiciones_materias_adeudadas', 'id_alumno=%s', 1, (alumno_id,)),
                    ('registro_rendiciones_previas', 'id_alumno=%s', 1, (alumno_id,)),
                    ('materias_adeudadas', f"id_alumno={alumno_id} AND id_materia=%s AND estado='APROBADA'", 1, (ma.id_materia_id,)),
                ]
                for tabla, where, esperado, params in checks_rend:
                    total = _filas(tabla, where, params)
                    estado = 'OK' if total == esperado else 'DIFERENTE'
                    if total != esperado:
                        ok_persistencia = False
                    out(f'    {estado}: {tabla} = {total} (esperado {esperado})')
                if not ok_persistencia:
                    raise RuntimeError('Persistencia de rendición no coincide.')

                out('    Superposición horaria y bloqueo...')
                mod = Modulos.objects.create(nombre='E2E-M1', hora_inicio=time(8, 0), hora_fin=time(9, 0))
                cm_rec = cms[materias_names[0]][1]
                cm_bloq = cms[materias_names[2]][1]
                RecursadaMateria.objects.create(
                    id_alumno=alumno, id_materia=cms[materias_names[0]][0],
                    id_curso_origen=curso, id_curso_recursada=curso,
                    anio_inicio=anio, estado='ACTIVA', fecha_registro=timezone.now(),
                )
                from escuela.models import Horario
                Horario.objects.create(id_curso_materia=cm_rec, dia_semana='Lunes', id_modulo=mod)
                Horario.objects.create(id_curso_materia=cm_bloq, dia_semana='Lunes', id_modulo=mod)
                detectar_superposiciones_y_bloqueos(alumno, anio)

                checks_bloq = [
                    ('bloqueos_horarios_alumno', 'id_alumno=%s', 1, (alumno_id,)),
                    ('situaciones_materias_alumno', f"id_alumno={alumno_id} AND situacion='BLOQUEADA'", 1),
                ]
                for tabla, where, esperado, params in [
                    c if len(c) == 4 else (c[0], c[1], c[2], ()) for c in checks_bloq
                ]:
                    total = _filas(tabla, where, params)
                    estado = 'OK' if total == esperado else 'DIFERENTE'
                    if total != esperado:
                        ok_persistencia = False
                    out(f'    {estado}: {tabla} = {total} (esperado {esperado})')
                if not ok_persistencia:
                    raise RuntimeError('Persistencia de bloqueo no coincide.')

                resp = client.get(f'/api/boletin-academico/{alumno_id}/')
                bloq = resp.json()['bloqueos_por_materia']
                out(f"    Bloqueo visible en boletín: {list(bloq)}")
                if not any(v.get('bloqueada') for v in bloq.values()):
                    raise RuntimeError('El boletín no refleja la materia bloqueada.')

                out('\n[5/5] ROLLBACK...')
                transaction.set_rollback(True)

        except Exception as exc:  # noqa: BLE001
            out(f'\nERROR: {exc}')
            out('(el bloque atomic() ya descartó la transacción por el error)')

        out('\nVerificación de LIMPIEZA (después del rollback) por SQL directo:')
        limpieza_checks = [
            ('alumnos', "apellido=%s", (APELLIDO_MARCA,)),
            ('cursos', 'nombre_curso=%s', (curso_nombre,)),
            ('curso_materia', "id_curso IN (SELECT id_curso FROM cursos WHERE nombre_curso=%s)", (curso_nombre,)),
            ('docentes', "apellido=%s", (APELLIDO_MARCA,)),
            ('historial_academico', "id_alumno IN (SELECT id_alumno FROM alumnos WHERE apellido=%s)", (APELLIDO_MARCA,)),
            ('materias_adeudadas', "id_alumno IN (SELECT id_alumno FROM alumnos WHERE apellido=%s)", (APELLIDO_MARCA,)),
            ('historial_cursos_alumno', "id_alumno IN (SELECT id_alumno FROM alumnos WHERE apellido=%s)", (APELLIDO_MARCA,)),
            ('recursadas_materias', "id_alumno IN (SELECT id_alumno FROM alumnos WHERE apellido=%s)", (APELLIDO_MARCA,)),
            ('bloqueos_horarios_alumno', "id_alumno IN (SELECT id_alumno FROM alumnos WHERE apellido=%s)", (APELLIDO_MARCA,)),
            ('situaciones_materias_alumno', "id_alumno IN (SELECT id_alumno FROM alumnos WHERE apellido=%s)", (APELLIDO_MARCA,)),
            ('rendiciones_materias_adeudadas', "id_alumno IN (SELECT id_alumno FROM alumnos WHERE apellido=%s)", (APELLIDO_MARCA,)),
            ('registro_rendiciones_previas', "id_alumno IN (SELECT id_alumno FROM alumnos WHERE apellido=%s)", (APELLIDO_MARCA,)),
            ('calificaciones', "id_alumno IN (SELECT id_alumno FROM alumnos WHERE apellido=%s)", (APELLIDO_MARCA,)),
            ('actividades_materias_adeudadas', "id_docente IN (SELECT id_docente FROM docentes WHERE apellido=%s)", (APELLIDO_MARCA,)),
            ('resultados_actividades_adeudadas', "id_alumno IN (SELECT id_alumno FROM alumnos WHERE apellido=%s)", (APELLIDO_MARCA,)),
            ('periodos_evaluacion', 'nombre_periodo=%s', ('E2E-1C',)),
            ('modulos', 'nombre=%s', ('E2E-M1',)),
            ('usuarios', 'usuario=%s', (usuario_admin,)),
            ('usuario_roles', "id_usuario IN (SELECT id_usuario FROM usuarios WHERE usuario=%s)", (usuario_admin,)),
            ('auth_user', 'username=%s', (usuario_admin,)),
        ]
        limpio = True
        for tabla, where, params in limpieza_checks:
            total = _filas(tabla, where, params)
            estado = 'LIMPIO' if total == 0 else 'SUCIO'
            if total != 0:
                limpio = False
            out(f'    {estado}: {tabla} = {total}')

        materias_restantes = _filas(
            'materias',
            'nombre_materia LIKE %s', (MATERIA_PREFIJO + '%',),
        )
        estado_mat = 'LIMPIO' if materias_restantes == 0 else 'SUCIO'
        if materias_restantes != 0:
            limpio = False
        out(f'    {estado_mat}: materias = {materias_restantes}')

        if limpio:
            out('\nRESULTADO: LIMPIEZA VERIFICADA (0 registros ficticios restantes).')
        else:
            out('\nRESULTADO: QUEDARON REGISTROS FICTICIOS. Revisar manualmente.')
            raise SystemExit(1)

    @staticmethod
    def assert_equal_previas(out, data, esperado):
        total = len(data['previas'])
        estado = 'OK' if total == esperado else 'DIFERENTE'
        if total != esperado:
            raise RuntimeError(f'previas devuelve {total}, esperado {esperado}')
        out(f'    {estado}: boletín previas = {total} (esperado {esperado})')
