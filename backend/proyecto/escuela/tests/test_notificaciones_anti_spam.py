"""Tests de la Parte 7 del Plan Maestro: Anti-spam y consistencia.

Cubren:
- Deduplicación centralizada (CONTENT, DAILY, REFERENCE)
- Límites diarios y horarios
- Purga de notificaciones antiguas
- Anti-spam por ráfaga (5 minutos)
"""

from datetime import time
from django.test import TestCase
from django.utils import timezone

from escuela.models import Notificacion, Usuario
from escuela.notifications import (
    notificar,
    notificar_alumno,
    _limite_diario_excedido,
    _limite_horario_excedido,
    _purgar_notificaciones_antiguas,
    ejecutar_mantenimiento,
)

from .factories import (
    crear_alumno,
    crear_curso,
    crear_tutor,
    crear_usuario,
)


class Parte7AntiSpamTests(TestCase):
    """Tests de las reglas de anti-spam y deduplicación."""

    def setUp(self):
        self.usuario = crear_usuario('user_p7', roles=('alumno',))
        self.alumno_user = crear_usuario('alum_p7', roles=('alumno',))
        self.tutor_user = crear_usuario('tutor_p7', roles=('familia',))
        self.tutor = crear_tutor(id_usuario=self.tutor_user)
        self.curso = crear_curso('1°1')
        self.alumno = crear_alumno(
            id_usuario=self.alumno_user, id_tutor=self.tutor, id_curso=self.curso,
        )

    # --- Límites diarios/horarios ---

    def test_limite_diario_bloquea(self):
        """Al superar el límite diario, notificar retorna None."""
        # Crear notificaciones hasta el límite
        for i in range(50):
            Notificacion.objects.create(
                id_usuario=self.usuario, titulo=f'Test {i}', mensaje='msg',
                fecha=timezone.now(),
            )
        self.assertTrue(_limite_diario_excedido(self.usuario))
        resultado = notificar(id_usuario=self.usuario, titulo='Nueva', mensaje='msg', check_limits=True)
        self.assertIsNone(resultado)

    def test_limite_horario_bloquea(self):
        """Al superar el límite horario, notificar retorna None."""
        ahora = timezone.now()
        hora_inicio = ahora.replace(minute=0, second=0, microsecond=0)
        for i in range(10):
            Notificacion.objects.create(
                id_usuario=self.usuario, titulo=f'Test {i}', mensaje='msg',
                fecha=hora_inicio,
            )
        self.assertTrue(_limite_horario_excedido(self.usuario))
        resultado = notificar(id_usuario=self.usuario, titulo='Nueva', mensaje='msg', check_limits=True)
        self.assertIsNone(resultado)

    def test_sin_check_limits_ignora_limites(self):
        """Si check_limits=False, ignora los límites."""
        for i in range(60):
            Notificacion.objects.create(
                id_usuario=self.usuario, titulo=f'Test {i}', mensaje='msg',
                fecha=timezone.now(),
            )
        resultado = notificar(id_usuario=self.usuario, titulo='Nueva', mensaje='msg', check_limits=False)
        self.assertIsNotNone(resultado)

    # --- Anti-ráfaga (5 minutos) ---

    def test_antirafaga_bloquea_duplicados_recientes(self):
        """Evita crear notificaciones idénticas en ventana de 5 minutos."""
        n1 = notificar(id_usuario=self.usuario, titulo='Titulo', mensaje='Mensaje',
                       check_limits=False)
        self.assertIsNotNone(n1)
        n2 = notificar(id_usuario=self.usuario, titulo='Titulo', mensaje='Mensaje',
                       check_limits=False)
        # Debe retornar la existente, no crear nueva
        self.assertEqual(n2.pk, n1.pk)
        self.assertEqual(Notificacion.objects.filter(id_usuario=self.usuario).count(), 1)

    def test_antirafaga_expira_despues_de_5_minutos(self):
        """Después de 5 minutos, permite crear notificación idéntica."""
        hace_6min = timezone.now() - timezone.timedelta(minutes=6)
        Notificacion.objects.create(
            id_usuario=self.usuario, titulo='Titulo', mensaje='Mensaje', fecha=hace_6min,
        )
        n = notificar(id_usuario=self.usuario, titulo='Titulo', mensaje='Mensaje',
                      check_limits=False)
        self.assertIsNotNone(n)
        self.assertEqual(Notificacion.objects.filter(id_usuario=self.usuario).count(), 2)

    # --- Deduplicación CONTENT ---

    def test_dedupe_content_evita_duplicados(self):
        """Deduplicación por contenido idéntico evita duplicados."""
        notificar_alumno(alumno=self.alumno, titulo='Titulo', mensaje='Mensaje')
        notificar_alumno(alumno=self.alumno, titulo='Titulo', mensaje='Mensaje')
        self.assertEqual(Notificacion.objects.filter(id_usuario=self.alumno_user).count(), 1)
        self.assertEqual(Notificacion.objects.filter(id_usuario=self.tutor_user).count(), 1)

    def test_dedupe_content_permite_distintos(self):
        """Contenido distinto sí crea notificaciones separadas."""
        notificar_alumno(alumno=self.alumno, titulo='Titulo 1', mensaje='Mensaje 1')
        notificar_alumno(alumno=self.alumno, titulo='Titulo 2', mensaje='Mensaje 2')
        self.assertEqual(Notificacion.objects.filter(id_usuario=self.alumno_user).count(), 2)

    # --- Deduplicación DAILY ---

    def test_dedupe_daily_agrupa_por_dia(self):
        """Estrategia DAILY agrupa notificaciones del mismo día."""
        notificar_alumno(alumno=self.alumno, titulo='Diario', mensaje='Msg 1', strategy='DAILY')
        notificar_alumno(alumno=self.alumno, titulo='Diario', mensaje='Msg 2', strategy='DAILY')
        # Solo una notificación, mensaje acumulado
        n = Notificacion.objects.get(id_usuario=self.alumno_user, titulo='Diario')
        self.assertIn('Msg 1', n.mensaje)
        self.assertIn('Msg 2', n.mensaje)
        self.assertEqual(Notificacion.objects.filter(id_usuario=self.alumno_user, titulo='Diario').count(), 1)

    def test_dedupe_daily_nuevo_dia_crea_nueva(self):
        """En día diferente, DAILY crea nueva notificación."""
        ayer = timezone.now() - timezone.timedelta(days=1)
        with self._viajar_al_tiempo(ayer):
            notificar_alumno(alumno=self.alumno, titulo='Diario', mensaje='Ayer', strategy='DAILY')
        notificar_alumno(alumno=self.alumno, titulo='Diario', mensaje='Hoy', strategy='DAILY')
        # Dos notificaciones (una por día)
        self.assertEqual(Notificacion.objects.filter(id_usuario=self.alumno_user, titulo='Diario').count(), 2)

    # --- Deduplicación REFERENCE ---

    def test_dedupe_reference_evita_duplicados_por_clave(self):
        """Estrategia REFERENCE evita duplicados por clave externa."""
        # Primera llamada: crea notificación con marcador de referencia
        notificar_alumno(alumno=self.alumno, titulo='Titulo', mensaje='Msg 1 [ref:clave_123]',
                         strategy='REFERENCE', dedupe_key='clave_123')
        # Segunda llamada: debe actualizar la existente
        notificar_alumno(alumno=self.alumno, titulo='Titulo', mensaje='Msg 2 [ref:clave_123]',
                         strategy='REFERENCE', dedupe_key='clave_123')
        # Solo una notificación, mensaje actualizado al último
        self.assertEqual(Notificacion.objects.filter(id_usuario=self.alumno_user).count(), 1)
        n = Notificacion.objects.get(id_usuario=self.alumno_user)
        self.assertIn('Msg 2', n.mensaje)

    def test_dedupe_reference_clave_distinta_crea_nueva(self):
        """Clave distinta crea notificación separada."""
        notificar_alumno(alumno=self.alumno, titulo='Titulo', mensaje='Msg 1',
                         strategy='REFERENCE', dedupe_key='clave_1')
        notificar_alumno(alumno=self.alumno, titulo='Titulo', mensaje='Msg 2',
                         strategy='REFERENCE', dedupe_key='clave_2')
        self.assertEqual(Notificacion.objects.filter(id_usuario=self.alumno_user).count(), 2)

    # --- Purga de notificaciones antiguas ---

    def test_purga_elimina_antiguas(self):
        """ejecutar_mantenimiento elimina notificaciones > RETENCION_DIAS."""
        antigua = timezone.now() - timezone.timedelta(days=200)
        Notificacion.objects.create(
            id_usuario=self.usuario, titulo='Antigua', mensaje='msg', fecha=antigua,
        )
        Notificacion.objects.create(
            id_usuario=self.usuario, titulo='Reciente', mensaje='msg', fecha=timezone.now(),
        )
        self.assertEqual(Notificacion.objects.filter(id_usuario=self.usuario).count(), 2)
        ejecutar_mantenimiento()
        self.assertEqual(Notificacion.objects.filter(id_usuario=self.usuario).count(), 1)
        self.assertEqual(Notificacion.objects.get(id_usuario=self.usuario).titulo, 'Reciente')

    # --- notificar() con dedupe_key ---

    def test_notificar_dedupe_key_evita_duplicados(self):
        """notificar() con dedupe_key evita duplicados por referencia."""
        n1 = notificar(id_usuario=self.usuario, titulo='T', mensaje='M',
                       check_limits=False, dedupe_key='ref_1')
        n2 = notificar(id_usuario=self.usuario, titulo='T', mensaje='M',
                       check_limits=False, dedupe_key='ref_1')
        self.assertEqual(n2.pk, n1.pk)

    # Context manager para simular tiempo
    def _viajar_al_tiempo(self, fecha):
        """Context manager para mockear timezone.now()."""
        from unittest.mock import patch
        return patch('django.utils.timezone.now', return_value=fecha)


class Parte7AntiSpamIntegracionTests(TestCase):
    """Tests de integración: verificar que los emisores existentes usan anti-spam."""

    def setUp(self):
        self.alumno_user = crear_usuario('alum_p7i', roles=('alumno',))
        self.tutor_user = crear_usuario('tutor_p7i', roles=('familia',))
        self.tutor = crear_tutor(id_usuario=self.tutor_user)
        self.curso = crear_curso('1°1')
        self.alumno = crear_alumno(
            id_usuario=self.alumno_user, id_tutor=self.tutor, id_curso=self.curso,
        )

    def test_calificacion_ref_dedupe(self):
        """Calificaciones usan REFERENCE por PK y no duplican al re-guardar."""
        from escuela.models import Calificacion, CursoMateria, Materia, Docente, PeriodoEvaluacion
        from escuela.views import _notificar_calificacion

        materia = Materia.objects.create(nombre_materia='Matemática')
        docente = Docente.objects.create(nombre='Ana', apellido='Docente', dni='11111111')
        cm = CursoMateria.objects.create(id_curso=self.curso, id_materia=materia, id_docente=docente)
        periodo = PeriodoEvaluacion.objects.create(nombre_periodo='1° Cuatrimestre', orden_periodo=1, estado=True)

        cal = Calificacion.objects.create(
            id_alumno=self.alumno, id_curso_materia=cm, id_docente=docente,
            id_periodo=periodo, nota_numerica=8,
        )

        _notificar_calificacion(cal, accion='cargada')
        _notificar_calificacion(cal, accion='cargada')  # Re-guardar
        self.assertEqual(Notificacion.objects.filter(id_usuario=self.alumno_user).count(), 1)

    def test_inasistencia_daily_dedupe(self):
        """Inasistencias usan DAILY y agrupan por día."""
        from escuela.models import Asistencia, CursoMateria, Materia, Docente, EstadoAsistencia
        from escuela.views import _notificar_inasistencia

        materia1 = Materia.objects.create(nombre_materia='Lengua')
        materia2 = Materia.objects.create(nombre_materia='Matemática')
        materia3 = Materia.objects.create(nombre_materia='Historia')
        docente = Docente.objects.create(nombre='Luis', apellido='Docente', dni='22222222')
        cm1 = CursoMateria.objects.create(id_curso=self.curso, id_materia=materia1, id_docente=docente)
        cm2 = CursoMateria.objects.create(id_curso=self.curso, id_materia=materia2, id_docente=docente)
        cm3 = CursoMateria.objects.create(id_curso=self.curso, id_materia=materia3, id_docente=docente)
        ausente = EstadoAsistencia.objects.create(nombre_estado='Ausente')
        presente = EstadoAsistencia.objects.create(nombre_estado='Presente')

        fecha = timezone.localdate()
        for i, cm in enumerate([cm1, cm2, cm3]):
            asistencia = Asistencia.objects.create(
                id_alumno=self.alumno, id_curso_materia=cm,
                id_usuario=crear_usuario(f'prec_{i}', roles=('preceptor',)),
                id_estado_asistencia=ausente, fecha=fecha, hora=time(8, i),
            )
            _notificar_inasistencia(asistencia)
        # Solo 1 notificación por día
        self.assertEqual(Notificacion.objects.filter(id_usuario=self.alumno_user, titulo='Inasistencia registrada').count(), 1)
        n = Notificacion.objects.get(id_usuario=self.alumno_user, titulo='Inasistencia registrada')
        # Verifica que las 3 materias están en el mensaje
        self.assertIn('Lengua', n.mensaje)
        self.assertIn('Matemática', n.mensaje)
        self.assertIn('Historia', n.mensaje)


# Alias para compatibilidad
Parte7Tests = Parte7AntiSpamTests