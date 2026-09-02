"""Pruebas funcionales de punta a punta del boletín académico.

Cubre los escenarios 1 a 12 del plan de verificación:

  1. Alumno que pasa de año (cierre de ciclo).
  2. Alumno con exactamente 4 previas.
  3. Alumno con 5+ previas (regla de recursada obligatoria).
  4. Previa sin intensificar (sin rendiciones).
  5. Intensificación 1.º cuatrimestre (columna de la tabla principal).
  6. Intensificaciones posteriores (Diciembre / Febrero, combinaciones).
  7. Materia bloqueada por superposición horaria con una recursada.
  8. Rendición de previa aprobada (nota >= 7).
  9. Rendición de previa desaprobada (nota < 7, se muestra la última instancia).
 10. Recursada con calificación registrada.
 11. Boletín completamente vacío (todas las secciones presentes).
 12. Boletín completo (todas las secciones con datos).

Corren sobre la base de testing MySQL (esquema idéntico al real, sin datos
reales). Cada escenario verifica tanto la base de datos (ORM) como la
respuesta del endpoint real /api/boletin-academico/<id>/.
"""

from django.test import TestCase
from django.utils import timezone

from escuela.academico import (
    consolidar_historial_alumno,
    detectar_superposiciones_y_bloqueos,
    procesar_cierre_ciclo,
)
from escuela.models import (
    ActividadMateriaAdeudada,
    Alumno,
    BloqueoHorarioAlumno,
    Calificacion,
    CursoMateria,
    HistorialAcademico,
    HistorialCursoAlumno,
    Horario,
    MateriaAdeudada,
    Modulos,
    PeriodoEvaluacion,
    RecursadaCalificacion,
    RecursadaMateria,
    RegistroRendicionPrevia,
    RendicionMateriaAdeudada,
    ResultadoActividadAdeudada,
    SituacionMateriaAlumno,
)
from .factories import (
    cliente_para,
    crear_alumno,
    crear_curso,
    crear_curso_materia,
    crear_docente,
    crear_materia,
    crear_usuario,
)


class BaseBoletinTestCase(TestCase):
    def setUp(self):
        self.ciclo = 2026
        self.docente = crear_docente()
        self.curso1 = crear_curso('1°1')
        self.periodo1 = PeriodoEvaluacion.objects.create(
            nombre_periodo='1° Cuatrimestre', orden_periodo=1, estado=True
        )
        self.periodo2 = PeriodoEvaluacion.objects.create(
            nombre_periodo='2° Cuatrimestre', orden_periodo=2, estado=True
        )
        self.alumno = crear_alumno(id_curso=self.curso1)
        self.admin = crear_usuario('e2e_admin', roles=('admin',))
        self.cliente = cliente_para('e2e_admin')

    def _curso_materia(self, materia):
        cm = CursoMateria.objects.filter(id_curso=self.curso1, id_materia=materia).first()
        if cm:
            return cm
        return crear_curso_materia(self.curso1, materia, self.docente)

    def _crear_materias(self, nombres):
        cms = {}
        for n in nombres:
            m = crear_materia(n)
            cms[n] = (m, self._curso_materia(m))
        return cms

    def _cargar_nota(self, cm, nota, periodo=None):
        return Calificacion.objects.create(
            id_alumno=self.alumno,
            id_curso_materia=cm,
            id_docente=self.docente,
            id_periodo=periodo or self.periodo1,
            nota_numerica=nota,
        )

    def _crear_adeudada(self, materia, cm, anio=None, nota_final=3):
        HistorialAcademico.objects.create(
            id_alumno=self.alumno, id_curso_materia=cm, id_curso=self.curso1,
            id_materia=materia, anio_lectivo=anio or self.ciclo,
            nota_final=nota_final, estado_materia='adeudada',
        )
        return MateriaAdeudada.objects.create(
            id_alumno=self.alumno, id_materia=materia, id_curso_origen=self.curso1,
            tipo_deuda='PREVIA', estado='ADEUDADA', fecha_generacion=timezone.now(),
        )

    def _boletin(self):
        return self.cliente.get(f'/api/boletin-academico/{self.alumno.id_alumno}/')


class Escenario1PaseDeAnio(BaseBoletinTestCase):
    """E1: el alumno aprueba todas las materias del año."""

    def test_pasa_de_anio(self):
        cms = self._crear_materias(['Matemática', 'Lengua'])
        for n, (_, cm) in cms.items():
            self._cargar_nota(cm, 8, self.periodo1)
            self._cargar_nota(cm, 8, self.periodo2)

        procesar_cierre_ciclo(self.ciclo)

        hist = HistorialAcademico.objects.filter(id_alumno=self.alumno)
        self.assertEqual(hist.count(), 2)
        self.assertEqual(hist.filter(estado_materia='aprobada').count(), 2)
        self.assertEqual(hist.filter(estado_materia='adeudada').count(), 0)
        self.assertEqual(
            MateriaAdeudada.objects.filter(id_alumno=self.alumno).count(), 0
        )
        hca = HistorialCursoAlumno.objects.get(id_alumno=self.alumno, anio_lectivo=self.ciclo)
        self.assertEqual(hca.estado, 'FINALIZADO')

        data = self._boletin().json()
        self.assertEqual(data['previas'], [])
        self.assertEqual(data['recursadas'], [])
        self.assertEqual(data['intensificaciones_posteriores'], [])
        self.assertEqual(data['intensificaciones_1c'], {})
        self.assertEqual(data['bloqueos_por_materia'], {})


class Escenario2ExactamenteCuatroPrevias(BaseBoletinTestCase):
    """E2: con 4 previas el cierre no crea recursadas."""

    def test_cuatro_previas_se_mantienen_como_previas(self):
        cms = self._crear_materias(['M1', 'M2', 'M3', 'M4'])
        for n, (m, cm) in cms.items():
            self._crear_adeudada(m, cm)

        procesar_cierre_ciclo(self.ciclo)

        previas = MateriaAdeudada.objects.filter(
            id_alumno=self.alumno, tipo_deuda='PREVIA', estado='ADEUDADA'
        )
        self.assertEqual(previas.count(), 4)
        self.assertEqual(
            MateriaAdeudada.objects.filter(id_alumno=self.alumno, tipo_deuda='RECURSADA').count(),
            0,
        )
        self.assertEqual(RecursadaMateria.objects.filter(id_alumno=self.alumno).count(), 0)

        data = self._boletin().json()
        self.assertEqual(len(data['previas']), 4)
        self.assertEqual(data['recursadas'], [])


class Escenario3QuintaPreviaSeVuelveRecursada(BaseBoletinTestCase):
    """E3: la 5.ª previa dispara la regla de recursada obligatoria."""

    def test_quinta_previa_deriva_en_recursada(self):
        cms = self._crear_materias(['M1', 'M2', 'M3', 'M4', 'M5'])
        for n, (m, cm) in cms.items():
            self._crear_adeudada(m, cm)

        procesar_cierre_ciclo(self.ciclo)

        previas = MateriaAdeudada.objects.filter(
            id_alumno=self.alumno, tipo_deuda='PREVIA', estado='ADEUDADA'
        )
        recursadas = MateriaAdeudada.objects.filter(
            id_alumno=self.alumno, tipo_deuda='RECURSADA'
        )
        self.assertLessEqual(previas.count(), 4)
        self.assertGreaterEqual(recursadas.count(), 1)
        rm = RecursadaMateria.objects.get(id_alumno=self.alumno)
        self.assertEqual(rm.estado, 'ACTIVA')
        self.assertEqual(rm.motivo, 'Exceso de 4 previas (recursada obligatoria)')

        data = self._boletin().json()
        self.assertEqual(len(data['previas']), 4)
        self.assertEqual(len(data['recursadas']), 1)
        self.assertEqual(data['recursadas'][0]['estado'], 'A recursar')


class Escenario4PreviaSinIntensificar(BaseBoletinTestCase):
    """E4: una previa sin rendiciones aparece sin período ni calificación."""

    def test_previa_sin_rendiciones(self):
        cms = self._crear_materias(['Matemática'])
        m, cm = cms['Matemática']
        self._crear_adeudada(m, cm)

        self.assertFalse(RegistroRendicionPrevia.objects.filter(id_alumno=self.alumno).exists())

        data = self._boletin().json()
        self.assertEqual(len(data['previas']), 1)
        p = data['previas'][0]
        self.assertEqual(p['materia'], 'Matemática')
        self.assertEqual(p['anio'], '1°1')
        self.assertEqual(p['periodo'], '')
        self.assertIsNone(p['calificacion'])


class Escenario5IntensificacionPrimerCuatrimestre(BaseBoletinTestCase):
    """E5: la intensificación 1.º C alimenta la columna de la tabla principal."""

    def setUp(self):
        super().setUp()
        cms = self._crear_materias(['Matemática'])
        self.cm = cms['Matemática'][1]

    def _crear_actividad_1c(self, cm, nota):
        act = ActividadMateriaAdeudada.objects.create(
            id_curso_materia=cm, id_docente=self.docente, titulo='Intensif 1C',
            tipo='INTENSIFICACION', periodo_intensificacion='PRIMER CUATRIMESTRE',
            archivo_pdf='', estado=True,
        )
        ResultadoActividadAdeudada.objects.create(
            id_actividad=act, id_alumno=self.alumno, nota=nota,
            estado='APROBADA', fecha_evaluacion=timezone.now(),
        )

    def test_nota_en_intensificacion_1c(self):
        self._crear_actividad_1c(self.cm, 8)

        data = self._boletin().json()
        self.assertEqual(data['intensificaciones_1c'], {'Matemática': 8.0})

    def test_actividad_sin_resultado_no_genera_celda(self):
        ActividadMateriaAdeudada.objects.create(
            id_curso_materia=self.cm, id_docente=self.docente, titulo='Sin nota',
            tipo='INTENSIFICACION', periodo_intensificacion='PRIMER CUATRIMESTRE',
            archivo_pdf='', estado=True,
        )

        # Sin resultado: el endpoint deja la nota en None (el frontend
        # renderiza la celda vacía). La clave existe, pero no hay nota.
        data = self._boletin().json()
        self.assertEqual(data['intensificaciones_1c'], {'Matemática': None})


class Escenario6IntensificacionesPosteriores(BaseBoletinTestCase):
    """E6: Diciembre/Febrero con combinaciones (solo dic, solo feb, ambas)."""

    def setUp(self):
        super().setUp()
        cms = self._crear_materias(['Química', 'Física', 'Historia'])
        self.cm_q = cms['Química'][1]
        self.cm_f = cms['Física'][1]
        self.cm_h = cms['Historia'][1]

    def _crear_resultado(self, cm, periodo, nota):
        act = ActividadMateriaAdeudada.objects.create(
            id_curso_materia=cm, id_docente=self.docente,
            titulo=f'Act {periodo}', tipo='INTENSIFICACION',
            periodo_intensificacion=periodo, archivo_pdf='', estado=True,
        )
        ResultadoActividadAdeudada.objects.create(
            id_actividad=act, id_alumno=self.alumno, nota=nota,
            estado='APROBADA', fecha_evaluacion=timezone.now(),
        )

    def test_solo_diciembre(self):
        self._crear_resultado(self.cm_q, 'DICIEMBRE', 6)
        data = self._boletin().json()
        self.assertEqual(
            data['intensificaciones_posteriores'],
            [{'materia': 'Química', 'anio': '1°1', 'diciembre': 6.0, 'febrero': None}],
        )

    def test_solo_febrero(self):
        self._crear_resultado(self.cm_f, 'FEBRERO', 7)
        data = self._boletin().json()
        self.assertEqual(
            data['intensificaciones_posteriores'],
            [{'materia': 'Física', 'anio': '1°1', 'diciembre': None, 'febrero': 7.0}],
        )

    def test_ambas_en_la_misma_materia(self):
        self._crear_resultado(self.cm_h, 'DICIEMBRE', 5)
        self._crear_resultado(self.cm_h, 'FEBRERO', 8)
        data = self._boletin().json()
        self.assertEqual(
            data['intensificaciones_posteriores'],
            [{'materia': 'Historia', 'anio': '1°1', 'diciembre': 5.0, 'febrero': 8.0}],
        )

    def test_multiples_materias(self):
        self._crear_resultado(self.cm_q, 'DICIEMBRE', 6)
        self._crear_resultado(self.cm_f, 'FEBRERO', 7)
        data = self._boletin().json()
        por_materia = {i['materia']: i for i in data['intensificaciones_posteriores']}
        self.assertEqual(set(por_materia), {'Química', 'Física'})
        self.assertEqual(por_materia['Química']['diciembre'], 6.0)
        self.assertEqual(por_materia['Química']['febrero'], None)
        self.assertEqual(por_materia['Física']['diciembre'], None)
        self.assertEqual(por_materia['Física']['febrero'], 7.0)


class Escenario7BloqueoPorSuperposicion(BaseBoletinTestCase):
    """E7: materia bloqueada por superposición horaria con una recursada."""

    def test_superposicion_bloquea_materia(self):
        cms = self._crear_materias(['Matemática', 'Historia'])
        cm_rec = cms['Matemática'][1]
        cm_hist = cms['Historia'][1]

        RecursadaMateria.objects.create(
            id_alumno=self.alumno, id_materia=cms['Matemática'][0],
            id_curso_origen=self.curso1, id_curso_recursada=self.curso1,
            anio_inicio=self.ciclo, estado='ACTIVA', fecha_registro=timezone.now(),
        )

        mod = Modulos.objects.create(nombre='M1', hora_inicio='08:00:00', hora_fin='09:00:00')
        Horario.objects.create(id_curso_materia=cm_rec, dia_semana='Lunes', id_modulo=mod)
        Horario.objects.create(id_curso_materia=cm_hist, dia_semana='Lunes', id_modulo=mod)

        detectar_superposiciones_y_bloqueos(self.alumno, self.ciclo)

        bloqueo = BloqueoHorarioAlumno.objects.get(id_alumno=self.alumno)
        self.assertEqual(bloqueo.id_materia_bloqueada.nombre_materia, 'Historia')
        self.assertEqual(bloqueo.motivo, 'SUPERPOSICION_RECURSADA')
        situacion = SituacionMateriaAlumno.objects.get(
            id_alumno=self.alumno, id_curso_materia=cm_hist, anio_lectivo=self.ciclo
        )
        self.assertEqual(situacion.situacion, 'BLOQUEADA')
        self.assertIn('Matemática', situacion.motivo_bloqueo)

        data = self._boletin().json()
        self.assertIn('Historia', data['bloqueos_por_materia'])
        self.assertTrue(data['bloqueos_por_materia']['Historia']['bloqueada'])
        self.assertIn('Superposición', data['bloqueos_por_materia']['Historia']['motivo'])

    def test_sin_superposicion_no_bloquea(self):
        cms = self._crear_materias(['Matemática', 'Historia'])
        cm_rec = cms['Matemática'][1]
        cm_hist = cms['Historia'][1]

        RecursadaMateria.objects.create(
            id_alumno=self.alumno, id_materia=cms['Matemática'][0],
            id_curso_origen=self.curso1, id_curso_recursada=self.curso1,
            anio_inicio=self.ciclo, estado='ACTIVA', fecha_registro=timezone.now(),
        )

        mod1 = Modulos.objects.create(nombre='M1', hora_inicio='08:00:00', hora_fin='09:00:00')
        mod2 = Modulos.objects.create(nombre='M2', hora_inicio='09:00:00', hora_fin='10:00:00')
        Horario.objects.create(id_curso_materia=cm_rec, dia_semana='Lunes', id_modulo=mod1)
        Horario.objects.create(id_curso_materia=cm_hist, dia_semana='Lunes', id_modulo=mod2)

        detectar_superposiciones_y_bloqueos(self.alumno, self.ciclo)

        self.assertFalse(BloqueoHorarioAlumno.objects.filter(id_alumno=self.alumno).exists())
        data = self._boletin().json()
        self.assertEqual(data['bloqueos_por_materia'], {})


class Escenario8RendicionPreviaAprobada(BaseBoletinTestCase):
    """E8: rendir una previa con nota >= 7 la aprueba y actualiza el historial."""

    def setUp(self):
        super().setUp()
        cms = self._crear_materias(['Matemática'])
        m, cm = cms['Matemática']
        self.ma = self._crear_adeudada(m, cm)
        self.user_doc = crear_usuario('doc_e2e', roles=('docente',))
        self.docente.id_usuario = self.user_doc
        self.docente.save()
        self.cliente_doc = cliente_para('doc_e2e')

    def test_rendicion_aprobada(self):
        resp = self.cliente_doc.post(
            f'/api/materias-adeudadas/{self.ma.id_materia_adeudada}/rendir/',
            {'nota': 8, 'periodo': 'MARZO', 'anio_rendicion': 2027,
             'id_docente': self.docente.id_docente},
        )
        self.assertEqual(resp.status_code, 200)

        self.ma.refresh_from_db()
        self.assertEqual(self.ma.estado, 'APROBADA')
        self.assertIsNotNone(self.ma.fecha_aprobacion)
        rend = RendicionMateriaAdeudada.objects.get(id_materia_adeudada=self.ma)
        self.assertEqual(rend.estado, 'APROBADA')
        self.assertEqual(float(rend.nota), 8)
        reg = RegistroRendicionPrevia.objects.get(id_materia_adeudada=self.ma)
        self.assertEqual(reg.resultado, 'APROBADA')
        hist = HistorialAcademico.objects.get(id_alumno=self.alumno, id_materia=self.ma.id_materia)
        self.assertEqual(hist.estado_materia, 'aprobada')
        self.assertEqual(hist.periodo_aprobacion, 'previa')
        self.assertEqual(hist.anio_aprobacion, 2027)

        data = self._boletin().json()
        self.assertEqual(data['previas'], [])


class Escenario9RendicionPreviaDesaprobada(BaseBoletinTestCase):
    """E9: nota < 7 no aprueba y el boletín muestra la última instancia rendida."""

    def setUp(self):
        super().setUp()
        cms = self._crear_materias(['Matemática'])
        m, cm = cms['Matemática']
        self.ma = self._crear_adeudada(m, cm)
        self.user_doc = crear_usuario('doc_e2e9', roles=('docente',))
        self.docente.id_usuario = self.user_doc
        self.docente.save()
        self.cliente_doc = cliente_para('doc_e2e9')

    def test_rendicion_desaprobada_y_ultima_instancia(self):
        # MARZO y JULIO en orden estricto (no se pueden saltar períodos).
        self.cliente_doc.post(
            f'/api/materias-adeudadas/{self.ma.id_materia_adeudada}/rendir/',
            {'nota': 4, 'periodo': 'MARZO', 'anio_rendicion': 2026,
             'id_docente': self.docente.id_docente},
        )
        self.ma.refresh_from_db()
        self.assertEqual(self.ma.estado, 'ADEUDADA')

        self.cliente_doc.post(
            f'/api/materias-adeudadas/{self.ma.id_materia_adeudada}/rendir/',
            {'nota': 5, 'periodo': 'JULIO', 'anio_rendicion': 2026,
             'id_docente': self.docente.id_docente},
        )
        self.ma.refresh_from_db()
        self.assertEqual(self.ma.estado, 'ADEUDADA')
        self.assertEqual(RegistroRendicionPrevia.objects.filter(id_materia_adeudada=self.ma).count(), 2)
        self.assertEqual(
            RendicionMateriaAdeudada.objects.filter(id_materia_adeudada=self.ma, estado='DESAPROBADA').count(),
            2,
        )

        data = self._boletin().json()
        self.assertEqual(len(data['previas']), 1)
        p = data['previas'][0]
        self.assertEqual(p['materia'], 'Matemática')
        self.assertEqual(p['periodo'], 'JULIO')
        self.assertEqual(p['calificacion'], 5.0)

    def test_rendicion_desaprobada_muestra_esa_instancia(self):
        # FEBRERO es el último de la secuencia: se rinden los anteriores primero
        # con notas desaprobadas (< 7) para no aprobar la previa antes de tiempo.
        for periodo, nota in [('MARZO', 3), ('JULIO', 3), ('AGOSTO', 3),
                              ('DICIEMBRE_1', 3), ('DICIEMBRE_2', 3), ('FEBRERO', 3)]:
            self.cliente_doc.post(
                f'/api/materias-adeudadas/{self.ma.id_materia_adeudada}/rendir/',
                {'nota': nota, 'periodo': periodo, 'anio_rendicion': 2027,
                 'id_docente': self.docente.id_docente},
            )
        data = self._boletin().json()
        self.assertEqual(data['previas'][0]['periodo'], 'FEBRERO')
        self.assertEqual(data['previas'][0]['calificacion'], 3.0)


class Escenario10RecursadaConCalificacion(BaseBoletinTestCase):
    """E10: la recursada queda registrada con su calificación y el boletín la muestra."""

    def test_recursada_con_calificacion(self):
        cms = self._crear_materias(['Física'])
        m, cm = cms['Física']

        rm = RecursadaMateria.objects.create(
            id_alumno=self.alumno, id_materia=m, id_curso_origen=self.curso1,
            id_curso_recursada=self.curso1, anio_inicio=self.ciclo,
            estado='ACTIVA', fecha_registro=timezone.now(),
        )
        RecursadaCalificacion.objects.create(
            id_recursada=rm, id_docente=self.docente, periodo='1° Cuatrimestre',
            nota=7, diagnostico='Recuperó los contenidos',
        )
        RecursadaCalificacion.objects.create(
            id_recursada=rm, id_docente=self.docente, periodo='2° Cuatrimestre',
            nota=8, diagnostico='Continuó mejorando',
        )
        RecursadaCalificacion.objects.create(
            id_recursada=rm, id_docente=self.docente, periodo='Febrero',
            nota=5,
        )

        cals = RecursadaCalificacion.objects.filter(id_recursada=rm)
        self.assertEqual(cals.count(), 3)
        self.assertEqual(cals.get(periodo='1° Cuatrimestre').nota, 7)

        data = self._boletin().json()
        self.assertEqual(len(data['recursadas']), 1)
        r = data['recursadas'][0]
        self.assertEqual(r['materia'], 'Física')
        self.assertEqual(r['anio'], '1°1')
        self.assertEqual(r['estado'], 'A recursar')
        # Cada nota de RecursadaCalificacion cae en la columna de su periodo.
        self.assertEqual(r['nota1'], 7.0)
        self.assertEqual(r['nota2'], 8.0)
        self.assertEqual(r['febrero'], 5.0)
        self.assertEqual(r['diciembre'], None)
        self.assertEqual(r['intensificacion_1c'], None)
        self.assertEqual(r['prenota1'], None)
        self.assertEqual(r['prenota2'], None)
        self.assertEqual(r['observaciones'], '')


class Escenario11BoletinVacio(BaseBoletinTestCase):
    """E11: alumno sin ninguna actividad académica."""

    def test_boletin_vacio(self):
        resp = self._boletin()
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data['intensificaciones_1c'], {})
        self.assertEqual(data['bloqueos_por_materia'], {})
        self.assertEqual(data['intensificaciones_posteriores'], [])
        self.assertEqual(data['recursadas'], [])
        self.assertEqual(data['previas'], [])
        self.assertEqual(data['alumno']['curso'], '1°1')
        self.assertEqual(data['alumno']['id'], self.alumno.id_alumno)


class Escenario12BoletinCompleto(BaseBoletinTestCase):
    """E12: todas las secciones pobladas en un mismo boletín."""

    def test_boletin_completo(self):
        cms = self._crear_materias(['Matemática', 'Lengua', 'Historia', 'Física'])
        m_math, cm_math = cms['Matemática']
        m_len, cm_len = cms['Lengua']
        m_his, cm_his = cms['Historia']
        m_fis, cm_fis = cms['Física']

        # 1 materia aprobada
        self._cargar_nota(cm_len, 8, self.periodo1)
        self._cargar_nota(cm_len, 9, self.periodo2)

        # 1 previa con rendición desaprobada
        self._crear_adeudada(m_math, cm_math)
        self.user_doc = crear_usuario('doc_e2e12', roles=('docente',))
        self.docente.id_usuario = self.user_doc
        self.docente.save()
        cli = cliente_para('doc_e2e12')
        ma = MateriaAdeudada.objects.get(id_alumno=self.alumno, id_materia=m_math)
        # Rendiciones en orden estricto; AGOSTO queda como última instancia.
        for periodo, nota in [('MARZO', 4), ('JULIO', 5), ('AGOSTO', 6)]:
            cli.post(
                f'/api/materias-adeudadas/{ma.id_materia_adeudada}/rendir/',
                {'nota': nota, 'periodo': periodo, 'anio_rendicion': 2026,
                 'id_docente': self.docente.id_docente},
            )

        # 1 recursada con calificación (reutilizada para el bloqueo)
        rm = RecursadaMateria.objects.create(
            id_alumno=self.alumno, id_materia=m_fis, id_curso_origen=self.curso1,
            id_curso_recursada=self.curso1, anio_inicio=self.ciclo,
            estado='ACTIVA', fecha_registro=timezone.now(),
        )
        RecursadaCalificacion.objects.create(
            id_recursada=rm, id_docente=self.docente, periodo='1° Cuatrimestre',
            nota=7, diagnostico='Recuperó',
        )

        # intensif 1C sobre Matemática
        act = ActividadMateriaAdeudada.objects.create(
            id_curso_materia=cm_math, id_docente=self.docente, titulo='Intensif 1C',
            tipo='INTENSIFICACION', periodo_intensificacion='PRIMER CUATRIMESTRE',
            archivo_pdf='', estado=True,
        )
        ResultadoActividadAdeudada.objects.create(
            id_actividad=act, id_alumno=self.alumno, nota=8, estado='APROBADA',
            fecha_evaluacion=timezone.now(),
        )

        # intensificaciones diciembre/febrero sobre Historia
        act_dic = ActividadMateriaAdeudada.objects.create(
            id_curso_materia=cm_his, id_docente=self.docente, titulo='Dic',
            tipo='INTENSIFICACION', periodo_intensificacion='DICIEMBRE',
            archivo_pdf='', estado=True,
        )
        ResultadoActividadAdeudada.objects.create(
            id_actividad=act_dic, id_alumno=self.alumno, nota=6, estado='APROBADA',
            fecha_evaluacion=timezone.now(),
        )
        act_feb = ActividadMateriaAdeudada.objects.create(
            id_curso_materia=cm_his, id_docente=self.docente, titulo='Feb',
            tipo='INTENSIFICACION', periodo_intensificacion='FEBRERO',
            archivo_pdf='', estado=True,
        )
        ResultadoActividadAdeudada.objects.create(
            id_actividad=act_feb, id_alumno=self.alumno, nota=7, estado='APROBADA',
            fecha_evaluacion=timezone.now(),
        )

        # bloqueo por superposición (misma recursada de Física activa)
        mod = Modulos.objects.create(nombre='M1', hora_inicio='08:00:00', hora_fin='09:00:00')
        Horario.objects.create(id_curso_materia=cm_fis, dia_semana='Lunes', id_modulo=mod)
        Horario.objects.create(id_curso_materia=cm_his, dia_semana='Lunes', id_modulo=mod)
        detectar_superposiciones_y_bloqueos(self.alumno, self.ciclo)

        data = self._boletin().json()
        self.assertEqual(data['intensificaciones_1c'], {'Matemática': 8.0})
        self.assertIn('Historia', data['bloqueos_por_materia'])
        self.assertTrue(data['bloqueos_por_materia']['Historia']['bloqueada'])
        por_materia = {i['materia']: i for i in data['intensificaciones_posteriores']}
        self.assertEqual(por_materia['Historia'], {'materia': 'Historia', 'anio': '1°1', 'diciembre': 6.0, 'febrero': 7.0})
        self.assertEqual(len(data['previas']), 1)
        self.assertEqual(data['previas'][0]['materia'], 'Matemática')
        self.assertEqual(data['previas'][0]['periodo'], 'AGOSTO')
        self.assertEqual(len(data['recursadas']), 1)
        self.assertEqual(data['recursadas'][0]['materia'], 'Física')
        self.assertEqual(data['recursadas'][0]['nota1'], 7.0)
