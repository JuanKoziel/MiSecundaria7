-- ---------------------------------------------------------------------
-- MiSecundaria7 — sincronización del esquema de las tablas managed=False
-- Generado por `manage.py generar_sql_esquema` (NO editar a mano).
--
-- Es idempotente y aditivo: se puede ejecutar sobre una base nueva o
-- sobre una base ya actualizada. No hace DROP / TRUNCATE / DELETE.
-- ---------------------------------------------------------------------

-- alumnos.estado — borrado lógico (ActivoManager)
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'alumnos'
                  AND COLUMN_NAME = 'estado');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `alumnos` ADD COLUMN `estado` TINYINT(1) NOT NULL DEFAULT 1',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'alumnos'
      AND COLUMN_NAME = 'estado'

);
SET @sql := IF(@existe > 0, 'UPDATE `alumnos` SET `estado` = 1 WHERE `estado` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- alumnos.fecha_eliminacion — borrado lógico
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'alumnos'
                  AND COLUMN_NAME = 'fecha_eliminacion');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `alumnos` ADD COLUMN `fecha_eliminacion` DATETIME NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- docentes.estado — borrado lógico (ActivoManager)
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'docentes'
                  AND COLUMN_NAME = 'estado');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `docentes` ADD COLUMN `estado` TINYINT(1) NOT NULL DEFAULT 1',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'docentes'
      AND COLUMN_NAME = 'estado'

);
SET @sql := IF(@existe > 0, 'UPDATE `docentes` SET `estado` = 1 WHERE `estado` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- docentes.fecha_eliminacion — borrado lógico
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'docentes'
                  AND COLUMN_NAME = 'fecha_eliminacion');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `docentes` ADD COLUMN `fecha_eliminacion` DATETIME NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- preceptores.estado — borrado lógico (ActivoManager)
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'preceptores'
                  AND COLUMN_NAME = 'estado');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `preceptores` ADD COLUMN `estado` TINYINT(1) NOT NULL DEFAULT 1',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'preceptores'
      AND COLUMN_NAME = 'estado'

);
SET @sql := IF(@existe > 0, 'UPDATE `preceptores` SET `estado` = 1 WHERE `estado` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- preceptores.fecha_eliminacion — borrado lógico
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'preceptores'
                  AND COLUMN_NAME = 'fecha_eliminacion');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `preceptores` ADD COLUMN `fecha_eliminacion` DATETIME NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- directivos.estado — borrado lógico (ActivoManager)
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'directivos'
                  AND COLUMN_NAME = 'estado');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `directivos` ADD COLUMN `estado` TINYINT(1) NOT NULL DEFAULT 1',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'directivos'
      AND COLUMN_NAME = 'estado'

);
SET @sql := IF(@existe > 0, 'UPDATE `directivos` SET `estado` = 1 WHERE `estado` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- directivos.fecha_eliminacion — borrado lógico
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'directivos'
                  AND COLUMN_NAME = 'fecha_eliminacion');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `directivos` ADD COLUMN `fecha_eliminacion` DATETIME NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- padres_tutores.estado — borrado lógico (ActivoManager)
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'padres_tutores'
                  AND COLUMN_NAME = 'estado');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `padres_tutores` ADD COLUMN `estado` TINYINT(1) NOT NULL DEFAULT 1',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'padres_tutores'
      AND COLUMN_NAME = 'estado'

);
SET @sql := IF(@existe > 0, 'UPDATE `padres_tutores` SET `estado` = 1 WHERE `estado` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- padres_tutores.fecha_eliminacion — borrado lógico
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'padres_tutores'
                  AND COLUMN_NAME = 'fecha_eliminacion');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `padres_tutores` ADD COLUMN `fecha_eliminacion` DATETIME NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- materias.estado — borrado lógico (ActivoManager)
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'materias'
                  AND COLUMN_NAME = 'estado');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `materias` ADD COLUMN `estado` TINYINT(1) NOT NULL DEFAULT 1',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'materias'
      AND COLUMN_NAME = 'estado'

);
SET @sql := IF(@existe > 0, 'UPDATE `materias` SET `estado` = 1 WHERE `estado` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- materias.fecha_eliminacion — borrado lógico
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'materias'
                  AND COLUMN_NAME = 'fecha_eliminacion');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `materias` ADD COLUMN `fecha_eliminacion` DATETIME NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- cursos.estado — borrado lógico (ActivoManager)
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cursos'
                  AND COLUMN_NAME = 'estado');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `cursos` ADD COLUMN `estado` TINYINT(1) NOT NULL DEFAULT 1',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cursos'
      AND COLUMN_NAME = 'estado'

);
SET @sql := IF(@existe > 0, 'UPDATE `cursos` SET `estado` = 1 WHERE `estado` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- cursos.fecha_eliminacion — borrado lógico
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cursos'
                  AND COLUMN_NAME = 'fecha_eliminacion');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `cursos` ADD COLUMN `fecha_eliminacion` DATETIME NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- curso_materia.estado — borrado lógico (ActivoManager)
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'curso_materia'
                  AND COLUMN_NAME = 'estado');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `curso_materia` ADD COLUMN `estado` TINYINT(1) NOT NULL DEFAULT 1',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'curso_materia'
      AND COLUMN_NAME = 'estado'

);
SET @sql := IF(@existe > 0, 'UPDATE `curso_materia` SET `estado` = 1 WHERE `estado` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- curso_materia.fecha_eliminacion — borrado lógico
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'curso_materia'
                  AND COLUMN_NAME = 'fecha_eliminacion');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `curso_materia` ADD COLUMN `fecha_eliminacion` DATETIME NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- periodos_evaluacion.estado — borrado lógico (ActivoManager)
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'periodos_evaluacion'
                  AND COLUMN_NAME = 'estado');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `periodos_evaluacion` ADD COLUMN `estado` TINYINT(1) NOT NULL DEFAULT 1',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'periodos_evaluacion'
      AND COLUMN_NAME = 'estado'

);
SET @sql := IF(@existe > 0, 'UPDATE `periodos_evaluacion` SET `estado` = 1 WHERE `estado` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- periodos_evaluacion.fecha_eliminacion — borrado lógico
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'periodos_evaluacion'
                  AND COLUMN_NAME = 'fecha_eliminacion');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `periodos_evaluacion` ADD COLUMN `fecha_eliminacion` DATETIME NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- actas.estado — borrado lógico (ActivoManager)
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'actas'
                  AND COLUMN_NAME = 'estado');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `actas` ADD COLUMN `estado` TINYINT(1) NOT NULL DEFAULT 1',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'actas'
      AND COLUMN_NAME = 'estado'

);
SET @sql := IF(@existe > 0, 'UPDATE `actas` SET `estado` = 1 WHERE `estado` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- actas.fecha_eliminacion — borrado lógico
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'actas'
                  AND COLUMN_NAME = 'fecha_eliminacion');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `actas` ADD COLUMN `fecha_eliminacion` DATETIME NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- comunicados.estado — borrado lógico (ActivoManager)
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'comunicados'
                  AND COLUMN_NAME = 'estado');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `comunicados` ADD COLUMN `estado` TINYINT(1) NOT NULL DEFAULT 1',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'comunicados'
      AND COLUMN_NAME = 'estado'

);
SET @sql := IF(@existe > 0, 'UPDATE `comunicados` SET `estado` = 1 WHERE `estado` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- comunicados.fecha_eliminacion — borrado lógico
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'comunicados'
                  AND COLUMN_NAME = 'fecha_eliminacion');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `comunicados` ADD COLUMN `fecha_eliminacion` DATETIME NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- diagnosticos_grupales.estado — borrado lógico (ActivoManager)
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'diagnosticos_grupales'
                  AND COLUMN_NAME = 'estado');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `diagnosticos_grupales` ADD COLUMN `estado` TINYINT(1) NOT NULL DEFAULT 1',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'diagnosticos_grupales'
      AND COLUMN_NAME = 'estado'

);
SET @sql := IF(@existe > 0, 'UPDATE `diagnosticos_grupales` SET `estado` = 1 WHERE `estado` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- diagnosticos_grupales.fecha_eliminacion — borrado lógico
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'diagnosticos_grupales'
                  AND COLUMN_NAME = 'fecha_eliminacion');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `diagnosticos_grupales` ADD COLUMN `fecha_eliminacion` DATETIME NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- ciclos_lectivos.fecha_eliminacion — borrado lógico
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ciclos_lectivos'
                  AND COLUMN_NAME = 'fecha_eliminacion');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `ciclos_lectivos` ADD COLUMN `fecha_eliminacion` DATETIME NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- planificaciones.contenido — contenido pedagógico
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'planificaciones'
                  AND COLUMN_NAME = 'contenido');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `planificaciones` ADD COLUMN `contenido` TEXT NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- planificaciones.objetivos — contenido pedagógico
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'planificaciones'
                  AND COLUMN_NAME = 'objetivos');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `planificaciones` ADD COLUMN `objetivos` TEXT NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- planificaciones.salidas — contenido pedagógico
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'planificaciones'
                  AND COLUMN_NAME = 'salidas');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `planificaciones` ADD COLUMN `salidas` TEXT NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- planificaciones.fundamentacion — contenido pedagógico
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'planificaciones'
                  AND COLUMN_NAME = 'fundamentacion');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `planificaciones` ADD COLUMN `fundamentacion` TEXT NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- planificaciones.estado — Borrador/Publicado (no es borrado lógico)
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'planificaciones'
                  AND COLUMN_NAME = 'estado');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `planificaciones` ADD COLUMN `estado` VARCHAR(20) NULL DEFAULT ''Borrador''',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'planificaciones'
      AND COLUMN_NAME = 'estado'

);
SET @sql := IF(@existe > 0, 'UPDATE `planificaciones` SET `estado` = ''Borrador'' WHERE `estado` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- planificaciones.eliminado — borrado lógico
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'planificaciones'
                  AND COLUMN_NAME = 'eliminado');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `planificaciones` ADD COLUMN `eliminado` TINYINT(1) NOT NULL DEFAULT 0',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'planificaciones'
      AND COLUMN_NAME = 'eliminado'

);
SET @sql := IF(@existe > 0, 'UPDATE `planificaciones` SET `eliminado` = 0 WHERE `eliminado` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- planificaciones.fecha_ultima_modificacion — auditoría de contenido
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'planificaciones'
                  AND COLUMN_NAME = 'fecha_ultima_modificacion');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `planificaciones` ADD COLUMN `fecha_ultima_modificacion` DATETIME NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- planificaciones.fecha_eliminacion — borrado lógico
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'planificaciones'
                  AND COLUMN_NAME = 'fecha_eliminacion');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `planificaciones` ADD COLUMN `fecha_eliminacion` DATETIME NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- materias.activo — flag de disponibilidad (utils.activar_o_crear)
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'materias'
                  AND COLUMN_NAME = 'activo');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `materias` ADD COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'materias'
      AND COLUMN_NAME = 'activo'

);
SET @sql := IF(@existe > 0, 'UPDATE `materias` SET `activo` = 1 WHERE `activo` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- cursos.activo — flag de disponibilidad (utils.activar_o_crear)
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cursos'
                  AND COLUMN_NAME = 'activo');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `cursos` ADD COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cursos'
      AND COLUMN_NAME = 'activo'

);
SET @sql := IF(@existe > 0, 'UPDATE `cursos` SET `activo` = 1 WHERE `activo` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- curso_materia.activo — flag de disponibilidad (utils.activar_o_crear)
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'curso_materia'
                  AND COLUMN_NAME = 'activo');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `curso_materia` ADD COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'curso_materia'
      AND COLUMN_NAME = 'activo'

);
SET @sql := IF(@existe > 0, 'UPDATE `curso_materia` SET `activo` = 1 WHERE `activo` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- cursos.orientacion — orientación del curso
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cursos'
                  AND COLUMN_NAME = 'orientacion');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `cursos` ADD COLUMN `orientacion` VARCHAR(50) NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- padres_tutores.correo — contacto de familias
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'padres_tutores'
                  AND COLUMN_NAME = 'correo');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `padres_tutores` ADD COLUMN `correo` VARCHAR(100) NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- padres_tutores.tipo — Padre/Madre/Tutor
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'padres_tutores'
                  AND COLUMN_NAME = 'tipo');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `padres_tutores` ADD COLUMN `tipo` VARCHAR(30) NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- asistencias.hora — hora de la toma de asistencia
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'asistencias'
                  AND COLUMN_NAME = 'hora');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `asistencias` ADD COLUMN `hora` TIME NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'asistencias'
      AND COLUMN_NAME = 'hora'

);
SET @sql := IF(@existe > 0, 'UPDATE `asistencias` SET `hora` = 0 WHERE `hora` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- asistencias.justificado — permiso justificado
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'asistencias'
                  AND COLUMN_NAME = 'justificado');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `asistencias` ADD COLUMN `justificado` TINYINT(1) NOT NULL DEFAULT 0',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'asistencias'
      AND COLUMN_NAME = 'justificado'

);
SET @sql := IF(@existe > 0, 'UPDATE `asistencias` SET `justificado` = 0 WHERE `justificado` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- horarios.id_modulo — FK -> modulos
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'horarios'
                  AND COLUMN_NAME = 'id_modulo');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `horarios` ADD COLUMN `id_modulo` INT NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- notificaciones.id_alumno — alumno destinatario del aviso
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones'
                  AND COLUMN_NAME = 'id_alumno');
SET @ddl := IF(@existe = 0,
               'ALTER TABLE `notificaciones` ADD COLUMN `id_alumno` INT NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios'
      AND COLUMN_NAME = 'estado'

);
SET @sql := IF(@existe > 0, 'UPDATE `usuarios` SET `estado` = 1 WHERE `estado` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ciclos_lectivos'
      AND COLUMN_NAME = 'estado'

);
SET @sql := IF(@existe > 0, 'UPDATE `ciclos_lectivos` SET `estado` = 1 WHERE `estado` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones'
      AND COLUMN_NAME = 'leida'

);
SET @sql := IF(@existe > 0, 'UPDATE `notificaciones` SET `leida` = 0 WHERE `leida` IS NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- horarios.id_modulo: deriva id_modulo del numero_modulo que ya traía la tabla
SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'horarios'
      AND COLUMN_NAME = 'id_modulo'

      AND (SELECT COUNT(*) FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'modulos') > 0
);
SET @sql := IF(@existe > 0, 'UPDATE `horarios` h JOIN `modulos` m ON m.`id_modulo` = h.`numero_modulo` SET h.`id_modulo` = m.`id_modulo` WHERE h.`id_modulo` IS NULL AND h.`numero_modulo` IS NOT NULL', 'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- asistencias.hora -> TIME NOT NULL
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'asistencias'
                  AND COLUMN_NAME = 'hora');
SET @es_nullable := IF(@existe = 0, 0,
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'asistencias'
       AND COLUMN_NAME = 'hora' AND IS_NULLABLE = 'YES'));
SET @nulos := IF(@existe = 0, 0,
    (SELECT COUNT(*) FROM `asistencias` WHERE `hora` IS NULL));
SET @ddl := IF(@es_nullable = 1 AND @nulos = 0,
               'ALTER TABLE `asistencias` MODIFY COLUMN `hora` TIME NOT NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- usuarios.estado -> TINYINT(1) NOT NULL DEFAULT 1
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios'
                  AND COLUMN_NAME = 'estado');
SET @es_nullable := IF(@existe = 0, 0,
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios'
       AND COLUMN_NAME = 'estado' AND IS_NULLABLE = 'YES'));
SET @nulos := IF(@existe = 0, 0,
    (SELECT COUNT(*) FROM `usuarios` WHERE `estado` IS NULL));
SET @ddl := IF(@es_nullable = 1 AND @nulos = 0,
               'ALTER TABLE `usuarios` MODIFY COLUMN `estado` TINYINT(1) NOT NULL DEFAULT 1',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- ciclos_lectivos.estado -> TINYINT(1) NOT NULL DEFAULT 1
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ciclos_lectivos'
                  AND COLUMN_NAME = 'estado');
SET @es_nullable := IF(@existe = 0, 0,
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ciclos_lectivos'
       AND COLUMN_NAME = 'estado' AND IS_NULLABLE = 'YES'));
SET @nulos := IF(@existe = 0, 0,
    (SELECT COUNT(*) FROM `ciclos_lectivos` WHERE `estado` IS NULL));
SET @ddl := IF(@es_nullable = 1 AND @nulos = 0,
               'ALTER TABLE `ciclos_lectivos` MODIFY COLUMN `estado` TINYINT(1) NOT NULL DEFAULT 1',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- notificaciones.leida -> TINYINT(1) NOT NULL DEFAULT 0
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones'
                  AND COLUMN_NAME = 'leida');
SET @es_nullable := IF(@existe = 0, 0,
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones'
       AND COLUMN_NAME = 'leida' AND IS_NULLABLE = 'YES'));
SET @nulos := IF(@existe = 0, 0,
    (SELECT COUNT(*) FROM `notificaciones` WHERE `leida` IS NULL));
SET @ddl := IF(@es_nullable = 1 AND @nulos = 0,
               'ALTER TABLE `notificaciones` MODIFY COLUMN `leida` TINYINT(1) NOT NULL DEFAULT 0',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- comunicados.id_curso -> INT NULL
SET @existe := (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'comunicados'
                  AND COLUMN_NAME = 'id_curso');
SET @es_nullable := IF(@existe = 0, 0,
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'comunicados'
       AND COLUMN_NAME = 'id_curso' AND IS_NULLABLE = 'NO'));
SET @nulos := IF(@existe = 0, 0,
    (SELECT COUNT(*) FROM `comunicados` WHERE `id_curso` IS NULL));
SET @ddl := IF(@es_nullable = 1 AND @nulos = 0,
               'ALTER TABLE `comunicados` MODIFY COLUMN `id_curso` INT NULL',
               'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- índice y FK de horarios.id_modulo
SET @existe := (SELECT COUNT(*) FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'horarios'
                  AND INDEX_NAME = 'idx_horarios_id_modulo');
SET @ddl := IF(@existe = 0, 'ALTER TABLE `horarios` ADD INDEX idx_horarios_id_modulo (id_modulo)', 'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'horarios'
                  AND CONSTRAINT_NAME = 'fk_horarios_id_modulo');

SET @ref := (SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'modulos');
SET @ddl := IF(@existe = 0 AND @ref > 0, 'ALTER TABLE `horarios` ADD CONSTRAINT fk_horarios_id_modulo FOREIGN KEY (id_modulo) REFERENCES modulos (id_modulo)', 'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- índice y FK de notificaciones.id_alumno
SET @existe := (SELECT COUNT(*) FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones'
                  AND INDEX_NAME = 'idx_notificaciones_id_alumno');
SET @ddl := IF(@existe = 0, 'ALTER TABLE `notificaciones` ADD INDEX idx_notificaciones_id_alumno (id_alumno)', 'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones'
                  AND CONSTRAINT_NAME = 'fk_notificaciones_id_alumno');

SET @ref := (SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'alumnos');
SET @ddl := IF(@existe = 0 AND @ref > 0, 'ALTER TABLE `notificaciones` ADD CONSTRAINT fk_notificaciones_id_alumno FOREIGN KEY (id_alumno) REFERENCES alumnos (id_alumno)', 'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


