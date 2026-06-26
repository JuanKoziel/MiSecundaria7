from django.db import migrations


def cleanup_educacion_fisica(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            DELETE FROM horarios
            WHERE id_curso_materia IN (
                SELECT cm.id_curso_materia
                FROM curso_materia cm
                JOIN materias m ON cm.id_materia = m.id_materia
                WHERE m.nombre_materia = 'Educación Física'
            )
        """)


class Migration(migrations.Migration):

    dependencies = [
        ('escuela', '0001_usuario_fechas_programadas'),
    ]

    operations = [
        migrations.RunPython(cleanup_educacion_fisica, migrations.RunPython.noop),
    ]
