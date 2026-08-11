from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from escuela.models import Directivo, Rol, Usuario, UsuarioRol

from .factories import crear_usuario


class SeedUsuariosTests(TestCase):

    def test_primera_ejecucion_crea_todos_los_usuarios(self):
        out = StringIO()
        call_command('seed_usuarios', stdout=out)
        for nombre in ('admin_test', 'docente_test', 'preceptor_test',
                       'jefe_preceptores_test', 'familia_test', 'alumno_test',
                       'director_test', 'gperez'):
            self.assertTrue(
                Usuario.objects.filter(usuario=nombre).exists(),
                f'Falta el usuario {nombre}',
            )
        self.assertIn('Usuarios de prueba listos', out.getvalue())

    def test_segunda_ejecucion_es_idempotente(self):
        call_command('seed_usuarios', stdout=StringIO())
        total_antes = Usuario.objects.count()
        rol_antes = UsuarioRol.objects.count()
        call_command('seed_usuarios', stdout=StringIO())
        self.assertEqual(Usuario.objects.count(), total_antes)
        self.assertEqual(UsuarioRol.objects.count(), rol_antes)

    def test_jefe_preceptores_creado_con_su_rol(self):
        call_command('seed_usuarios', stdout=StringIO())
        usuario = Usuario.objects.get(usuario='jefe_preceptores_test')
        roles = set(UsuarioRol.objects.filter(id_usuario=usuario).values_list('id_rol__nombre_rol', flat=True))
        self.assertIn('jefe_preceptores', roles)

    def test_multirol_preexistente_se_preserva(self):
        u = crear_usuario('preceptor_test', roles=('preceptor',))
        UsuarioRol.objects.create(id_usuario=u, id_rol=Rol.objects.get_or_create(nombre_rol='jefe_preceptores')[0])
        call_command('seed_usuarios', stdout=StringIO())
        roles = set(UsuarioRol.objects.filter(id_usuario=u).values_list('id_rol__nombre_rol', flat=True))
        self.assertEqual(roles, {'preceptor', 'jefe_preceptores'})

    def test_director_gperez_crea_perfil_directivo(self):
        call_command('seed_usuarios', stdout=StringIO())
        usuario = Usuario.objects.get(usuario='gperez')
        directivo = Directivo.objects.get(id_usuario=usuario)
        self.assertEqual(directivo.apellido, 'Pérez')
        self.assertEqual(directivo.dni, 'gperez')
