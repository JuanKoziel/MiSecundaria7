from django.core.management.base import BaseCommand
from django.db import connection
from escuela.models import CursoMateria
from django.conf import settings


class Command(BaseCommand):
    help = 'Diagnóstico completo del problema CursoMateria'

    def handle(self, *args, **options):
        self.stdout.write('=== DIAGNÓSTICO COMPLETO CURSO_MATERIA ===\n')
        
        # 1. Configuración DATABASES
        self.stdout.write('1. CONFIGURACIÓN DATABASES:')
        self.stdout.write(f'   ENGINE: {settings.DATABASES["default"]["ENGINE"]}')
        self.stdout.write(f'   NAME: {settings.DATABASES["default"]["NAME"]}')
        self.stdout.write(f'   USER: {settings.DATABASES["default"]["USER"]}')
        self.stdout.write(f'   HOST: {settings.DATABASES["default"]["HOST"]}')
        self.stdout.write(f'   PORT: {settings.DATABASES["default"]["PORT"]}')
        
        # 2. Motor de base de datos
        engine = settings.DATABASES["default"]["ENGINE"]
        db_type = "MariaDB/MySQL" if "mysql" in engine else "SQLite" if "sqlite" in engine else "Otro"
        self.stdout.write(f'\n2. MOTOR DE BASE DE DATOS: {db_type}')
        
        # 3. Nombre exacto de la base de datos
        self.stdout.write(f'\n3. NOMBRE DE LA BASE DE DATOS: {settings.DATABASES["default"]["NAME"]}')
        
        # 4. Modelo CursoMateria completo
        self.stdout.write('\n4. MODELO CURSOMATERIA:')
        self.stdout.write(f'   Meta.db_table: {CursoMateria._meta.db_table}')
        self.stdout.write(f'   Meta.managed: {CursoMateria._meta.managed}')
        self.stdout.write(f'   Campos:')
        for field in CursoMateria._meta.get_fields():
            self.stdout.write(f'     - {field.name} ({field.__class__.__name__})')
        
        # 5. Connection settings
        self.stdout.write('\n5. CONNECTION SETTINGS_DICT:')
        self.stdout.write(f'   {connection.settings_dict}')
        
        # 6. Conteo ORM
        self.stdout.write('\n6. CONTEO ORM:')
        count_orm = CursoMateria.objects.count()
        self.stdout.write(f'   CursoMateria.objects.count() = {count_orm}')
        
        # 7. QuerySet del endpoint
        self.stdout.write('\n7. QUERYSET DEL ENDPOINT:')
        qs = CursoMateria.objects.select_related('id_curso', 'id_materia', 'id_docente').all()
        self.stdout.write(f'   QuerySet: {qs}')
        self.stdout.write(f'   Count: {qs.count()}')
        
        # 8. SQL generado
        self.stdout.write('\n8. SQL GENERADO:')
        sql, params = qs.query.sql_with_params()
        self.stdout.write(f'   SQL: {sql}')
        self.stdout.write(f'   Params: {params}')
        
        # 9. Verificación de tabla
        self.stdout.write('\n9. VERIFICACIÓN DE TABLA:')
        with connection.cursor() as cursor:
            cursor.execute("SHOW TABLES LIKE 'curso_materia'")
            tables = cursor.fetchall()
            if tables:
                self.stdout.write(f'   Tabla curso_materia EXISTE')
                cursor.execute("SELECT COUNT(*) FROM curso_materia")
                count_sql = cursor.fetchone()[0]
                self.stdout.write(f'   COUNT(*) FROM curso_materia (SQL directo): {count_sql}')
            else:
                self.stdout.write(f'   Tabla curso_materia NO EXISTE')
        
        # 10. Verificación de tablas en la base de datos
        self.stdout.write('\n10. TABLAS EN LA BASE DE DATOS:')
        with connection.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            self.stdout.write(f'   Total tablas: {len(tables)}')
            for table in tables:
                self.stdout.write(f'     - {table[0]}')
        
        self.stdout.write('\n=== FIN DEL DIAGNÓSTICO ===')
