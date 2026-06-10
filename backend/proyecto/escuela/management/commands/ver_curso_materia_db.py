from django.core.management.base import BaseCommand
from django.db import connection
from escuela.models import Curso, Materia, CursoMateria


class Command(BaseCommand):
    help = 'Muestra el estado actual de curso_materia en la base de datos'

    def handle(self, *args, **options):
        self.stdout.write('=== ESTADO DE CURSO_MATERIA EN BASE DE DATOS ===\n')
        
        # Verificar tabla ORM
        self.stdout.write('--- CONSULTA ORM ---')
        total_orm = CursoMateria.objects.count()
        self.stdout.write(f'Total de registros (ORM): {total_orm}')
        
        if total_orm > 0:
            primeros = CursoMateria.objects.all()[:5]
            for cm in primeros:
                self.stdout.write(f'  ID: {cm.id_curso_materia} | Curso ID: {cm.id_curso_id} | Materia ID: {cm.id_materia_id} | Docente ID: {cm.id_docente_id}')
        
        # Verificar tabla directa
        self.stdout.write('\n--- CONSULTA DIRECTA SQL ---')
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM curso_materia")
            total_sql = cursor.fetchone()[0]
            self.stdout.write(f'Total de registros (SQL): {total_sql}')
            
            cursor.execute("""
                SELECT cm.id_curso_materia, c.nombre_curso, cm.id_curso, m.nombre_materia, cm.id_materia, cm.id_docente
                FROM curso_materia cm
                LEFT JOIN cursos c ON cm.id_curso = c.id_curso
                LEFT JOIN materias m ON cm.id_materia = m.id_materia
                LIMIT 5
            """)
            for row in cursor.fetchall():
                self.stdout.write(f'  ID: {row[0]} | Curso: {row[1]} (ID: {row[2]}) | Materia: {row[3]} (ID: {row[4]}) | Docente ID: {row[5]}')
        
        # Verificar si hay registros con id_materia NULL
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM curso_materia WHERE id_materia IS NULL")
            null_materias = cursor.fetchone()[0]
            if null_materias > 0:
                self.stdout.write(f'\nWARNING: {null_materias} registros con id_materia NULL')
        
        # Verificar si hay registros con id_curso NULL
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM curso_materia WHERE id_curso IS NULL")
            null_cursos = cursor.fetchone()[0]
            if null_cursos > 0:
                self.stdout.write(f'WARNING: {null_cursos} registros con id_curso NULL')
