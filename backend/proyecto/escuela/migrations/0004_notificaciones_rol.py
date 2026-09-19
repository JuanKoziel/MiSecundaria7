"""
Agrega la columna `rol` a `notificaciones` (segmento destino).

La tabla se crea manualmente (managed=False); esta migración ejecuta el DDL
para que baste con `python manage.py migrate`. El valor guardado es el
segmento destino de la notificación: 'alumno', 'familia', 'docente',
'preceptor', 'jefe_preceptores', 'directivo' o 'universal'. Las filas con
`rol` NULL (históricas) siguen viéndose en cualquier rol activo.
"""
from django.db import migrations

SQL_ALTER = """
ALTER TABLE notificaciones
    ADD COLUMN rol VARCHAR(32) NULL
"""

SQL_DROP = """
ALTER TABLE notificaciones
    DROP COLUMN rol
"""


class Migration(migrations.Migration):

    dependencies = [
        ('escuela', '0003_crear_tabla_cargas_unicas'),
    ]

    operations = [
        migrations.RunSQL(SQL_ALTER, reverse_sql=SQL_DROP),
    ]