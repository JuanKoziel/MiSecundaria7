"""
Carga los tipos de acción por defecto en `tipos_accion`.

La tabla se crea manualmente (managed=False) y las demás migraciones de la
app usan SQL directo, por lo que aquí también se usa `INSERT IGNORE`
(aprovechando el índice único de `nombre_accion`) para copiar los datos que
antes insertaba el seeder de AppConfig.ready().
"""
from django.db import migrations

SQL_SEED = """
INSERT IGNORE INTO tipos_accion (nombre_accion) VALUES
    ('Crear'),
    ('Modificar'),
    ('Eliminar'),
    ('Cambio de contraseña'),
    ('Cambio de rol'),
    ('Habilitar'),
    ('Deshabilitar'),
    ('Finalizar');
"""

SQL_UNSEED = """
DELETE FROM tipos_accion
WHERE nombre_accion IN (
    'Crear', 'Modificar', 'Eliminar', 'Cambio de contraseña',
    'Cambio de rol', 'Habilitar', 'Deshabilitar', 'Finalizar'
);
"""


class Migration(migrations.Migration):

    dependencies = [
        ('escuela', '0005_ddjj_docente_verificada'),
    ]

    operations = [
        migrations.RunSQL(SQL_SEED, reverse_sql=SQL_UNSEED),
    ]