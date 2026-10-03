"""Especificación declarativa del esquema físico de `sistema_escolar`.

Contexto
--------
Todos los modelos de `escuela` usan ``managed = False``: Django nunca crea ni
altera esas tablas, así que ``migrate`` no las toca. Durante años el esquema
se provisionó únicamente con el volcado SQL de referencia
(`deploy/sql/sistema_escolar.mariadb.sql`), que es una foto antigua del
servidor MySQL original. Ese volcado **no** contiene las columnas de borrado
lógico (`estado`, `fecha_eliminacion`), ni `activo`, ni varias columnas de
funcionalidad que el backend sí usa (`cursos.orientacion`,
`padres_tutores.correo/tipo`, `asistencias.hora/justificado`,
`horarios.id_modulo`, `notificaciones.id_alumno`,
`planificaciones.contenido/objetivos/salidas/fundamentacion`, ...).

Resultado: en una base creada desde ese volcado, casi todos los listados de
la API devolvían HTTP 500 con ``(1054, "Unknown column 'materias.activo' in
'SELECT'")``.

Este módulo es la **única fuente de verdad** de la diferencia entre los
modelos y el esquema físico. Se usa desde cuatro lugares:

* la migración ``0007_sincronizar_esquema_managed_false`` (aplica el DDL),
* el comando ``manage.py verificar_esquema`` (detecta desvíos),
* el comando ``manage.py generar_sql_esquema`` (emite el SQL para instalar
  desde cero), y
* los tests de regresión (``escuela/tests/test_esquema.py``).

Reglas de diseño
----------------
* Todo el DDL es **aditivo o de alineación**: nunca DROP, TRUNCATE, DELETE ni
  renombra. Conserva los datos.
* Todo el DDL es **idempotente**: cada sentencia se comprueba contra
  ``information_schema`` antes de ejecutarse, así se puede ejecutar tantas
  veces como haga falta (instalación nueva, actualización o reintento).
* Las filas existentes se rellenan con el valor por defecto del modelo, de
  modo que los managers con borrado lógico (`ActivoManager`, que filtran
  ``estado=True``) sigan viendo los registros que ya estaban cargados.
"""

# --------------------------------------------------------------------------
# Piezas reutilizables de DDL
# --------------------------------------------------------------------------

DDL_ESTADO = 'TINYINT(1) NOT NULL DEFAULT 1'
DDL_ACTIVO = 'TINYINT(1) NOT NULL DEFAULT 1'
DDL_ELIMINADO = 'TINYINT(1) NOT NULL DEFAULT 0'
DDL_FECHA_ELIMINACION = 'DATETIME NULL'
DDL_FECHA_MODIFICACION = 'DATETIME NULL'
DDL_TEXTO = 'TEXT NULL'

# Tablas con borrado lógico mediante `estado` (ver ActivoManager y
# utils.marcar_eliminado). Cada una recibe `estado` + `fecha_eliminacion`.
SOFT_DELETE_TABLAS = (
    'alumnos',
    'docentes',
    'preceptores',
    'directivos',
    'padres_tutores',
    'materias',
    'cursos',
    'curso_materia',
    'periodos_evaluacion',
    'actas',
    'comunicados',
    'diagnosticos_grupales',
)

# --------------------------------------------------------------------------
# Columnas a agregar
# --------------------------------------------------------------------------
# (tabla, columna, ddl, valor_para_filas_existentes, nota)
# `valor_para_filas_existentes` es un literal SQL (o None) que se usa en el
# UPDATE de relleno cuando la columna se crea sobre una tabla con filas.

COLUMNAS = []

# --- Borrado lógico -------------------------------------------------------
for _tabla in SOFT_DELETE_TABLAS:
    COLUMNAS.append(
        (_tabla, 'estado', DDL_ESTADO, '1', 'borrado lógico (ActivoManager)'),
    )
    COLUMNAS.append(
        (_tabla, 'fecha_eliminacion', DDL_FECHA_ELIMINACION, None, 'borrado lógico'),
    )

# `ciclos_lectivos.estado` ya existe en el esquema base; falta la fecha.
COLUMNAS.append(
    ('ciclos_lectivos', 'fecha_eliminacion', DDL_FECHA_ELIMINACION, None,
     'borrado lógico'),
)

# `planificaciones` es el caso especial: `estado` es Borrador/Publicado y el
# borrado lógico usa `eliminado` (PlanificacionManager / utils.marcar_eliminado).
COLUMNAS.extend([
    ('planificaciones', 'contenido', DDL_TEXTO, None, 'contenido pedagógico'),
    ('planificaciones', 'objetivos', DDL_TEXTO, None, 'contenido pedagógico'),
    ('planificaciones', 'salidas', DDL_TEXTO, None, 'contenido pedagógico'),
    ('planificaciones', 'fundamentacion', DDL_TEXTO, None, 'contenido pedagógico'),
    ('planificaciones', 'estado', "VARCHAR(20) NULL DEFAULT 'Borrador'",
     "'Borrador'", 'Borrador/Publicado (no es borrado lógico)'),
    ('planificaciones', 'eliminado', DDL_ELIMINADO, '0', 'borrado lógico'),
    ('planificaciones', 'fecha_ultima_modificacion', DDL_FECHA_MODIFICACION, None,
     'auditoría de contenido'),
    ('planificaciones', 'fecha_eliminacion', DDL_FECHA_ELIMINACION, None,
     'borrado lógico'),
])

# --- Banderas `activo` ----------------------------------------------------
for _tabla in ('materias', 'cursos', 'curso_materia'):
    COLUMNAS.append(
        (_tabla, 'activo', DDL_ACTIVO, '1',
         'flag de disponibilidad (utils.activar_o_crear)'),
    )

# --- Columnas de funcionalidad que el backend ya usa ----------------------
COLUMNAS.extend([
    ('cursos', 'orientacion', 'VARCHAR(50) NULL', None, 'orientación del curso'),
    ('padres_tutores', 'correo', 'VARCHAR(100) NULL', None, 'contacto de familias'),
    ('padres_tutores', 'tipo', 'VARCHAR(30) NULL', None, 'Padre/Madre/Tutor'),
    ('asistencias', 'hora', 'TIME NULL', '0', 'hora de la toma de asistencia'),
    ('asistencias', 'justificado', 'TINYINT(1) NOT NULL DEFAULT 0', '0',
     'permiso justificado'),
    ('horarios', 'id_modulo', 'INT NULL', None, 'FK -> modulos'),
    ('notificaciones', 'id_alumno', 'INT NULL', None, 'alumno destinatario del aviso'),
])

# Columnas que deben quedar NOT NULL para que el mapeo del modelo sea exacto.
# `asistencias.hora` se crea NULL para poder rellenar filas antiguas y luego
# se endurece (ver COLUMNAS_NOT_NULL).
COLUMNAS_NOT_NULL = (
    ('asistencias', 'hora', 'TIME NOT NULL'),
    ('usuarios', 'estado', DDL_ESTADO),
    ('ciclos_lectivos', 'estado', DDL_ESTADO),
    ('notificaciones', 'leida', 'TINYINT(1) NOT NULL DEFAULT 0'),
)

# Columnas que deben admitir NULL porque el modelo las declara opcionales.
COLUMNAS_NULLABLE = (
    ('comunicados', 'id_curso', 'INT NULL'),
)

# Rellenos de seguridad: sin esto, un NULL preexistente quedaría invisible
# para los managers que filtran `estado=True` o `leida=0`.
RELLENOS = (
    ('usuarios', 'estado', '1'),
    ('ciclos_lectivos', 'estado', '1'),
    ('notificaciones', 'leida', '0'),
)

# Índices y constraints de las FKs nuevas (se crean junto a la columna).
INDICES = (
    {
        'tabla': 'horarios',
        'columna': 'id_modulo',
        'indice': 'idx_horarios_id_modulo',
        'ddl_indice': 'ADD INDEX idx_horarios_id_modulo (id_modulo)',
        'fk_nombre': 'fk_horarios_id_modulo',
        'ddl_fk': (
            'ADD CONSTRAINT fk_horarios_id_modulo '
            'FOREIGN KEY (id_modulo) REFERENCES modulos (id_modulo)'
        ),
        # tabla referenciada: si el esquema base todavía no la tiene, el
        # ALTER con la FK fallaría con errno 150 y se omite.
        'fk_referencia': 'modulos',
    },
    {
        'tabla': 'notificaciones',
        'columna': 'id_alumno',
        'indice': 'idx_notificaciones_id_alumno',
        'ddl_indice': 'ADD INDEX idx_notificaciones_id_alumno (id_alumno)',
        'fk_nombre': 'fk_notificaciones_id_alumno',
        'ddl_fk': (
            'ADD CONSTRAINT fk_notificaciones_id_alumno '
            'FOREIGN KEY (id_alumno) REFERENCES alumnos (id_alumno)'
        ),
        'fk_referencia': 'alumnos',
    },
)

# Rellenos de datos que necesitan una consulta (no literales).
# Formato: (tabla, columna, sql, nota, tablas_extra_que_deben_existir)
RELLENOS_CONSULTA = (
    (
        'horarios',
        'id_modulo',
        (
            'UPDATE `horarios` h '
            'JOIN `modulos` m ON m.`id_modulo` = h.`numero_modulo` '
            'SET h.`id_modulo` = m.`id_modulo` '
            'WHERE h.`id_modulo` IS NULL AND h.`numero_modulo` IS NOT NULL'
        ),
        'deriva id_modulo del numero_modulo que ya traía la tabla',
        ('modulos',),
    ),
)


# --------------------------------------------------------------------------
# Helpers de inspección (information_schema)
# --------------------------------------------------------------------------

def _filas(cursor, sql, params=()):
    cursor.execute(sql, params)
    return cursor.fetchall()


def tablas_de(cursor):
    rows = _filas(
        cursor,
        'SELECT TABLE_NAME FROM information_schema.TABLES '
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'",
    )
    return {r[0] for r in rows}


def columnas_de(cursor, tabla):
    """Devuelve el set de columnas físicas de `tabla` (vacío si no existe)."""
    rows = _filas(
        cursor,
        'SELECT COLUMN_NAME FROM information_schema.COLUMNS '
        'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s',
        (tabla,),
    )
    return {r[0] for r in rows}


def es_nullable(cursor, tabla, columna):
    rows = _filas(
        cursor,
        'SELECT IS_NULLABLE FROM information_schema.COLUMNS '
        'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s',
        (tabla, columna),
    )
    if not rows:
        return None
    return rows[0][0] == 'YES'


def indices_de(cursor, tabla):
    rows = _filas(
        cursor,
        'SELECT INDEX_NAME FROM information_schema.STATISTICS '
        'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s',
        (tabla,),
    )
    return {r[0] for r in rows}


def constraints_de(cursor, tabla):
    rows = _filas(
        cursor,
        'SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS '
        'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s',
        (tabla,),
    )
    return {r[0] for r in rows}


def nulos_en(cursor, tabla, columna):
    """Cantidad de filas con NULL en `columna` (None si no existe la columna)."""
    if columna not in columnas_de(cursor, tabla):
        return None
    rows = _filas(cursor, f'SELECT COUNT(*) FROM `{tabla}` WHERE `{columna}` IS NULL')
    return rows[0][0]


# --------------------------------------------------------------------------
# Aplicación / verificación
# --------------------------------------------------------------------------

def aplicar_esquema(connection, log=None):
    """Aplica el DDL declarativo. Idempotente y no destructivo.

    Devuelve un dict con el detalle de lo aplicado, omitido y pendiente.
    """
    log = log or (lambda msg: None)
    informe = {
        'agregadas': [], 'omitidas': [], 'rellenos': [], 'endurecidas': [],
        'relajadas': [], 'indices': [], 'pendientes': [],
    }

    with connection.cursor() as cursor:
        existentes = tablas_de(cursor)

        for tabla, columna, ddl, relleno, nota in COLUMNAS:
            if tabla not in existentes:
                informe['pendientes'].append((tabla, columna, 'la tabla no existe'))
                continue
            if columna in columnas_de(cursor, tabla):
                informe['omitidas'].append((tabla, columna))
                continue
            cursor.execute(f'ALTER TABLE `{tabla}` ADD COLUMN `{columna}` {ddl}')
            informe['agregadas'].append((tabla, columna, nota))
            log(f'+ {tabla}.{columna} ({nota})')
            if relleno is not None:
                cursor.execute(
                    f'UPDATE `{tabla}` SET `{columna}` = {relleno} '
                    f'WHERE `{columna}` IS NULL'
                )
                informe['rellenos'].append((tabla, columna))

        # Rellenos de valores por defecto sobre columnas preexistentes.
        for tabla, columna, valor in RELLENOS:
            if tabla not in existentes or columna not in columnas_de(cursor, tabla):
                continue
            cursor.execute(
                f'UPDATE `{tabla}` SET `{columna}` = {valor} '
                f'WHERE `{columna}` IS NULL'
            )
            if cursor.rowcount:
                informe['rellenos'].append((tabla, columna))
                log(f'~ relleno {tabla}.{columna} (NULL -> {valor})')

        # Rellenos derivados de otras columnas.
        for tabla, columna, sql, nota, requiere in RELLENOS_CONSULTA:
            if tabla not in existentes or columna not in columnas_de(cursor, tabla):
                continue
            if any(t not in existentes for t in requiere):
                informe['pendientes'].append(
                    (tabla, columna, 'faltan tablas de referencia: %s'
                     % ', '.join(requiere)),
                )
                continue
            cursor.execute(sql)
            if cursor.rowcount:
                informe['rellenos'].append((tabla, columna))
                log(f'~ relleno {tabla}.{columna}: {nota}')

        # Endurecer a NOT NULL (solo si ya no quedan NULLs).
        for tabla, columna, ddl in COLUMNAS_NOT_NULL:
            if tabla not in existentes or columna not in columnas_de(cursor, tabla):
                informe['pendientes'].append((tabla, columna, 'no se puede endurecer'))
                continue
            if es_nullable(cursor, tabla, columna) is False:
                informe['omitidas'].append((tabla, columna))
                continue
            if nulos_en(cursor, tabla, columna):
                informe['pendientes'].append(
                    (tabla, columna, 'quedan NULL; no se puede poner NOT NULL'),
                )
                continue
            cursor.execute(f'ALTER TABLE `{tabla}` MODIFY COLUMN `{columna}` {ddl}')
            informe['endurecidas'].append((tabla, columna))
            log(f'* {tabla}.{columna} -> NOT NULL')

        # Relajar a NULL donde el modelo declara la FK opcional.
        for tabla, columna, ddl in COLUMNAS_NULLABLE:
            if tabla not in existentes or columna not in columnas_de(cursor, tabla):
                informe['pendientes'].append((tabla, columna, 'no se puede relajar'))
                continue
            if es_nullable(cursor, tabla, columna) is True:
                informe['omitidas'].append((tabla, columna))
                continue
            cursor.execute(f'ALTER TABLE `{tabla}` MODIFY COLUMN `{columna}` {ddl}')
            informe['relajadas'].append((tabla, columna))
            log(f'* {tabla}.{columna} -> NULL permitido')

        # Índices y FKs de las columnas nuevas.
        for spec in INDICES:
            tabla = spec['tabla']
            columna = spec['columna']
            if tabla not in existentes or columna not in columnas_de(cursor, tabla):
                continue
            if spec['indice'] not in indices_de(cursor, tabla):
                cursor.execute(f'ALTER TABLE `{tabla}` {spec["ddl_indice"]}')
                informe['indices'].append((tabla, spec['indice']))
                log(f'+ índice {tabla}.{spec["indice"]}')
            if spec['fk_nombre'] not in constraints_de(cursor, tabla):
                if spec['fk_referencia'] not in existentes:
                    informe['pendientes'].append((
                        tabla, spec['fk_nombre'],
                        'la tabla referenciada %s no existe'
                        % spec['fk_referencia'],
                    ))
                    continue
                cursor.execute(f'ALTER TABLE `{tabla}` {spec["ddl_fk"]}')
                informe['indices'].append((tabla, spec['fk_nombre']))
                log(f'+ FK {tabla}.{spec["fk_nombre"]}')

    return informe


def verificar_esquema(connection):
    """Compara el esquema físico con la especificación.

    Devuelve ``{'faltantes': [...], 'nulabilidad': [...], 'indices': [...]}``.
    """
    faltantes = []
    nulabilidad = []
    indices = []

    with connection.cursor() as cursor:
        existentes = tablas_de(cursor)

        for tabla, columna, ddl, relleno, nota in COLUMNAS:
            if tabla not in existentes:
                faltantes.append((tabla, columna, 'tabla inexistente'))
            elif columna not in columnas_de(cursor, tabla):
                faltantes.append((tabla, columna, nota))

        for tabla, columna, ddl in COLUMNAS_NOT_NULL:
            if tabla in existentes and columna in columnas_de(cursor, tabla):
                if es_nullable(cursor, tabla, columna) is True:
                    nulabilidad.append((tabla, columna, 'debería ser NOT NULL'))

        for tabla, columna, ddl in COLUMNAS_NULLABLE:
            if tabla in existentes and columna in columnas_de(cursor, tabla):
                if es_nullable(cursor, tabla, columna) is False:
                    nulabilidad.append((tabla, columna, 'debería admitir NULL'))

        for spec in INDICES:
            if spec['tabla'] not in existentes:
                continue
            if spec['indice'] not in indices_de(cursor, spec['tabla']):
                indices.append((spec['tabla'], spec['indice'], 'índice faltante'))
            if spec['fk_nombre'] not in constraints_de(cursor, spec['tabla']):
                # Si la tabla referenciada no existe todavía, la FK no es
                # un desvío: es una instalación parcial.
                if spec['fk_referencia'] in existentes:
                    indices.append(
                        (spec['tabla'], spec['fk_nombre'], 'FK faltante'),
                    )

    return {'faltantes': faltantes, 'nulabilidad': nulabilidad, 'indices': indices}


# --------------------------------------------------------------------------
# Emisión de SQL para instalaciones desde cero
# --------------------------------------------------------------------------

def _dentro_de_literal(valor):
    """Escapa un valor para poder incrustarlo dentro de un literal SQL.

    El DDL se arma con `PREPARE`/`EXECUTE`, es decir, viaja dentro de un literal
    de cadena. Los valores por defecto con comillas simples (por ejemplo
    ``VARCHAR(20) NULL DEFAULT 'Borrador'``) hay que duplicarlas para no romper
    el literal.
    """
    return valor.replace('\\', '\\\\').replace("'", "''")


_PLANTILLA_AGREGAR = """\
-- {tabla}.{columna} — {nota}
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{tabla}'
                  AND COLUMN_NAME = '{columna}');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `{tabla}` ADD COLUMN `{columna}` {ddl}',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
"""

_PLANTILLA_MODIFY = """\
-- {tabla}.{columna} -> {ddl_legible}
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{tabla}'
                  AND COLUMN_NAME = '{columna}');
SET @es_nullable := IF(@existe = 0, 0,
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{tabla}'
       AND COLUMN_NAME = '{columna}' AND IS_NULLABLE = '{nullable_actual}'));
SET @nulos := IF(@existe = 0, 0,
    (SELECT COUNT(*) FROM `{tabla}` WHERE `{columna}` IS NULL));
SET @ddl := IF(@es_nullable = 1 AND @nulos = 0,
               'ALTER TABLE `{tabla}` MODIFY COLUMN `{columna}` {ddl}',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
"""

_PLANTILLA_INDICE = """\
SET @existe := (SELECT COUNT(*) FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{tabla}'
                  AND INDEX_NAME = '{indice}');
SET @ddl := IF(@existe = 0, '{ddl}', 'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
"""

# La FK se crea solo si no existe Y si la tabla referenciada existe. En una
# instalación parcial el esquema base puede no tener todavía la tabla destino,
# y MariaDB rechazaría el ALTER con errno 150.
_PLANTILLA_FK = """\
SET @existe := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{tabla}'
                  AND CONSTRAINT_NAME = '{nombre}');
{requiere_sql}
SET @ddl := IF({condicion}, '{ddl}', 'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
"""

# Cada requisito extra: una variable con el conteo de la tabla referenciada.
_PLANTILLA_REQUIERE_FK = (
    "SET @ref := (SELECT COUNT(*) FROM information_schema.TABLES\n"
    "    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{tabla}');"
)

# UPDATE protegido: solo se ejecuta si la tabla **y** la columna existen, y si
# todas las tablas de `requiere` también existen (un JOIN puede referenciar una
# tabla que el esquema base todavía no tenga). En una instalación parcial un
# UPDATE a ciegas abortaría el script entero.
_PLANTILLA_RELLENO = """\
SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{tabla}'
      AND COLUMN_NAME = '{columna}'
{requiere_sql}
);
SET @sql := IF(@existe > 0, '{sql}', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
"""

# Cada requisito extra: `(SELECT COUNT(*) FROM information_schema.TABLES
#  WHERE ... AND TABLE_NAME = 'x') > 0`
_PLANTILLA_REQUIERE = (
    "\n      AND (SELECT COUNT(*) FROM information_schema.TABLES\n"
    "            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{tabla}') > 0"
)


def _requiere_sql(tablas):
    """Cláusulas `AND` que exigen la existencia de otras tablas."""
    return ''.join(
        _PLANTILLA_REQUIERE.format(tabla=t) for t in tablas
    )


def _ref_para_fk(tablas):
    """`SET @ref := ...` + condición, para FKs con tabla referenciada.

    Devuelve `(bloque_sql, condicion)`. La condición exige que la FK no exista
    todavía y que todas las tablas referenciadas existan.
    """
    if not tablas:
        return '', '@existe = 0'
    bloque = ''.join(
        '\n' + _PLANTILLA_REQUIERE_FK.format(tabla=t) for t in tablas
    )
    return bloque, ' AND '.join(['@existe = 0'] + ['@ref > 0'] * len(tablas))


def sql_esquema():
    """Devuelve el script SQL completo e idempotente de actualización."""
    out = [
        '-- ' + '-' * 69,
        '-- MiSecundaria7 — sincronización del esquema de las tablas managed=False',
        '-- Generado por `manage.py generar_sql_esquema` (NO editar a mano).',
        '--',
        '-- Es idempotente y aditivo: se puede ejecutar sobre una base nueva o',
        '-- sobre una base ya actualizada. No hace DROP / TRUNCATE / DELETE.',
        '-- ' + '-' * 69,
        '',
    ]

    for tabla, columna, ddl, relleno, nota in COLUMNAS:
        out.append(_PLANTILLA_AGREGAR.format(
            tabla=tabla,
            columna=columna,
            ddl=_dentro_de_literal(ddl),
            nota=nota,
        ))
        if relleno is not None:
            # Relleno de filas preexistentes con el valor por defecto del modelo.
            out.append(_PLANTILLA_RELLENO.format(
                tabla=tabla,
                columna=columna,
                requiere_sql='',
                sql=_dentro_de_literal(
                    f'UPDATE `{tabla}` SET `{columna}` = {relleno} '
                    f'WHERE `{columna}` IS NULL'
                ),
            ))
        out.append('')

    # Los rellenos van también protegidos: si el esquema base todavía no tiene
    # la tabla (instalación parcial), el UPDATE no debe abortar el script.
    for tabla, columna, valor in RELLENOS:
        out.append(_PLANTILLA_RELLENO.format(
            tabla=tabla,
            columna=columna,
            requiere_sql='',
            sql=_dentro_de_literal(
                f'UPDATE `{tabla}` SET `{columna}` = {valor} '
                f'WHERE `{columna}` IS NULL'
            ),
        ))
        out.append('')

    for tabla, columna, sql, nota, requiere in RELLENOS_CONSULTA:
        out.append(f'-- {tabla}.{columna}: {nota}')
        out.append(_PLANTILLA_RELLENO.format(
            tabla=tabla,
            columna=columna,
            requiere_sql=_requiere_sql(requiere),
            sql=_dentro_de_literal(sql),
        ))
        out.append('')

    for tabla, columna, ddl in COLUMNAS_NOT_NULL:
        # endurecer: solo si hoy es nullable y no quedan NULLs
        out.append(_PLANTILLA_MODIFY.format(
            tabla=tabla, columna=columna,
            ddl_legible=ddl,
            ddl=_dentro_de_literal(ddl),
            nullable_actual='YES',
        ))
        out.append('')

    for tabla, columna, ddl in COLUMNAS_NULLABLE:
        # relajar: solo si hoy es NOT NULL
        out.append(_PLANTILLA_MODIFY.format(
            tabla=tabla, columna=columna,
            ddl_legible=ddl,
            ddl=_dentro_de_literal(ddl),
            nullable_actual='NO',
        ))
        out.append('')

    for spec in INDICES:
        out.append(f'-- índice y FK de {spec["tabla"]}.{spec["columna"]}')
        out.append(_PLANTILLA_INDICE.format(
            tabla=spec['tabla'],
            indice=spec['indice'],
            ddl=_dentro_de_literal(
                f'ALTER TABLE `{spec["tabla"]}` ' + spec['ddl_indice']
            ),
        ))
        ref_sql, condicion = _ref_para_fk((spec['fk_referencia'],))
        out.append(_PLANTILLA_FK.format(
            tabla=spec['tabla'],
            nombre=spec['fk_nombre'],
            requiere_sql=ref_sql,
            condicion=condicion,
            ddl=_dentro_de_literal(
                f'ALTER TABLE `{spec["tabla"]}` ' + spec['ddl_fk']
            ),
        ))
        out.append('')

    return '\n'.join(out) + '\n'
