from django.test import TestCase
from django.utils import timezone
from escuela.models import (
    Alumno, Curso, Materia, CursoMateria, Calificacion, PeriodoEvaluacion,
    HistorialAcademico, MateriaAdeudada, HistorialCursoAlumno, PromocionAlumno,
    RecursadaMateria, BloqueoHorarioAlumno, RegistroRendicionPrevia,
    RendicionMateriaAdeudada, SituacionMateriaAlumno, Horario, Modulos, Docente
)
from escuela.academico import (
    consolidar_historial_alumno, procesar_cierre_ciclo, detectar_superposiciones_y_bloqueos
)
from .factories import (
    crear_alumno, crear_curso, crear_materia, crear_curso_materia,
    crear_docente, crear_usuario, cliente_para
)


class SistemaAcademicoTests(TestCase):

    def setUp(self):
        self.ciclo = 2026
        self.docente = crear_docente()
        self.curso1 = crear_curso('1°1')
        self.m1 = crear_materia('Matemática')
        self.m2 = crear_materia('Prácticas del Lenguaje')
        self.m3 = crear_materia('Historia')
        self.m4 = crear_materia('Geografía')
        self.m5 = crear_materia('Biología')
        self.m6 = crear_materia('Física')

        self.cm1 = crear_curso_materia(self.curso1, self.m1, self.docente)
        self.cm2 = crear_curso_materia(self.curso1, self.m2, self.docente)

        self.alumno = crear_alumno(id_curso=self.curso1)
        self.periodo1 = PeriodoEvaluacion.objects.create(nombre_periodo='1° Cuatrimestre', orden_periodo=1, estado=True)
        self.periodo2 = PeriodoEvaluacion.objects.create(nombre_periodo='2° Cuatrimestre', orden_periodo=2, estado=True)

    def test_alumno_aprueba_normalmente(self):
        Calificacion.objects.create(
            id_alumno=self.alumno, id_curso_materia=self.cm1,
            id_docente=self.docente, id_periodo=self.periodo1, nota_numerica=8
        )
        Calificacion.objects.create(
            id_alumno=self.alumno, id_curso_materia=self.cm1,
            id_docente=self.docente, id_periodo=self.periodo2, nota_numerica=8
        )
        consolidar_historial_alumno(self.alumno, self.ciclo)
        hist = HistorialAcademico.objects.get(id_alumno=self.alumno, id_curso_materia=self.cm1)
        self.assertEqual(hist.estado_materia, 'aprobada')
        self.assertEqual(hist.nota_final, 8)

    def test_alumno_desaprueba_y_pasa_a_adeudada(self):
        Calificacion.objects.create(
            id_alumno=self.alumno, id_curso_materia=self.cm1,
            id_docente=self.docente, id_periodo=self.periodo1, nota_numerica=4
        )
        Calificacion.objects.create(
            id_alumno=self.alumno, id_curso_materia=self.cm1,
            id_docente=self.docente, id_periodo=self.periodo2, nota_numerica=4
        )
        consolidar_historial_alumno(self.alumno, self.ciclo)
        hist = HistorialAcademico.objects.get(id_alumno=self.alumno, id_curso_materia=self.cm1)
        self.assertEqual(hist.estado_materia, 'adeudada')
        self.assertTrue(MateriaAdeudada.objects.filter(id_alumno=self.alumno, id_materia=self.m1).exists())

    def test_limite_cuatro_previas_quinta_recursada(self):
        materias = [self.m1, self.m2, self.m3, self.m4, self.m5]
        for m in materias:
            cm = CursoMateria.objects.filter(id_curso=self.curso1, id_materia=m).first()
            if not cm:
                cm = crear_curso_materia(self.curso1, m, self.docente)
            HistorialAcademico.objects.create(
                id_alumno=self.alumno, id_curso_materia=cm, id_curso=self.curso1,
                id_materia=m, anio_lectivo=self.ciclo, nota_final=3, estado_materia='adeudada'
            )
            MateriaAdeudada.objects.create(
                id_alumno=self.alumno, id_materia=m, id_curso_origen=self.curso1,
                tipo_deuda='PREVIA', estado='ADEUDADA', fecha_generacion=timezone.now()
            )

        procesar_cierre_ciclo(self.ciclo)

        previas_count = MateriaAdeudada.objects.filter(id_alumno=self.alumno, tipo_deuda='PREVIA', estado='ADEUDADA').count()
        recursadas_count = MateriaAdeudada.objects.filter(id_alumno=self.alumno, tipo_deuda='RECURSADA').count()
        self.assertLessEqual(previas_count, 4)
        self.assertGreaterEqual(recursadas_count, 1)

    def test_rendir_previa_aprobada(self):
        ma = MateriaAdeudada.objects.create(
            id_alumno=self.alumno, id_materia=self.m1, id_curso_origen=self.curso1,
            tipo_deuda='PREVIA', estado='ADEUDADA', fecha_generacion=timezone.now()
        )
        HistorialAcademico.objects.create(
            id_alumno=self.alumno, id_curso_materia=self.cm1, id_curso=self.curso1,
            id_materia=self.m1, anio_lectivo=self.ciclo, nota_final=3, estado_materia='adeudada'
        )

        user = crear_usuario('doc_previa', roles=('docente',))
        self.docente.id_usuario = user
        self.docente.save()

        client = cliente_para('doc_previa')
        resp = client.post(f'/api/materias-adeudadas/{ma.id_materia_adeudada}/rendir/', {
            'nota': 8,
            'periodo': 'MARZO',
            'anio_rendicion': 2027,
            'id_docente': self.docente.id_docente
        })
        self.assertEqual(resp.status_code, 200)
        ma.refresh_from_db()
        self.assertEqual(ma.estado, 'APROBADA')
        hist = HistorialAcademico.objects.get(id_alumno=self.alumno, id_materia=self.m1, id_curso=self.curso1)
        self.assertEqual(hist.estado_materia, 'aprobada')
        self.assertEqual(hist.periodo_aprobacion, 'previa')

    def test_superposicion_horaria(self):
        mod = Modulos.objects.create(nombre='M1', hora_inicio='08:00:00', hora_fin='09:00:00')
        Horario.objects.create(id_curso_materia=self.cm1, dia_semana='Lunes', id_modulo=mod)
        Horario.objects.create(id_curso_materia=self.cm2, dia_semana='Lunes', id_modulo=mod)

        RecursadaMateria.objects.create(
            id_alumno=self.alumno,
            id_materia=self.m1,
            id_curso_origen=self.curso1,
            id_curso_recursada=self.curso1,
            anio_inicio=2026,
            estado='ACTIVA',
            fecha_registro=timezone.now()
        )

        detectar_superposiciones_y_bloqueos(self.alumno, self.ciclo)
        self.assertTrue(BloqueoHorarioAlumno.objects.filter(id_alumno=self.alumno).exists())

    def test_boletin_api_endpoint(self):
        user = crear_usuario('user_al_test', roles=('alumno',))
        self.alumno.id_usuario = user
        self.alumno.save()

        client = cliente_para('user_al_test')
        resp = client.get(f'/api/boletin-academico/{self.alumno.id_alumno}/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data['alumno']['id'], self.alumno.id_alumno)
        self.assertIn('historial', data)
        self.assertIn('previas', data)
        self.assertIn('recursadas', data)
