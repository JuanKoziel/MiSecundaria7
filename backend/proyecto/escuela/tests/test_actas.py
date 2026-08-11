from django.test import TestCase

from escuela.models import Acta, ActaAlumno, ActaCurso, ActaDocente

from .factories import (
    cliente_para,
    crear_acta,
    crear_alumno,
    crear_curso,
    crear_docente,
    crear_tipo_acta,
    crear_usuario,
)


class CrearActaTests(TestCase):

    def setUp(self):
        self.tipo = crear_tipo_acta('Comunicación')

    def test_creacion_permitida_a_docente_preceptor_jefe(self):
        for rol in ('docente', 'preceptor', 'jefe_preceptores'):
            with self.subTest(rol=rol):
                crear_usuario(f'autor_{rol}', roles=(rol,))
                resp = cliente_para(f'autor_{rol}').post('/api/actas/', {
                    'id_tipo_acta': self.tipo.id_tipo_acta,
                    'titulo': f'Acta {rol}',
                })
                self.assertEqual(resp.status_code, 201)
                self.assertEqual(resp.json()['titulo'], f'Acta {rol}')

    def test_creacion_denegada_a_familia_alumno_admin_director(self):
        for rol in ('familia', 'alumno', 'admin', 'director'):
            with self.subTest(rol=rol):
                crear_usuario(f'neg_{rol}', roles=(rol,))
                resp = cliente_para(f'neg_{rol}').post('/api/actas/', {
                    'id_tipo_acta': self.tipo.id_tipo_acta,
                    'titulo': 'No permitido',
                })
                self.assertEqual(resp.status_code, 403)

    def test_creador_siempre_es_el_usuario_autenticado(self):
        """Aunque el payload intente poner otro creador, el backend ignora
        `id_usuario_creador` (campo read_only) y usa el usuario real."""
        autor = crear_usuario('autor_real', roles=('docente',))
        otro = crear_usuario('otro_usuario', roles=('docente',))
        resp = cliente_para('autor_real').post('/api/actas/', {
            'id_tipo_acta': self.tipo.id_tipo_acta,
            'titulo': 'Acta con suplantación',
            'id_usuario_creador': otro.id_usuario,
        })
        self.assertEqual(resp.status_code, 201)
        acta = Acta.objects.get(pk=resp.json()['id_acta'])
        self.assertEqual(acta.id_usuario_creador_id, autor.id_usuario)


class EditarActaTests(TestCase):

    def setUp(self):
        self.tipo = crear_tipo_acta('Comunicación')
        self.autor = crear_usuario('autor', roles=('docente',))
        self.otro_docente = crear_usuario('otro_docente', roles=('docente',))
        self.acta = crear_acta(self.autor, self.tipo, titulo='Acta original')

    def test_propietario_puede_editar(self):
        resp = cliente_para('autor').patch(
            f'/api/actas/{self.acta.id_acta}/', {'titulo': 'Editada por autor'},
        )
        self.assertEqual(resp.status_code, 200)
        self.acta.refresh_from_db()
        self.assertEqual(self.acta.titulo, 'Editada por autor')

    def test_otro_docente_no_puede_editar(self):
        resp = cliente_para('otro_docente').patch(
            f'/api/actas/{self.acta.id_acta}/', {'titulo': 'Intruso'},
        )
        self.assertEqual(resp.status_code, 403)

    def test_familia_no_puede_editar(self):
        crear_usuario('familia_edit', roles=('familia',))
        resp = cliente_para('familia_edit').patch(
            f'/api/actas/{self.acta.id_acta}/', {'titulo': 'Intruso'},
        )
        self.assertEqual(resp.status_code, 403)

    def test_admin_y_director_editan_cualquier_acta(self):
        for rol in ('admin', 'director'):
            with self.subTest(rol=rol):
                crear_usuario(f'gestor_{rol}', roles=(rol,))
                resp = cliente_para(f'gestor_{rol}').patch(
                    f'/api/actas/{self.acta.id_acta}/', {'titulo': f'Editado {rol}'},
                )
                self.assertEqual(resp.status_code, 200)
                self.acta.refresh_from_db()
                self.assertEqual(self.acta.titulo, f'Editado {rol}')


class EliminarActaTests(TestCase):

    def setUp(self):
        self.tipo = crear_tipo_acta('Comunicación')
        self.autor = crear_usuario('autor_elim', roles=('docente',))
        self.otro = crear_usuario('otro_elim', roles=('preceptor',))
        self.acta = crear_acta(self.autor, self.tipo)

    def test_borrado_es_logico(self):
        resp = cliente_para('autor_elim').delete(f'/api/actas/{self.acta.id_acta}/')
        self.assertEqual(resp.status_code, 204)
        self.acta.refresh_from_db()
        self.assertFalse(self.acta.estado)
        self.assertIsNotNone(self.acta.fecha_eliminacion)
        # Excluida de los querysets normales (manager ActivoManager)
        self.assertFalse(Acta.objects.filter(pk=self.acta.pk).exists())
        # Visible en all_objects (historial/borrado)
        self.assertTrue(Acta.all_objects.filter(pk=self.acta.pk).exists())

    def test_otro_usuario_no_puede_eliminar(self):
        resp = cliente_para('otro_elim').delete(f'/api/actas/{self.acta.id_acta}/')
        self.assertEqual(resp.status_code, 403)
        self.acta.refresh_from_db()
        self.assertTrue(self.acta.estado)

    def test_admin_puede_eliminar_acta_ajena(self):
        crear_usuario('admin_elim', roles=('admin',))
        resp = cliente_para('admin_elim').delete(f'/api/actas/{self.acta.id_acta}/')
        self.assertEqual(resp.status_code, 204)


class RelacionesActaTests(TestCase):

    def setUp(self):
        self.tipo = crear_tipo_acta('Comunicación')
        self.autor = crear_usuario('autor_rel', roles=('preceptor',))
        self.otro = crear_usuario('otro_rel', roles=('preceptor',))
        self.acta_propia = crear_acta(self.autor, self.tipo, titulo='Propia')
        self.acta_ajena = crear_acta(self.otro, self.tipo, titulo='Ajena')
        self.curso = crear_curso('1°A')
        self.docente = crear_docente()
        self.alumno = crear_alumno(id_curso=self.curso)

    def test_puede_crear_relacion_sobre_acta_propia(self):
        resp = cliente_para('autor_rel').post('/api/acta-curso/', {
            'id_acta': self.acta_propia.id_acta,
            'id_curso': self.curso.id_curso,
        })
        self.assertEqual(resp.status_code, 201)

    def test_no_puede_crear_relacion_sobre_acta_ajena(self):
        resp = cliente_para('autor_rel').post('/api/acta-curso/', {
            'id_acta': self.acta_ajena.id_acta,
            'id_curso': self.curso.id_curso,
        })
        self.assertEqual(resp.status_code, 403)

    def test_acta_alumno_y_acta_docente_respetan_propiedad(self):
        for url, payload in (
            ('/api/acta-alumno/', {
                'id_acta': self.acta_ajena.id_acta, 'id_alumno': self.alumno.id_alumno,
            }),
            ('/api/acta-docente/', {
                'id_acta': self.acta_ajena.id_acta, 'id_docente': self.docente.id_docente,
            }),
        ):
            with self.subTest(url=url):
                resp = cliente_para('autor_rel').post(url, payload)
                self.assertEqual(resp.status_code, 403)

    def test_creador_puede_crear_ambas_relaciones(self):
        c = cliente_para('autor_rel')
        r1 = c.post('/api/acta-alumno/', {
            'id_acta': self.acta_propia.id_acta, 'id_alumno': self.alumno.id_alumno,
        })
        r2 = c.post('/api/acta-docente/', {
            'id_acta': self.acta_propia.id_acta, 'id_docente': self.docente.id_docente,
        })
        self.assertEqual(r1.status_code, 201)
        self.assertEqual(r2.status_code, 201)

    def test_admin_no_crea_relaciones_pero_puede_modificarlas(self):
        crear_usuario('admin_rel', roles=('admin',))
        rel = ActaCurso.objects.create(
            id_acta=self.acta_ajena, id_curso=self.curso,
        )
        # Admin no crea actas/relaciones desde el sistema (regla real).
        resp = cliente_para('admin_rel').post('/api/acta-curso/', {
            'id_acta': self.acta_ajena.id_acta, 'id_curso': self.curso.id_curso,
        })
        self.assertEqual(resp.status_code, 403)
        # Pero sí puede borrar la relación de un acta ajena.
        resp = cliente_para('admin_rel').delete(
            f'/api/acta-curso/{rel.id_acta_curso}/',
        )
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(ActaCurso.objects.filter(pk=rel.pk).exists())


class ActasRelationsNoSuplantablesTests(TestCase):

    def test_relaciones_de_acta_ajena_ni_se_borran_ni_se_editan(self):
        tipo = crear_tipo_acta('Comunicación')
        autor = crear_usuario('a1', roles=('docente',))
        otro = crear_usuario('a2', roles=('docente',))
        acta = crear_acta(autor, tipo)
        alumno = crear_alumno()
        rel = ActaAlumno.objects.create(id_acta=acta, id_alumno=alumno)
        resp = cliente_para('a2').delete(f'/api/acta-alumno/{rel.id_acta_alumno}/')
        self.assertEqual(resp.status_code, 403)
        self.assertTrue(ActaAlumno.objects.filter(pk=rel.pk).exists())

    def test_acta_docente_relacion_borrada_logicamente_no_afecta_actas(self):
        tipo = crear_tipo_acta('Comunicación')
        autor = crear_usuario('b1', roles=('docente',))
        acta = crear_acta(autor, tipo)
        docente = crear_docente()
        resp = cliente_para('b1').post('/api/acta-docente/', {
            'id_acta': acta.id_acta, 'id_docente': docente.id_docente,
        })
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(ActaDocente.objects.filter(id_acta=acta, id_docente=docente).exists())
