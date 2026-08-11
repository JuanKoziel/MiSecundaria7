from django.test import TestCase

from escuela.models import Acta, Curso, Materia

from .factories import cliente_para, crear_curso, crear_materia, crear_usuario


class BorradoLogicoMateriaTests(TestCase):

    def test_delete_marca_estado_false_y_fecha_eliminacion(self):
        crear_usuario('admin', roles=('admin',))
        materia = crear_materia('Física')
        resp = cliente_para('admin').delete(f'/api/materias/{materia.id_materia}/')
        self.assertEqual(resp.status_code, 204)
        materia.refresh_from_db()
        self.assertFalse(materia.estado)
        self.assertIsNotNone(materia.fecha_eliminacion)

    def test_registro_eliminado_excluido_del_queryset_normal(self):
        crear_usuario('admin', roles=('admin',))
        materia = crear_materia('Química')
        cliente_para('admin').delete(f'/api/materias/{materia.id_materia}/')
        self.assertFalse(Materia.objects.filter(pk=materia.pk).exists())
        self.assertTrue(Materia.all_objects.filter(pk=materia.pk).exists())

    def test_listado_no_incluye_eliminados(self):
        crear_usuario('admin', roles=('admin',))
        m1 = crear_materia('Geografía')
        crear_materia('Historia')
        cliente_para('admin').delete(f'/api/materias/{m1.id_materia}/')
        resp = cliente_para('admin').get('/api/materias/')
        self.assertEqual(resp.status_code, 200)
        nombres = [m['nombre_materia'] for m in resp.json()]
        self.assertNotIn('Geografía', nombres)
        self.assertIn('Historia', nombres)


class BorradoLogicoCursoTests(TestCase):

    def test_delete_curso_es_logico(self):
        crear_usuario('admin', roles=('admin',))
        curso = crear_curso('2°B')
        resp = cliente_para('admin').delete(f'/api/cursos/{curso.id_curso}/')
        self.assertEqual(resp.status_code, 204)
        curso.refresh_from_db()
        self.assertFalse(curso.estado)
        self.assertIsNotNone(curso.fecha_eliminacion)
        self.assertFalse(Curso.objects.filter(pk=curso.pk).exists())
        self.assertTrue(Curso.all_objects.filter(pk=curso.pk).exists())


class BorradoLogicoActaTests(TestCase):

    def test_acta_eliminada_queda_en_historial_con_fecha(self):
        from .factories import crear_acta, crear_tipo_acta, crear_usuario as cu
        autor = cu('autor_hist', roles=('docente',))
        tipo = crear_tipo_acta('Comunicación')
        acta = crear_acta(autor, tipo)
        cliente_para('autor_hist').delete(f'/api/actas/{acta.id_acta}/')
        acta.refresh_from_db()
        self.assertFalse(acta.estado)
        self.assertIsNotNone(acta.fecha_eliminacion)
        # all_objects permite consultar el "historial" del borrado
        self.assertTrue(Acta.all_objects.filter(pk=acta.pk).exists())
