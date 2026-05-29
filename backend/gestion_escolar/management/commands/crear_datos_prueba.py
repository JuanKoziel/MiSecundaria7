from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from gestion_escolar.models import (
    Usuario, Rol, UsuarioRol, Docente, Preceptor,
    Alumno, PadreTutor, Directivo, Curso, CicloLectivo, Materia, CursoMateria
)


class Command(BaseCommand):
    help = 'Crea datos de prueba para el sistema'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🔄 Iniciando creación de datos de prueba...'))

        # ==========================================
        # 1. Crear Roles
        # ==========================================
        roles_data = [
            {'nombre_rol': 'admin'},
            {'nombre_rol': 'docente'},
            {'nombre_rol': 'preceptor'},
            {'nombre_rol': 'familia'},
            {'nombre_rol': 'alumno'},
        ]

        roles = {}
        for rol_data in roles_data:
            rol, created = Rol.objects.get_or_create(**rol_data)
            roles[rol_data['nombre_rol']] = rol
            status = '✅ Creado' if created else '⏩ Ya existe'
            self.stdout.write(f'  {status}: Rol "{rol_data["nombre_rol"]}"')

        # ==========================================
        # 2. Crear Ciclo Lectivo
        # ==========================================
        ciclo, created = CicloLectivo.objects.get_or_create(
            anio=2026,
            defaults={'estado': True, 'fecha_inicio': '2026-03-01', 'fecha_fin': '2026-11-30'}
        )
        status = '✅ Creado' if created else '⏩ Ya existe'
        self.stdout.write(f'  {status}: Ciclo Lectivo 2026')

        # ==========================================
        # 3. Crear Usuario Admin
        # ==========================================
        admin_user, created = Usuario.objects.get_or_create(
            usuario='admin',
            defaults={'contrasena': make_password('admin123'), 'estado': True}
        )
        UsuarioRol.objects.get_or_create(id_usuario=admin_user, id_rol=roles['admin'])
        status = '✅ Creado' if created else '⏩ Ya existe'
        self.stdout.write(f'  {status}: Usuario Admin (usuario: "admin", contraseña: "admin123")')

        # ==========================================
        # 4. Crear Docentes
        # ==========================================
        docentes_data = [
            {
                'usuario': 'prof_juan',
                'nombre': 'Juan',
                'apellido': 'García',
                'dni': '25123456',
                'correo': 'juan@escuela.com',
                'telefono': '1123456789'
            },
            {
                'usuario': 'prof_maria',
                'nombre': 'María',
                'apellido': 'López',
                'dni': '26987654',
                'correo': 'maria@escuela.com',
                'telefono': '1187654321'
            },
        ]

        docentes = {}
        for docente_data in docentes_data:
            usuario_username = docente_data.pop('usuario')
            nombre = docente_data.pop('nombre')
            apellido = docente_data.pop('apellido')
            
            user, user_created = Usuario.objects.get_or_create(
                usuario=usuario_username,
                defaults={'contrasena': make_password('docente123'), 'estado': True}
            )
            
            if user_created:
                UsuarioRol.objects.get_or_create(id_usuario=user, id_rol=roles['docente'])
            
            docente, doc_created = Docente.objects.get_or_create(
                dni=docente_data['dni'],
                defaults={**docente_data, 'nombre': nombre, 'apellido': apellido, 'id_usuario': user}
            )
            
            docentes[usuario_username] = docente
            status = '✅ Creado' if doc_created else '⏩ Ya existe'
            self.stdout.write(f'  {status}: Docente {nombre} {apellido} (usuario: "{usuario_username}")')

        # ==========================================
        # 5. Crear Preceptor
        # ==========================================
        preceptor_user, preceptor_user_created = Usuario.objects.get_or_create(
            usuario='preceptor_carlos',
            defaults={'contrasena': make_password('preceptor123'), 'estado': True}
        )
        
        if preceptor_user_created:
            UsuarioRol.objects.get_or_create(id_usuario=preceptor_user, id_rol=roles['preceptor'])
        
        preceptor, preceptor_created = Preceptor.objects.get_or_create(
            dni='27111222',
            defaults={
                'nombre': 'Carlos',
                'apellido': 'Rodríguez',
                'correo': 'carlos@escuela.com',
                'telefono': '1133334444',
                'id_usuario': preceptor_user
            }
        )
        status = '✅ Creado' if preceptor_created else '⏩ Ya existe'
        self.stdout.write(f'  {status}: Preceptor Carlos Rodríguez (usuario: "preceptor_carlos")')

        # ==========================================
        # 6. Crear Curso
        # ==========================================
        curso, curso_created = Curso.objects.get_or_create(
            nombre_curso='1ro A',
            defaults={'turno': 'Mañana', 'id_preceptor': preceptor, 'id_ciclo': ciclo}
        )
        status = '✅ Creado' if curso_created else '⏩ Ya existe'
        self.stdout.write(f'  {status}: Curso 1ro A')

        # ==========================================
        # 7. Crear Materias
        # ==========================================
        materias_data = [
            {'nombre_materia': 'Matemática', 'descripcion': 'Asignatura de cálculo y álgebra'},
            {'nombre_materia': 'Lengua', 'descripcion': 'Asignatura de literatura y escritura'},
            {'nombre_materia': 'Historia', 'descripcion': 'Asignatura de historia y geografía'},
        ]

        materias = {}
        for materia_data in materias_data:
            materia, created = Materia.objects.get_or_create(**materia_data)
            materias[materia_data['nombre_materia']] = materia
            status = '✅ Creada' if created else '⏩ Ya existe'
            self.stdout.write(f'  {status}: Materia "{materia_data["nombre_materia"]}"')

        # ==========================================
        # 8. Asignar Materias a Docentes en el Curso
        # ==========================================
        for idx, (materia_nombre, docente_username) in enumerate([
            ('Matemática', 'prof_juan'),
            ('Lengua', 'prof_maria'),
            ('Historia', 'prof_juan'),
        ]):
            curso_materia, created = CursoMateria.objects.get_or_create(
                id_curso=curso,
                id_materia=materias[materia_nombre],
                id_docente=docentes[docente_username]
            )
            status = '✅ Asignada' if created else '⏩ Ya existe'
            self.stdout.write(f'  {status}: {materia_nombre} a {docente_username} en 1ro A')

        # ==========================================
        # 9. Crear Padres/Tutores
        # ==========================================
        padre_user, padre_user_created = Usuario.objects.get_or_create(
            usuario='familia_anna',
            defaults={'contrasena': make_password('familia123'), 'estado': True}
        )
        
        if padre_user_created:
            UsuarioRol.objects.get_or_create(id_usuario=padre_user, id_rol=roles['familia'])
        
        padre, padre_created = PadreTutor.objects.get_or_create(
            dni='28999888',
            defaults={
                'nombre': 'Anna',
                'apellido': 'Martínez',
                'telefono': '1155556666',
                'direccion': 'Calle Principal 123',
                'id_usuario': padre_user
            }
        )
        status = '✅ Creado' if padre_created else '⏩ Ya existe'
        self.stdout.write(f'  {status}: Padre/Tutor Anna Martínez (usuario: "familia_anna")')

        # ==========================================
        # 10. Crear Alumnos
        # ==========================================
        alumno_user, alumno_user_created = Usuario.objects.get_or_create(
            usuario='alumno_lucas',
            defaults={'contrasena': make_password('alumno123'), 'estado': True}
        )
        
        if alumno_user_created:
            UsuarioRol.objects.get_or_create(id_usuario=alumno_user, id_rol=roles['alumno'])
        
        alumno, alumno_created = Alumno.objects.get_or_create(
            dni='29777666',
            defaults={
                'nombre': 'Lucas',
                'apellido': 'Martínez',
                'fecha_nacimiento': '2010-05-15',
                'direccion': 'Calle Principal 123',
                'telefono': '1155556666',
                'procedencia': 'Primaria Local',
                'id_usuario': alumno_user,
                'id_tutor': padre,
                'id_curso': curso
            }
        )
        status = '✅ Creado' if alumno_created else '⏩ Ya existe'
        self.stdout.write(f'  {status}: Alumno Lucas Martínez (usuario: "alumno_lucas")')

        # ==========================================
        # Resumen
        # ==========================================
        self.stdout.write(self.style.SUCCESS('\n✅ ¡Datos de prueba creados exitosamente!\n'))
        self.stdout.write('📋 Usuarios de prueba:\n')
        self.stdout.write('  👤 Admin:      usuario="admin"              contraseña="admin123"')
        self.stdout.write('  👨‍🏫 Docente 1:  usuario="prof_juan"          contraseña="docente123"')
        self.stdout.write('  👨‍🏫 Docente 2:  usuario="prof_maria"         contraseña="docente123"')
        self.stdout.write('  👨‍⚖️  Preceptor:  usuario="preceptor_carlos"   contraseña="preceptor123"')
        self.stdout.write('  👨‍👩‍👧 Familia:    usuario="familia_anna"       contraseña="familia123"')
        self.stdout.write('  👨‍🎓 Alumno:    usuario="alumno_lucas"      contraseña="alumno123"')
        self.stdout.write('\n🔗 Próximo paso: python manage.py runserver')
