from datetime import datetime
from django.utils import timezone
from django.db import transaction
from escuela.models import (
    Alumno, Curso, Materia, CursoMateria, Calificacion, PeriodoEvaluacion,
    HistorialAcademico, MateriaAdeudada, HistorialCursoAlumno, PromocionAlumno,
    RecursadaMateria, BloqueoHorarioAlumno, RegistroRendicionPrevia,
    RendicionMateriaAdeudada, SituacionMateriaAlumno, Horario, HorariosEspeciales
)


def consolidar_historial_alumno(alumno, anio_lectivo):
    """Consolida las calificaciones del año y actualiza/crea el historial académico."""
    curso_actual = alumno.id_curso
    if not curso_actual:
        return

    curso_materias = CursoMateria.objects.filter(id_curso=curso_actual, activo=True)
    periodos = PeriodoEvaluacion.objects.filter(estado=True).order_by('orden_periodo')
    p1 = periodos.filter(orden_periodo=1).first()
    p2 = periodos.filter(orden_periodo=2).first()

    for cm in curso_materias:
        cals = Calificacion.objects.filter(id_alumno=alumno, id_curso_materia=cm)
        nota1 = None
        nota2 = None
        if p1:
            n1_obj = cals.filter(id_periodo=p1).first()
            if n1_obj:
                nota1 = n1_obj.nota_numerica
        if p2:
            n2_obj = cals.filter(id_periodo=p2).first()
            if n2_obj:
                nota2 = n2_obj.nota_numerica

        notas_validos = [n for n in [nota1, nota2] if n is not None]
        nota_final = sum(notas_validos) / len(notas_validos) if notas_validos else None

        estado_materia = 'no_cursada'
        periodo_aprob = None
        if nota_final is not None:
            if nota_final >= 7:
                estado_materia = 'aprobada'
                periodo_aprob = 'cuatrimestre'
            else:
                estado_materia = 'adeudada'

        HistorialAcademico.objects.update_or_create(
            id_alumno=alumno,
            id_curso_materia=cm,
            anio_lectivo=anio_lectivo,
            defaults={
                'id_curso': curso_actual,
                'id_materia': cm.id_materia,
                'nota_1_cuatrimestre': nota1,
                'nota_2_cuatrimestre': nota2,
                'nota_final': nota_final,
                'estado_materia': estado_materia,
                'periodo_aprobacion': periodo_aprob,
                'anio_aprobacion': anio_lectivo if estado_materia in ('aprobada', 'intensificacion') else None,
            }
        )

        if estado_materia == 'adeudada':
            MateriaAdeudada.objects.get_or_create(
                id_alumno=alumno,
                id_materia=cm.id_materia,
                id_curso_origen=curso_actual,
                defaults={
                    'tipo_deuda': 'PREVIA',
                    'estado': 'ADEUDADA',
                    'fecha_generacion': timezone.now()
                }
            )


@transaction.atomic
def procesar_cierre_ciclo(anio_lectivo):
    """Procesa el cierre de ciclo lectivo para todos los alumnos activos."""
    alumnos = Alumno.objects.filter(estado=True).select_related('id_curso')
    for alumno in alumnos:
        if not alumno.id_curso:
            continue
        consolidar_historial_alumno(alumno, anio_lectivo)

        HistorialCursoAlumno.objects.update_or_create(
            id_alumno=alumno,
            anio_lectivo=anio_lectivo,
            defaults={
                'id_curso': alumno.id_curso,
                'estado': 'FINALIZADO',
                'fecha_finalizacion': timezone.now().date()
            }
        )

        previas_pendientes = MateriaAdeudada.objects.filter(
            id_alumno=alumno, estado='ADEUDADA', tipo_deuda='PREVIA'
        ).order_by('fecha_generacion')

        if previas_pendientes.count() > 4:
            excedentes = previas_pendientes[4:]
            for ex in excedentes:
                ex.tipo_deuda = 'RECURSADA'
                ex.save(update_fields=['tipo_deuda'])
                RecursadaMateria.objects.get_or_create(
                    id_alumno=alumno,
                    id_materia=ex.id_materia,
                    id_curso_origen=ex.id_curso_origen,
                    id_curso_recursada=ex.id_curso_origen,
                    anio_inicio=anio_lectivo,
                    defaults={
                        'estado': 'ACTIVA',
                        'motivo': 'Exceso de 4 previas (recursada obligatoria)',
                        'fecha_registro': timezone.now()
                    }
                )


def detectar_superposiciones_y_bloqueos(alumno, anio_lectivo):
    """Detecta superposiciones horarias entre materias recursadas y el año actual."""
    curso_actual = alumno.id_curso
    if not curso_actual:
        return

    recursadas_activas = RecursadaMateria.objects.filter(
        id_alumno=alumno, estado='ACTIVA'
    ).select_related('id_curso_recursada', 'id_materia')

    if not recursadas_activas.exists():
        return

    cms_actuales = CursoMateria.objects.filter(id_curso=curso_actual, activo=True)

    for rec in recursadas_activas:
        cm_recs = CursoMateria.objects.filter(id_curso=rec.id_curso_recursada, id_materia=rec.id_materia)
        if not cm_recs.exists():
            continue
        cm_rec = cm_recs.first()
        horarios_rec = list(Horario.objects.filter(id_curso_materia=cm_rec))

        for cm_act in cms_actuales:
            if cm_act.id_materia == rec.id_materia:
                continue
            horarios_act = list(Horario.objects.filter(id_curso_materia=cm_act))

            for hr in horarios_rec:
                for ha in horarios_act:
                    if hr.dia_semana and ha.dia_semana and hr.dia_semana.lower() == ha.dia_semana.lower():
                        if hr.id_modulo_id and ha.id_modulo_id and hr.id_modulo_id == ha.id_modulo_id:
                            BloqueoHorarioAlumno.objects.update_or_create(
                                id_alumno=alumno,
                                id_materia_bloqueada=cm_act.id_materia,
                                defaults={
                                    'id_curso_materia_bloqueada': cm_act,
                                    'id_materia_prioritaria': rec.id_materia,
                                    'id_curso_materia_prioritaria': cm_rec,
                                    'id_materia_recursada': rec.id_materia,
                                    'id_curso_materia_recursada': cm_rec,
                                    'motivo': 'SUPERPOSICION_RECURSADA',
                                    'estado': True,
                                    'fecha_bloqueo': timezone.now(),
                                    'observaciones': f'Bloqueada por superposición con recursada de {rec.id_materia.nombre_materia}'
                                }
                            )

                            SituacionMateriaAlumno.objects.update_or_create(
                                id_alumno=alumno,
                                id_curso_materia=cm_act,
                                anio_lectivo=anio_lectivo,
                                defaults={
                                    'situacion': 'BLOQUEADA',
                                    'motivo_bloqueo': f'Superposición con recursada de {rec.id_materia.nombre_materia}',
                                    'fecha_inicio': timezone.now()
                                }
                            )
