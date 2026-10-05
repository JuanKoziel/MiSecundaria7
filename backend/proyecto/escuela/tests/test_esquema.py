"""Regresión del esquema físico vs. los modelos `managed=False`.

El bug que estos tests cubren: la base se provisionó desde el volcado SQL de
referencia (una foto antigua del MySQL original) que no tiene las columnas de
borrado lógico, ni `activo`, ni varias columnas de funcionalidad. Como los
modelos son `managed = False`, `migrate` no las creaba y casi todos los
endpoints devolvían HTTP 500:

    django.db.utils.OperationalError:
    (1054, "Unknown column 'materias.activo' in 'SELECT'")

Estos tests NO escriben en la base real: el runner
`escuela.test_runner.EscuelaDiscoverRunner` crea `test_<base>` y le replica
solo la estructura.
"""
import re

from django.db import connection
from django.test import TestCase

from escuela import schema
from escuela.models import Materia  # noqa: F401  (registra el modelo)


def _columnas_de_todos_los_modelos():
    """(db_table, column) de todos los campos concretos de los modelos."""
    from django.apps import apps

    resultado = set()
    for model in apps.get_app_config('escuela').get_models():
        if not model._meta.db_table:
            continue
        for campo in model._meta.concrete_fields:
            resultado.add((model._meta.db_table, campo.column))
    return resultado


class EsquemaCoincideConModelosTests(TestCase):
    """Ninguna columna declarada por un modelo puede faltar en la base."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        with connection.cursor() as cursor:
            cls.tablas = schema.tablas_de(cursor)
            cls.columnas = {
                t: schema.columnas_de(cursor, t) for t in cls.tablas
            }

    def test_todas_las_tablas_de_modelo_existen(self):
        faltantes = sorted(
            t for t in {t for t, _ in _columnas_de_todos_los_modelos()}
            if t not in self.tablas
        )
        self.assertEqual(
            [], faltantes,
            'Tablas de modelo ausentes en la base: %s' % faltantes,
        )

    def test_todas_las_columnas_de_modelo_existen(self):
        """Regresión directa de `Unknown column '<tabla>.<columna>'`."""
        faltantes = sorted(
            (t, c) for t, c in _columnas_de_todos_los_modelos()
            if t in self.tablas and c not in self.columnas[t]
        )
        self.assertEqual(
            [], faltantes,
            'Columnas declaradas por los modelos que no existen en la base '
            '(aplicá `manage.py migrate`): %s' % faltantes,
        )

    def test_columnas_de_soft_delete_existen(self):
        """`ActivoManager` filtra por `estado=True`: si falta, todo da 500."""
        faltantes = []
        for tabla in schema.SOFT_DELETE_TABLAS:
            if tabla not in self.tablas:
                continue
            for columna in ('estado', 'fecha_eliminacion'):
                if columna not in self.columnas[tabla]:
                    faltantes.append(f'{tabla}.{columna}')
        self.assertEqual([], faltantes, f'Faltan columnas de borrado lógico: {faltantes}')

    def test_especificacion_no_declara_duplicados(self):
        vistos = [(t, c) for t, c, *_ in schema.COLUMNAS]
        self.assertEqual(
            len(vistos), len(set(vistos)),
            'escuela/schema.py declara la misma columna dos veces',
        )

    def test_especificacion_cubre_las_tablas_con_soft_delete(self):
        declaradas = {t for t, *_ in schema.COLUMNAS}
        for tabla in schema.SOFT_DELETE_TABLAS:
            self.assertIn(tabla, declaradas)

    def test_planificaciones_usa_eliminado_y_no_estado_como_booleano(self):
        """`Planificacion.estado` es Borrador/Publicado, no el flag de borrado."""
        from escuela.models import Planificacion

        self.assertEqual(
            'CharField',
            Planificacion._meta.get_field('estado').get_internal_type(),
        )
        self.assertEqual(
            'BooleanField',
            type(Planificacion._meta.get_field('eliminado')).__name__,
        )
        declaradas = {(t, c) for t, c, *_ in schema.COLUMNAS}
        self.assertIn(('planificaciones', 'eliminado'), declaradas)
        self.assertIn(('planificaciones', 'estado'), declaradas)


class VerificacionEsquemaTests(TestCase):
    """`verificar_esquema` no debe reportar diferencias sobre un esquema sano."""

    def test_esquema_alineado_en_la_base_de_pruebas(self):
        resultado = schema.verificar_esquema(connection)
        for clave in ('faltantes', 'nulabilidad', 'indices'):
            self.assertEqual(
                [], resultado[clave],
                f'Diferencias en "{clave}": {resultado[clave]}',
            )


class EspecificacionSqlTests(TestCase):
    """El script SQL emitido debe ser idempotente y no destructivo."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.sql = schema.sql_esquema()

    def test_no_contiene_operaciones_destructivas(self):
        """Solo se permite DDL aditivo; los comentarios se ignoran."""
        ejecutable = '\n'.join(
            linea for linea in self.sql.splitlines()
            if not linea.strip().startswith('--')
        ).upper()
        prohibidas = ('DROP TABLE', 'TRUNCATE', 'DELETE FROM', 'DROP COLUMN',
                      'DROP DATABASE', 'DROP INDEX')
        for operacion in prohibidas:
            self.assertNotIn(
                operacion, ejecutable,
                f'El script generado contiene una operación destructiva: {operacion}',
            )

    def test_solo_lectura_y_ddl_aditivo(self):
        """Cada sentencia debe ser de lectura o un ADD/MODIFY (nada más).

        Todo `ALTER TABLE` viaja dentro del literal de un `SET @ddl := IF(...)`,
        así que la lista de verbos admitidos es cerrada. Se acepta `AND`
        porque puede ser la continuación de un `SET @x := IF( ... )`.
        """
        sin_comentarios = '\n'.join(
            linea for linea in self.sql.splitlines()
            if not linea.strip().startswith('--')
        )
        permitidos = {
            'SELECT', 'SET', 'PREPARE', 'EXECUTE', 'DEALLOCATE', 'UPDATE',
            'AND',  # continuación de un SET ... IF( ... )
        }
        for sentencia in sin_comentarios.split(';'):
            sentencia = sentencia.strip()
            if not sentencia:
                continue
            verbo = sentencia.split(None, 1)[0].upper()
            self.assertIn(
                verbo, permitidos,
                f'Verbo no permitido en el script generado: {verbo} '
                f'({sentencia[:70]}...)',
            )

    def test_todas_las_columnas_de_la_especificacion_aparecen(self):
        for tabla, columna, _ddl, _relleno, _nota in schema.COLUMNAS:
            self.assertIn(
                f"TABLE_NAME = '{tabla}'", self.sql,
                f'Falta el bloque de {tabla} en el SQL generado',
            )
            self.assertIn(
                f"COLUMN_NAME = '{columna}'", self.sql,
                f'Falta el bloque de {tabla}.{columna} en el SQL generado',
            )

    def test_cada_alter_va_guardado_por_information_schema(self):
        """Cada bloque `PREPARE` debe consultar `information_schema` antes.

        Es la garantía de idempotencia: si la columna ya existe, el `SET @ddl`
        resuelve a `DO 0` y no se ejecuta nada.
        """
        # Un bloque = desde un `SET @existe`/`SET @es_nullable` hasta su
        # `DEALLOCATE PREPARE`.
        bloques = re.findall(
            r'SET @(?:existe|es_nullable) :=.*?DEALLOCATE PREPARE stmt;',
            self.sql,
            re.DOTALL,
        )
        self.assertGreater(len(bloques), 0, 'No se encontró ningún bloque guardado')

        for bloque in bloques:
            self.assertIn(
                'information_schema', bloque,
                'Bloque sin chequeo de information_schema:\n%s' % bloque[:200],
            )
            self.assertIn(
                'PREPARE stmt FROM', bloque,
                'Bloque sin PREPARE/EXECUTE:\n%s' % bloque[:200],
            )

        # Cada columna de la especificación tiene su propio chequeo.
        self.assertGreaterEqual(
            len(bloques),
            len(schema.COLUMNAS) + len(schema.RELLENOS)
            + len(schema.RELLENOS_CONSULTA)
            + len(schema.COLUMNAS_NOT_NULL) + len(schema.COLUMNAS_NULLABLE),
            'Faltan bloques guardados en el SQL generado',
        )

    def test_los_valores_por_defecto_con_comillas_estan_escapados(self):
        """`VARCHAR(20) DEFAULT 'Borrador'` debe viajar como `''Borrador''`."""
        self.assertIn(
            "VARCHAR(20) NULL DEFAULT ''Borrador''", self.sql,
            "El default de planificaciones.estado no está escapado para el literal",
        )
        for _tabla, _columna, ddl, _relleno, _nota in schema.COLUMNAS:
            if "'" in ddl:
                self.assertIn(
                    ddl.replace("'", "''"), self.sql,
                    'DDL con comillas simples sin escapar: %s' % ddl,
                )
