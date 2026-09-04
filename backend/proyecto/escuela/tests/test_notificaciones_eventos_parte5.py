"""Tests de la Parte 5 del Plan Maestro: eventos para Docentes.

Cubren E15 (adelanto de horas aprobado), E17 (suplencia asignada),
E8 (planificación para revisión) y E9 (DDJJ presentada).
"""

from django.test import TestCase
from django.utils import timezone

from escuela.models import (
    AdelantoHoras,
    DdjjDocente,
    Notificacion,
    Planificacion,
    SuplenciaDocente,
    Usuario,
)
from escuela.views import (
    _notificar_adelanto_aprobado,
    _notificar_ddjj_presentada,
    _notificar_planificacion_para_revision,
    _notificar_suplencia_asignada,
)

from .factories import (
    crear_alumno,
    crear_curso,
    crear_curso_materia,
    crear_docente,
    crear_materia,
    crear_preceptor,
    crear_tutor,
    crear_usuario,
)


class Parte5AdelantoHorasTests(TestCase):
    """E15 — Adelanto de horas aprobado."""

    def setUp(self):
        self.curso = crear_curso('1°1')
        self.materia = crear_materia('Matemática')
        self.docente = crear_docente()
        self.docente_user = crear_usuario('doc_adelanto', roles=('docente',))
        self.docente.id_usuario = self.docente_user
        self.docente.save()

        self.preceptor_user = crear_usuario('prec_adelanto', roles=('preceptor',))
        self.preceptor = crear_preceptor(id_usuario=self.preceptor_user)
        self.curso.id_preceptor = self.preceptor
        self.curso.save()

    def test_adelanto_notifica_al_docente(self):
        """Al crear un adelanto (que queda aprobado por defecto), se notifica al docente."""
        adelanto = AdelantoHoras.objects.create(
            id_curso=self.curso,
            id_materia=self.materia,
            id_docente=self.docente,
            fecha_adelanto=timezone.now().date(),
            hora_inicio=timezone.now().time(),
            hora_fin=(timezone.now() + timezone.timedelta(hours=1)).time(),
            id_usuario_autorizador=self.preceptor_user,
        )

        _notificar_adelanto_aprobado(adelanto)

        n = Notificacion.objects.get(id_usuario=self.docente_user)
        self.assertEqual(n.titulo, 'Adelanto de horas aprobado')
        self.assertIn('Matemática', n.mensaje)
        self.assertIn('1°1', n.mensaje)

    def test_sin_usuario_docente_no_notifica(self):
        """Si el docente no tiene usuario asociado, no se notifica."""
        docente_sin_user = crear_docente()
        adelanto = AdelantoHoras.objects.create(
            id_curso=self.curso,
            id_materia=self.materia,
            id_docente=docente_sin_user,
            fecha_adelanto=timezone.now().date(),
            hora_inicio=timezone.now().time(),
            hora_fin=(timezone.now() + timezone.timedelta(hours=1)).time(),
            id_usuario_autorizador=self.preceptor_user,
        )

        _notificar_adelanto_aprobado(adelanto)
        self.assertEqual(Notificacion.objects.count(), 0)

    def test_adelanto_notifica_a_estudiantes_y_familia(self):
        """Corrección posterior — el adelanto también notifica a los
        estudiantes del curso afectado y a sus familias, con id_alumno."""
        user_alumno = crear_usuario('alum_adelanto', roles=('alumno',))
        tutor = crear_tutor(id_usuario=crear_usuario('fam_adelanto', roles=('familia',)))
        alumno = crear_alumno(
            id_usuario=user_alumno, id_tutor=tutor, id_curso=self.curso,
        )

        adelanto = AdelantoHoras.objects.create(
            id_curso=self.curso,
            id_materia=self.materia,
            id_docente=self.docente,
            fecha_adelanto=timezone.now().date(),
            hora_inicio=timezone.now().time(),
            hora_fin=(timezone.now() + timezone.timedelta(hours=1)).time(),
            id_usuario_autorizador=self.preceptor_user,
        )

        _notificar_adelanto_aprobado(adelanto)

        # El estudiante recibe con id_alumno correspondiente
        n_al = Notificacion.objects.get(id_usuario=user_alumno)
        self.assertEqual(n_al.id_alumno_id, alumno.id_alumno)
        self.assertEqual(n_al.titulo, 'Adelanto de horas aprobado')
        self.assertIn('Matemática', n_al.mensaje)
        self.assertIn('1°1', n_al.mensaje)

        # La familia recibe con id_alumno correspondiente
        n_fam = Notificacion.objects.get(id_usuario=tutor.id_usuario)
        self.assertEqual(n_fam.id_alumno_id, alumno.id_alumno)

        # El docente sigue recibiendo su notificación profesional
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.docente_user).count(),
            1,
        )

    def test_adelanto_no_notifica_a_alumno_de_otro_curso(self):
        """Los estudiantes de otros cursos no reciben la notificación del
        adelanto."""
        user_fuera = crear_usuario('alum_adelanto2', roles=('alumno',))
        curso2 = crear_curso('2°1')
        crear_alumno(id_usuario=user_fuera, id_curso=curso2)

        adelanto = AdelantoHoras.objects.create(
            id_curso=self.curso,
            id_materia=self.materia,
            id_docente=self.docente,
            fecha_adelanto=timezone.now().date(),
            hora_inicio=timezone.now().time(),
            hora_fin=(timezone.now() + timezone.timedelta(hours=1)).time(),
            id_usuario_autorizador=self.preceptor_user,
        )

        _notificar_adelanto_aprobado(adelanto)

        self.assertEqual(
            Notificacion.objects.filter(id_usuario=user_fuera).count(),
            0,
        )


class Parte5SuplenciaTests(TestCase):
    """E17 — Suplencia asignada."""

    def setUp(self):
        self.curso = crear_curso('1°1')
        self.materia = crear_materia('Lengua')
        self.titular = crear_docente()
        self.suplente = crear_docente()
        self.suplente_user = crear_usuario('doc_suplente', roles=('docente',))
        self.suplente.id_usuario = self.suplente_user
        self.suplente.save()

        self.cm = crear_curso_materia(self.curso, self.materia, self.titular)

        self.admin_user = crear_usuario('admin_sup', roles=('admin',))

    def test_suplencia_notifica_al_suplente(self):
        """Al crear una suplencia activa, se notifica al docente suplente."""
        suplencia = SuplenciaDocente.objects.create(
            id_curso_materia=self.cm,
            id_docente_suplente=self.suplente,
            nivel=1,
            fecha_inicio=timezone.now().date(),
            fecha_fin=(timezone.now() + timezone.timedelta(days=7)).date(),
            estado=True,
        )

        _notificar_suplencia_asignada(suplencia)

        n = Notificacion.objects.get(id_usuario=self.suplente_user)
        self.assertEqual(n.titulo, 'Suplencia asignada')
        self.assertIn('Lengua', n.mensaje)
        self.assertIn('1°1', n.mensaje)

    def test_sin_usuario_suplente_no_notifica(self):
        """Si el suplente no tiene usuario, no se notifica."""
        suplente_sin_user = crear_docente()
        suplencia = SuplenciaDocente.objects.create(
            id_curso_materia=self.cm,
            id_docente_suplente=suplente_sin_user,
            nivel=1,
            fecha_inicio=timezone.now().date(),
            fecha_fin=(timezone.now() + timezone.timedelta(days=7)).date(),
            estado=True,
        )

        _notificar_suplencia_asignada(suplencia)
        self.assertEqual(Notificacion.objects.count(), 0)

    def test_suplencia_notifica_a_estudiantes_y_familia(self):
        """Corrección posterior — la suplencia también notifica a los
        estudiantes del curso y a sus familias, con id_alumno."""
        user_alumno = crear_usuario('alum_sup', roles=('alumno',))
        tutor = crear_tutor(id_usuario=crear_usuario('fam_sup', roles=('familia',)))
        alumno = crear_alumno(
            id_usuario=user_alumno, id_tutor=tutor, id_curso=self.curso,
        )

        suplencia = SuplenciaDocente.objects.create(
            id_curso_materia=self.cm,
            id_docente_suplente=self.suplente,
            nivel=1,
            fecha_inicio=timezone.now().date(),
            fecha_fin=(timezone.now() + timezone.timedelta(days=7)).date(),
            estado=True,
        )

        _notificar_suplencia_asignada(suplencia)

        # El estudiante recibe con id_alumno correspondiente
        n_al = Notificacion.objects.get(id_usuario=user_alumno)
        self.assertEqual(n_al.id_alumno_id, alumno.id_alumno)
        self.assertEqual(n_al.titulo, 'Suplencia asignada')
        self.assertIn('Lengua', n_al.mensaje)

        # La familia recibe con id_alumno correspondiente
        n_fam = Notificacion.objects.get(id_usuario=tutor.id_usuario)
        self.assertEqual(n_fam.id_alumno_id, alumno.id_alumno)

        # El suplente sigue recibiendo su notificación profesional
        self.assertEqual(
            Notificacion.objects.filter(id_usuario=self.suplente_user).count(),
            1,
        )

    def test_suplencia_no_notifica_a_alumno_de_otro_curso(self):
        """Los estudiantes de otros cursos no reciben la notificación de la
        suplencia."""
        user_fuera = crear_usuario('alum_sup2', roles=('alumno',))
        curso2 = crear_curso('2°1')
        crear_alumno(id_usuario=user_fuera, id_curso=curso2)

        suplencia = SuplenciaDocente.objects.create(
            id_curso_materia=self.cm,
            id_docente_suplente=self.suplente,
            nivel=1,
            fecha_inicio=timezone.now().date(),
            fecha_fin=(timezone.now() + timezone.timedelta(days=7)).date(),
            estado=True,
        )

        _notificar_suplencia_asignada(suplencia)

        self.assertEqual(
            Notificacion.objects.filter(id_usuario=user_fuera).count(),
            0,
        )


class Parte5PlanificacionTests(TestCase):
    """E8 — Planificación para revisión."""

    def setUp(self):
        self.curso = crear_curso('1°1')
        self.materia = crear_materia('Historia')
        self.docente = crear_docente()
        self.docente_user = crear_usuario('doc_plan', roles=('docente',))
        self.docente.id_usuario = self.docente_user
        self.docente.save()

        self.cm = crear_curso_materia(self.curso, self.materia, self.docente)

        # Usuarios directivos
        self.admin_user = crear_usuario('admin_plan', roles=('admin',))
        self.director_user = crear_usuario('dir_plan', roles=('director',))
        self.preceptor_user = crear_usuario('prec_plan', roles=('preceptor',))  # no debe recibir

    def test_creada_por_docente_notifica_a_directivos(self):
        """Al crear una planificación como docente, notifica a admin y director."""
        planificacion = Planificacion.objects.create(
            id_docente=self.docente,
            id_curso_materia=self.cm,
            contenido='Contenido de prueba',
            estado='Borrador',
        )

        _notificar_planificacion_para_revision(planificacion, accion='creada')

        self.assertTrue(Notificacion.objects.filter(id_usuario=self.admin_user).exists())
        self.assertTrue(Notificacion.objects.filter(id_usuario=self.director_user).exists())
        # Preceptor no debe recibir
        self.assertFalse(Notificacion.objects.filter(id_usuario=self.preceptor_user).exists())

    def test_actualizada_por_docente_notifica_a_directivos(self):
        """Al actualizar una planificación como docente, notifica a directivos."""
        planificacion = Planificacion.objects.create(
            id_docente=self.docente,
            id_curso_materia=self.cm,
            contenido='Contenido inicial',
            estado='Borrador',
        )

        _notificar_planificacion_para_revision(planificacion, accion='actualizada')

        n = Notificacion.objects.get(id_usuario=self.admin_user)
        self.assertEqual(n.titulo, 'Planificación actualizada')
        self.assertIn('actualizó', n.mensaje)

    def test_sin_curso_materia_no_notifica(self):
        """Si la planificación no tiene curso_materia válido, no notifica."""
        # El modelo requiere id_curso_materia NOT NULL, así que probamos
        # pasando None directamente al helper (simulando dato inválido).
        class FakePlan:
            id_curso_materia = None
            id_docente = self.docente
        _notificar_planificacion_para_revision(FakePlan(), accion='creada')
        self.assertEqual(Notificacion.objects.count(), 0)


class Parte5DDJJTests(TestCase):
    """E9 — DDJJ presentada."""

    def setUp(self):
        self.docente = crear_docente()
        self.docente_user = crear_usuario('doc_ddjj', roles=('docente',))
        self.docente.id_usuario = self.docente_user
        self.docente.save()

        self.admin_user = crear_usuario('admin_ddjj', roles=('admin',))
        self.director_user = crear_usuario('dir_ddjj', roles=('director',))
        self.preceptor_user = crear_usuario('prec_ddjj', roles=('preceptor',))

    def test_ddjj_presentada_notifica_a_directivos(self):
        """Al presentar una DDJJ, notifica a admin y director."""
        ddjj = DdjjDocente.objects.create(
            id_docente=self.docente,
            ruta_archivo='ddjj_docentes/test.pdf',
        )

        _notificar_ddjj_presentada(ddjj)

        self.assertTrue(Notificacion.objects.filter(id_usuario=self.admin_user).exists())
        self.assertTrue(Notificacion.objects.filter(id_usuario=self.director_user).exists())
        self.assertFalse(Notificacion.objects.filter(id_usuario=self.preceptor_user).exists())

        n = Notificacion.objects.get(id_usuario=self.admin_user)
        self.assertEqual(n.titulo, 'DDJJ presentada')
        self.assertIn(self.docente.nombre, n.mensaje)

    def test_sin_directivos_no_falla(self):
        """Si no hay directivos en el sistema, no falla."""
        # Eliminar admin y director
        Usuario.objects.filter(usuario__in=['admin_ddjj', 'dir_ddjj']).delete()

        ddjj = DdjjDocente.objects.create(
            id_docente=self.docente,
            ruta_archivo='ddjj_docentes/test2.pdf',
        )

        # No debe lanzar excepción
        _notificar_ddjj_presentada(ddjj)
        self.assertEqual(Notificacion.objects.count(), 0)