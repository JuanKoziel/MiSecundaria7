from datetime import date

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from gestion.models import (
    ActaAlumno,
    ActaCurso,
    Alumno,
    AsistenciaDiaria,
    Calificacion,
    Comunicado,
    NotaPreceptor,
    Perfil,
    VinculoFamilia,
)


class Command(BaseCommand):
    help = 'Carga datos de demostración'

    def handle(self, *args, **options):
        self.stdout.write('Sembrando datos...')

        users_spec = [
            ('admin', 'admin123', 'admin', '', 'Administrador', 'Sistema', ''),
            ('preceptor', 'preceptor123', 'preceptor', '20.111.222', 'María', 'López', ''),
            ('cgomez', 'docente123', 'docente', '30.123.456', 'Carlos', 'Gómez', 'Matemática'),
            ('lperez', 'docente123', 'docente', '28.987.654', 'Laura', 'Pérez', 'Lengua y Lit.'),
            ('familia', 'familia123', 'familia', '35.444.555', 'Roberto', 'Hoffer', ''),
        ]

        for username, password, role, dni, nombre, apellido, materia in users_spec:
            user, created = User.objects.get_or_create(username=username)
            if created:
                user.set_password(password)
                user.save()
            Perfil.objects.update_or_create(
                user=user,
                defaults={
                    'role': role,
                    'dni': dni,
                    'nombre': nombre,
                    'apellido': apellido,
                    'materia_principal': materia,
                },
            )

        agustin, _ = Alumno.objects.update_or_create(
            dni='44.123.456',
            defaults={'nombre': 'Agustín', 'apellido': 'Hoffer', 'curso': '1°1'},
        )
        sofia, _ = Alumno.objects.update_or_create(
            dni='45.987.654',
            defaults={'nombre': 'Sofía', 'apellido': 'Martínez', 'curso': '1°2'},
        )

        familia_user = User.objects.get(username='familia')
        VinculoFamilia.objects.get_or_create(usuario=familia_user, alumno=agustin)
        VinculoFamilia.objects.get_or_create(usuario=familia_user, alumno=sofia)

        califs = [
            (agustin, 'Matemática', 'TEP', 8, 'TEA', 9, 'Buen desempeño sostenido'),
            (agustin, 'Lengua y Lit.', 'TEA', 9, 'TEP', 8, 'Participación activa'),
            (agustin, 'Física', 'TEP', 7, 'TEP', 8, 'En proceso de mejora'),
            (sofia, 'Matemática', 'TEA', 10, 'TEA', 9, 'Excelente desempeño'),
            (sofia, 'Lengua y Lit.', 'TEP', 8, 'TEP', 8, 'Cumple con los objetivos'),
        ]
        for alumno, materia, p1, n1, p2, n2, diag in califs:
            Calificacion.objects.update_or_create(
                alumno=alumno,
                materia=materia,
                defaults={
                    'prenota1': p1,
                    'nota1': n1,
                    'prenota2': p2,
                    'nota2': n2,
                    'diagnostico': diag,
                },
            )

        NotaPreceptor.objects.update_or_create(alumno=agustin, defaults={'nota': 8})
        NotaPreceptor.objects.update_or_create(alumno=sofia, defaults={'nota': 9})

        fechas_asist = [
            ('2026-05-21', 'Presente'),
            ('2026-05-20', 'Presente'),
            ('2026-05-19', 'Tarde'),
            ('2026-05-18', 'Presente'),
            ('2026-05-17', 'Ausente'),
        ]
        for alumno in [agustin, sofia]:
            for i, (f, est) in enumerate(fechas_asist):
                if alumno == sofia and f == '2026-05-19':
                    est = 'Presente'
                AsistenciaDiaria.objects.update_or_create(
                    alumno=alumno,
                    fecha=f,
                    defaults={'estado': est},
                )

        ActaCurso.objects.get_or_create(
            curso='1°1',
            fecha='2025-03-10',
            defaults={'descripcion': 'Inicio de clases'},
        )
        ActaCurso.objects.get_or_create(
            curso='1°2',
            fecha='2025-03-12',
            defaults={'descripcion': 'Reunión de padres'},
        )

        actas_alumno = [
            (agustin, 'Informe parcial - Matemática', 'Matemática', '2026-05-15', 'Carlos Gómez', 'informe_mat_agustin.pdf'),
            (agustin, 'Acta de evaluación - Lengua', 'Lengua y Lit.', '2026-05-10', 'Laura Pérez', 'acta_lengua_agustin.pdf'),
            (agustin, 'Informe de conducta 1° bimestre', 'General', '2026-04-28', 'Preceptoría', 'conducta_agustin.pdf'),
            (sofia, 'Informe parcial - Matemática', 'Matemática', '2026-05-14', 'Carlos Gómez', 'informe_mat_sofia.pdf'),
            (sofia, 'Acta reunión tutoría', 'General', '2026-05-08', 'Preceptoría', 'tutoria_sofia.pdf'),
        ]
        for alumno, titulo, materia, fecha, cargado, archivo in actas_alumno:
            ActaAlumno.objects.update_or_create(
                alumno=alumno,
                titulo=titulo,
                defaults={
                    'materia': materia,
                    'fecha': fecha,
                    'cargado_por': cargado,
                    'archivo': archivo,
                },
            )

        comunicados = [
            ('1°1', '2026-05-10', 'Reunión de padres', 'Convocatoria para el viernes 16/05 a las 18:00 en el SUM.'),
            ('1°1', '2026-05-05', 'Entrega de informes', 'Disponibles los informes parciales en secretaría.'),
            ('1°2', '2026-05-08', 'Salida educativa', 'Autorización requerida antes del 20/05.'),
        ]
        for curso, fecha, titulo, desc in comunicados:
            Comunicado.objects.update_or_create(
                curso=curso,
                titulo=titulo,
                defaults={'fecha': fecha, 'descripcion': desc},
            )

        self.stdout.write(self.style.SUCCESS('Datos de demostración cargados.'))
        self.stdout.write('Usuarios: admin/admin123, preceptor/preceptor123, cgomez/docente123, familia/familia123')
