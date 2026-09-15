"""
Crea la tabla `cargas_unicas` (carga única de 20 minutos del Panel Diario).

La tabla se crea manualmente (el modelo usa managed=False como el resto del
esquema); esta migración ejecuta el DDL correspondiente para que baste con
`python manage.py migrate`.
"""
from django.db import migrations

SQL_CREATE = """
CREATE TABLE IF NOT EXISTS cargas_unicas (
    id_carga_unica INT AUTO_INCREMENT PRIMARY KEY,
    id_curso_materia INT NOT NULL,
    id_docente INT NULL,
    fecha DATE NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_vencimiento DATETIME NOT NULL,
    pendientes VARCHAR(120) NOT NULL DEFAULT '[]',
    asistencias_cargada TINYINT(1) NOT NULL DEFAULT 0,
    libro_cargada TINYINT(1) NOT NULL DEFAULT 0,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cargas_unicas_curso_materia FOREIGN KEY (id_curso_materia)
        REFERENCES curso_materia (id_curso_materia),
    CONSTRAINT fk_cargas_unicas_docente FOREIGN KEY (id_docente)
        REFERENCES docentes (id_docente),
    INDEX idx_cargas_unicas_cm_fecha (id_curso_materia, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

SQL_DROP = "DROP TABLE IF EXISTS cargas_unicas;"


class Migration(migrations.Migration):

    dependencies = [
        ('escuela', '0002_cleanup_horarios_educacion_fisica'),
    ]

    operations = [
        migrations.RunSQL(SQL_CREATE, reverse_sql=SQL_DROP),
    ]