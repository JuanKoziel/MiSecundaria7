from escuela.models import Rol, Usuario, UsuarioRol, Directivo

print('=== ROLES ===')
for rol in Rol.objects.all():
    print(f"  id_rol: {rol.id_rol}, nombre_rol: {rol.nombre_rol}")

print('\n=== USUARIOS ===')
for usuario in Usuario.objects.all():
    print(f"  id_usuario: {usuario.id_usuario}, usuario: {usuario.usuario}, estado: {usuario.estado}")

print('\n=== USUARIO_ROLES ===')
for ur in UsuarioRol.objects.all():
    print(f"  id_usuario: {ur.id_usuario_id}, id_rol: {ur.id_rol_id}")

print('\n=== DIRECTIVOS ===')
for directivo in Directivo.objects.all():
    print(f"  id_directivo: {directivo.id_directivo}, id_usuario: {directivo.id_usuario_id}, nombre: {directivo.nombre}, apellido: {directivo.apellido}, dni: {directivo.dni}")
