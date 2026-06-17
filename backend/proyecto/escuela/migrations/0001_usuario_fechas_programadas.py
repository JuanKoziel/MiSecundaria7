from django.db import migrations


def forwards(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT COLUMN_NAME
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'usuarios'
              AND COLUMN_NAME IN ('fecha_deshabilitacion_programada', 'fecha_habilitacion_programada')
            """
        )
        existentes = {row[0] for row in cursor.fetchall()}

        if 'fecha_deshabilitacion_programada' not in existentes:
            cursor.execute(
                "ALTER TABLE usuarios ADD COLUMN fecha_deshabilitacion_programada DATETIME NULL"
            )

        if 'fecha_habilitacion_programada' not in existentes:
            cursor.execute(
                "ALTER TABLE usuarios ADD COLUMN fecha_habilitacion_programada DATETIME NULL"
            )


def backwards(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT COLUMN_NAME
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'usuarios'
              AND COLUMN_NAME IN ('fecha_deshabilitacion_programada', 'fecha_habilitacion_programada')
            """
        )
        existentes = {row[0] for row in cursor.fetchall()}

        if 'fecha_deshabilitacion_programada' in existentes:
            cursor.execute("ALTER TABLE usuarios DROP COLUMN fecha_deshabilitacion_programada")

        if 'fecha_habilitacion_programada' in existentes:
            cursor.execute("ALTER TABLE usuarios DROP COLUMN fecha_habilitacion_programada")


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.RunPython(forwards, backwards),
    ]

