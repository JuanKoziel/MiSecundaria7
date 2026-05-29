"""
Comando para crear datos de prueba en todas las tablas principales.

Uso:
    python manage.py seed_datos

Crea datos realistas de prueba para: ciclos lectivos, cursos, materias,
docentes, preceptores, alumnos, padres/tutores, curso-materia, horarios,
inscripciones, periodos de evaluación, calificaciones, estados de asistencia,
asistencias, tipos de acta, actas, acta-alumno, acta-curso y notificaciones.
"""

from datetime import date, time, datetime
from django.core.management.base import BaseCommand
from django.db import connection

from escuela.models import (
    Acta,
    ActaAlumno,
    ActaCurso,
    Alumno,
    Asistencia,
    Calificacion,
    CicloLectivo,
    Curso,
    CursoMateria,
    Docente,
    EstadoAsistencia,
    Horario,
    InscripcionMateria,
    Materia,
    Notificacion,
    PadreTutor,
    PeriodoEvaluacion,
    Preceptor,
    TipoActa,
    Usuario,
)


class Command(BaseCommand):
    help = 'Crea datos de prueba en todas las tablas principales'

    def handle(self, *args, **options):
        self.stdout.write('Creando datos de prueba...\n')

        # --- Ciclos lectivos ---
        ciclo25, _ = CicloLectivo.objects.get_or_create(
            anio=2025,
            defaults={'fecha_inicio': date(2025, 3, 1), 'fecha_fin': date(2025, 12, 15), 'estado': False},
        )
        ciclo26, _ = CicloLectivo.objects.get_or_create(
            anio=2026,
            defaults={'fecha_inicio': date(2026, 3, 2), 'fecha_fin': date(2026, 12, 14), 'estado': True},
        )
        self.stdout.write(self.style.SUCCESS('  Ciclos lectivos: 2025, 2026'))

        # --- Preceptores ---
        preceptor_user = Usuario.objects.filter(usuario='preceptor_test').first()
        preceptor1, _ = Preceptor.objects.get_or_create(
            dni='32.456.789',
            defaults={
                'nombre': 'María',
                'apellido': 'González',
                'correo': 'maria.gonzalez@escuela.edu.ar',
                'telefono': '011-4567-1234',
                'id_usuario': preceptor_user,
            },
        )
        preceptor2, _ = Preceptor.objects.get_or_create(
            dni='31.789.012',
            defaults={
                'nombre': 'Roberto',
                'apellido': 'Sánchez',
                'correo': 'roberto.sanchez@escuela.edu.ar',
                'telefono': '011-4567-5678',
            },
        )
        self.stdout.write(self.style.SUCCESS('  Preceptores: 2 creados'))

        # --- Cursos ---
        cursos_data = [
            ('1°1', 'Mañana', ciclo26, preceptor1),
            ('1°2', 'Mañana', ciclo26, preceptor1),
            ('2°1', 'Mañana', ciclo26, preceptor2),
            ('1°1', 'Mañana', ciclo25, preceptor1),
        ]
        cursos = {}
        for nombre, turno, ciclo, prec in cursos_data:
            key = f'{nombre}-{ciclo.anio}'
            c, _ = Curso.objects.get_or_create(
                nombre_curso=nombre,
                id_ciclo=ciclo,
                defaults={'turno': turno, 'id_preceptor': prec},
            )
            cursos[key] = c
        self.stdout.write(self.style.SUCCESS(f'  Cursos: {len(cursos)} creados'))

        # --- Materias ---
        materias_nombres = ['Matemática', 'Lengua y Lit.', 'Física', 'Química', 'Historia', 'Geografía']
        materias = {}
        for nombre in materias_nombres:
            m, _ = Materia.objects.get_or_create(
                nombre_materia=nombre,
                defaults={'descripcion': f'Materia de {nombre}'},
            )
            materias[nombre] = m
        self.stdout.write(self.style.SUCCESS(f'  Materias: {len(materias)} creadas'))

        # --- Docentes ---
        docente_user = Usuario.objects.filter(usuario='docente_test').first()
        docentes_data = [
            ('Carlos', 'Gómez', '30.123.456', 'carlos.gomez@escuela.edu.ar', docente_user),
            ('Laura', 'Pérez', '28.987.654', 'laura.perez@escuela.edu.ar', None),
            ('Andrés', 'Rodríguez', '33.456.123', 'andres.rodriguez@escuela.edu.ar', None),
        ]
        docentes = []
        for nombre, apellido, dni, correo, user in docentes_data:
            d, _ = Docente.objects.get_or_create(
                dni=dni,
                defaults={
                    'nombre': nombre,
                    'apellido': apellido,
                    'correo': correo,
                    'telefono': '011-5555-0000',
                    'id_usuario': user,
                },
            )
            docentes.append(d)
        self.stdout.write(self.style.SUCCESS(f'  Docentes: {len(docentes)} creados'))

        # --- Padres / tutores ---
        familia_user = Usuario.objects.filter(usuario='familia_test').first()
        tutores_data = [
            ('Ricardo', 'Hoffer', '25.111.222', '011-4444-1111', familia_user),
            ('Ana', 'Martínez', '26.333.444', '011-4444-2222', None),
            ('Miguel', 'Fernández', '27.555.666', '011-4444-3333', None),
        ]
        tutores = []
        for nombre, apellido, dni, tel, user in tutores_data:
            t, _ = PadreTutor.objects.get_or_create(
                dni=dni,
                defaults={
                    'nombre': nombre,
                    'apellido': apellido,
                    'telefono': tel,
                    'direccion': 'Calle Falsa 123',
                    'id_usuario': user,
                },
            )
            tutores.append(t)
        self.stdout.write(self.style.SUCCESS(f'  Padres/Tutores: {len(tutores)} creados'))

        # --- Alumnos ---
        c11_26 = cursos.get('1°1-2026')
        c12_26 = cursos.get('1°2-2026')
        c21_26 = cursos.get('2°1-2026')
        c11_25 = cursos.get('1°1-2025')

        alumno_user = Usuario.objects.filter(usuario='alumno_test').first()
        alumnos_data = [
            ('Agustín', 'Hoffer', '44.123.456', date(2010, 3, 15), c11_26, tutores[0], alumno_user),
            ('Sofía', 'Martínez', '45.987.654', date(2010, 7, 22), c12_26, tutores[1], None),
            ('Lucas', 'Fernández', '46.111.222', date(2010, 11, 5), c11_26, tutores[2], None),
            ('Valentina', 'López', '47.222.333', date(2010, 1, 8), c12_26, tutores[0], None),
            ('Mateo', 'García', '48.333.444', date(2010, 5, 30), c21_26, tutores[1], None),
            ('Camila', 'Rodríguez', '49.444.555', date(2010, 9, 12), c21_26, tutores[2], None),
        ]
        alumnos = []
        for nombre, apellido, dni, fecha_nac, curso, tutor, usr in alumnos_data:
            a, _ = Alumno.objects.get_or_create(
                dni=dni,
                defaults={
                    'nombre': nombre,
                    'apellido': apellido,
                    'fecha_nacimiento': fecha_nac,
                    'direccion': 'Dirección de prueba',
                    'id_curso': curso,
                    'id_tutor': tutor,
                    'id_usuario': usr,
                },
            )
            if usr and not a.id_usuario:
                a.id_usuario = usr
                a.save()
            alumnos.append(a)
        self.stdout.write(self.style.SUCCESS(f'  Alumnos: {len(alumnos)} creados'))

        # --- Curso-Materia (asignaciones docentes) ---
        cm_data = [
            (c11_26, materias['Matemática'], docentes[0]),
            (c11_26, materias['Lengua y Lit.'], docentes[1]),
            (c11_26, materias['Física'], docentes[0]),
            (c12_26, materias['Matemática'], docentes[0]),
            (c12_26, materias['Lengua y Lit.'], docentes[1]),
            (c12_26, materias['Química'], docentes[2]),
            (c21_26, materias['Matemática'], docentes[0]),
            (c21_26, materias['Historia'], docentes[2]),
            (c21_26, materias['Geografía'], docentes[1]),
            (c11_25, materias['Matemática'], docentes[0]),
            (c11_25, materias['Lengua y Lit.'], docentes[1]),
        ]
        cms = []
        for curso, materia, docente in cm_data:
            if not curso:
                continue
            cm, _ = CursoMateria.objects.get_or_create(
                id_curso=curso,
                id_materia=materia,
                defaults={'id_docente': docente},
            )
            cms.append(cm)
        self.stdout.write(self.style.SUCCESS(f'  Curso-Materia: {len(cms)} asignaciones'))

        # --- Horarios ---
        horas = [
            (time(7, 30), time(9, 0)),
            (time(9, 15), time(10, 45)),
            (time(11, 0), time(12, 30)),
            (time(13, 30), time(15, 0)),
        ]
        horarios_count = 0
        for i, cm in enumerate(cms):
            h_inicio, h_fin = horas[i % len(horas)]
            _, created = Horario.objects.get_or_create(
                id_curso_materia=cm,
                dia_semana='Lunes',
                defaults={
                    'hora_inicio': h_inicio,
                    'hora_fin': h_fin,
                    'aula': f'Aula {(i % 6) + 1}',
                },
            )
            if created:
                horarios_count += 1
        self.stdout.write(self.style.SUCCESS(f'  Horarios: {horarios_count} creados'))

        # --- Inscripciones ---
        insc_count = 0
        for alumno in alumnos:
            if not alumno.id_curso:
                continue
            alumno_cms = [cm for cm in cms if cm.id_curso_id == alumno.id_curso_id]
            for cm in alumno_cms:
                _, created = InscripcionMateria.objects.get_or_create(
                    id_alumno=alumno,
                    id_curso_materia=cm,
                    defaults={
                        'estado': 'Activa',
                        'fecha_inscripcion': date(2026, 3, 1),
                    },
                )
                if created:
                    insc_count += 1
        self.stdout.write(self.style.SUCCESS(f'  Inscripciones: {insc_count} creadas'))

        # --- Periodos de evaluación ---
        periodos_data = [
            ('1er Trimestre', 1),
            ('2do Trimestre', 2),
            ('3er Trimestre', 3),
        ]
        periodos = []
        for nombre, orden in periodos_data:
            p, _ = PeriodoEvaluacion.objects.get_or_create(
                nombre_periodo=nombre,
                defaults={'orden_periodo': orden},
            )
            periodos.append(p)
        self.stdout.write(self.style.SUCCESS(f'  Periodos: {len(periodos)} creados'))

        # --- Estados de asistencia ---
        estados_data = ['Presente', 'Ausente', 'Tarde', 'Justificado']
        estados = {}
        for nombre in estados_data:
            e, _ = EstadoAsistencia.objects.get_or_create(nombre_estado=nombre)
            estados[nombre] = e
        self.stdout.write(self.style.SUCCESS(f'  Estados asistencia: {len(estados)} creados'))

        # --- Calificaciones ---
        admin_user = Usuario.objects.filter(usuario='admin_test').first()
        notas_data = [
            (alumnos[0], cms[0], docentes[0], periodos[0], 'TEP', 8, 'Buen desempeño sostenido'),
            (alumnos[0], cms[1], docentes[1], periodos[0], 'TEA', 9, 'Participación activa'),
            (alumnos[0], cms[2], docentes[0], periodos[0], 'TEP', 7, 'Cumple objetivos'),
            (alumnos[2], cms[0], docentes[0], periodos[0], 'TEP', 7, 'En proceso de mejora'),
            (alumnos[2], cms[1], docentes[1], periodos[0], 'TEP', 6, 'Debe reforzar lectura'),
            (alumnos[1], cms[3], docentes[0], periodos[0], 'TEA', 10, 'Excelente desempeño'),
            (alumnos[1], cms[4], docentes[1], periodos[0], 'TEP', 8, 'Cumple con los objetivos'),
            (alumnos[3], cms[5], docentes[2], periodos[0], 'TEP', 7, 'Rendimiento adecuado'),
            (alumnos[4], cms[6], docentes[0], periodos[0], 'TEA', 9, 'Muy buen rendimiento'),
            (alumnos[5], cms[7], docentes[2], periodos[0], 'TEP', 8, 'Buen desempeño'),
        ]
        cal_count = 0
        for alumno, cm, docente, periodo, pre, nota, diag in notas_data:
            _, created = Calificacion.objects.get_or_create(
                id_alumno=alumno,
                id_curso_materia=cm,
                id_periodo=periodo,
                defaults={
                    'id_docente': docente,
                    'pre_nota': pre,
                    'nota_numerica': nota,
                    'diagnostico': diag,
                    'fecha_carga': datetime(2026, 5, 20, 14, 0),
                },
            )
            if created:
                cal_count += 1
        self.stdout.write(self.style.SUCCESS(f'  Calificaciones: {cal_count} creadas'))

        # --- Asistencias ---
        fechas_asist = [date(2026, 5, 19), date(2026, 5, 20), date(2026, 5, 21)]
        asist_count = 0
        patrones = ['Presente', 'Presente', 'Ausente', 'Presente', 'Tarde', 'Presente']
        for fecha in fechas_asist:
            for i, alumno in enumerate(alumnos):
                if not alumno.id_curso:
                    continue
                alumno_cms = [cm for cm in cms if cm.id_curso_id == alumno.id_curso_id]
                if not alumno_cms:
                    continue
                cm = alumno_cms[0]
                estado_nombre = patrones[(i + fechas_asist.index(fecha)) % len(patrones)]
                estado = estados[estado_nombre]
                _, created = Asistencia.objects.get_or_create(
                    id_alumno=alumno,
                    id_curso_materia=cm,
                    fecha=fecha,
                    defaults={
                        'id_usuario': admin_user,
                        'id_estado_asistencia': estado,
                    },
                )
                if created:
                    asist_count += 1
        self.stdout.write(self.style.SUCCESS(f'  Asistencias: {asist_count} creadas'))

        # --- Tipos de acta ---
        tipos_acta_data = ['Informe parcial', 'Acta de evaluación', 'Informe de conducta', 'Acta reunión']
        tipos_acta = {}
        for nombre in tipos_acta_data:
            t, _ = TipoActa.objects.get_or_create(nombre_tipo=nombre)
            tipos_acta[nombre] = t
        self.stdout.write(self.style.SUCCESS(f'  Tipos de acta: {len(tipos_acta)} creados'))

        # --- Actas ---
        actas_data = [
            ('Informe parcial - Matemática 1°1', 'Informe de rendimiento del primer trimestre', datetime(2026, 5, 15), tipos_acta['Informe parcial']),
            ('Acta de evaluación - Lengua 1°1', 'Evaluación de desempeño en comprensión lectora', datetime(2026, 5, 10), tipos_acta['Acta de evaluación']),
            ('Informe de conducta 1° bimestre', 'Observaciones de comportamiento general', datetime(2026, 4, 28), tipos_acta['Informe de conducta']),
            ('Acta reunión tutoría 1°2', 'Reunión con padres por seguimiento académico', datetime(2026, 5, 8), tipos_acta['Acta reunión']),
            ('Informe parcial - Física 1°1', 'Informe de prácticas de laboratorio', datetime(2026, 5, 12), tipos_acta['Informe parcial']),
            ('Inicio de clases 1°1', 'Acta de inicio del ciclo lectivo 2026', datetime(2026, 3, 10), tipos_acta['Acta reunión']),
            ('Reunión de padres 1°2', 'Primera reunión de padres del año', datetime(2026, 3, 12), tipos_acta['Acta reunión']),
        ]
        actas = []
        for titulo, desc, fecha, tipo in actas_data:
            a, _ = Acta.objects.get_or_create(
                titulo=titulo,
                defaults={
                    'descripcion': desc,
                    'fecha': fecha,
                    'id_tipo_acta': tipo,
                    'id_usuario_creador': admin_user,
                },
            )
            actas.append(a)
        self.stdout.write(self.style.SUCCESS(f'  Actas: {len(actas)} creadas'))

        # --- Acta-Alumno ---
        acta_alumno_data = [
            (actas[0], alumnos[0]),
            (actas[0], alumnos[2]),
            (actas[1], alumnos[0]),
            (actas[2], alumnos[0]),
            (actas[3], alumnos[1]),
            (actas[4], alumnos[2]),
        ]
        aa_count = 0
        for acta, alumno in acta_alumno_data:
            _, created = ActaAlumno.objects.get_or_create(
                id_acta=acta,
                id_alumno=alumno,
            )
            if created:
                aa_count += 1
        self.stdout.write(self.style.SUCCESS(f'  Acta-Alumno: {aa_count} creadas'))

        # --- Acta-Curso ---
        ac_data = [
            (actas[5], c11_26),
            (actas[6], c12_26),
        ]
        ac_count = 0
        for acta, curso in ac_data:
            if not curso:
                continue
            _, created = ActaCurso.objects.get_or_create(
                id_acta=acta,
                id_curso=curso,
            )
            if created:
                ac_count += 1
        self.stdout.write(self.style.SUCCESS(f'  Acta-Curso: {ac_count} creadas'))

        # --- Notificaciones ---
        notif_data = [
            ('Reunión de padres', 'Convocatoria para el viernes 16/05 a las 18:00 en el SUM.', datetime(2026, 5, 10)),
            ('Entrega de informes', 'Disponibles los informes parciales en secretaría.', datetime(2026, 5, 5)),
            ('Salida educativa', 'Autorización requerida antes del 20/05.', datetime(2026, 5, 8)),
        ]
        notif_count = 0
        for titulo, mensaje, fecha in notif_data:
            _, created = Notificacion.objects.get_or_create(
                titulo=titulo,
                defaults={
                    'mensaje': mensaje,
                    'fecha': fecha,
                    'id_usuario': admin_user,
                    'leida': False,
                },
            )
            if created:
                notif_count += 1
        self.stdout.write(self.style.SUCCESS(f'  Notificaciones: {notif_count} creadas'))

        self.stdout.write(self.style.SUCCESS('\nDatos de prueba creados exitosamente.'))
        self.stdout.write('\nResumen:')
        self.stdout.write(f'  - 2 ciclos lectivos (2025, 2026)')
        self.stdout.write(f'  - 4 cursos (1°1, 1°2, 2°1 para 2026 + 1°1 para 2025)')
        self.stdout.write(f'  - 6 materias')
        self.stdout.write(f'  - 3 docentes')
        self.stdout.write(f'  - 2 preceptores')
        self.stdout.write(f'  - 6 alumnos')
        self.stdout.write(f'  - 3 padres/tutores')
        self.stdout.write(f'  - {len(cms)} asignaciones curso-materia')
        self.stdout.write(f'  - 3 periodos de evaluación')
        self.stdout.write(f'  - 4 estados de asistencia')
        self.stdout.write(f'  - Calificaciones, asistencias, actas y notificaciones de prueba')
