"""
Agrega la columna `verificada` a `ddjj_docente` (revisión de la DDJJ).

La tabla se crea manualmente (managed=False); esta migración ejecuta el DDL
para que baste con `python manage.py migrate`. El valor indica si el
admin/director marcó la Declaración Jurada como verificada.
"""
from django.db import migrations

SQL_ALTER = """
ALTER TABLE ddjj_docente
    ADD COLUMN verificada TINYINT(1) NOT NULL DEFAULT 0
"""

SQL_DROP = """
ALTER TABLE ddjj_docente
    DROP COLUMN verificada
"""


class Migration(migrations.Migration):

    dependencies = [
        ('escuela', '0004_notificaciones_rol'),
    ]

    operations = [
        migrations.RunSQL(SQL_ALTER, reverse_sql=SQL_DROP),
    ]