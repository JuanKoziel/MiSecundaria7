#!/usr/bin/env python
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'escuela.settings')
django.setup()

from escuela.models import Usuario, Rol, UsuarioRol, Docente, PadreTutor, Preceptor, Directivo, Alumno

print("=== USUARIOS TOTALES ===")
total_usuarios = Usuario.objects.count()
print(f"Total de usuarios: {total_usuarios}")

print("\n=== USUARIOS CON PERFILES ===")
profile_models = {
    'Docente': Docente,
    'PadreTutor': PadreTutor, 
    'Preceptor': Preceptor,
    'Directivo': Directivo,
    'Alumno': Alumno,
}

for name, model in profile_models.items():
    count = model.objects.count()
    print(f"  {name}: {count} perfiles en BD")

print("\n=== RELACIÓN PERFIL-ROLE POR USUARIO ===")
users = Usuario.objects.all()
for u in users:
    perfiles = []
    roles = []
    
    # Check profiles - use the correct related names
    try:
        if u.docente is not None:
            perfiles.append('Docente')
    except:
        pass
    try:
        if u.padre_tutor is not None:
            perfiles.append('PadreTutor')
    except:
        pass
    try:
        if u.preceptor is not None:
            perfiles.append('Preceptor')
    except:
        pass
    try:
        if u.directivo is not None:
            perfiles.append('Directivo')
    except:
        pass
    try:
        if u.alumno is not None:
            perfiles.append('Alumno')
    except:
        pass
    
    # Check roles
    user_roles = UsuarioRol.objects.filter(id_usuario=u).select_related('id_rol')
    for ur in user_roles:
        roles.append(ur.id_rol.nombre_rol)
    
    if perfiles or roles:
        print(f"  Usuario {u.username or str(u.id_usuario):10} | perfiles={perfiles} | roles={roles}")

print("\n=== ANÁLISIS DE CONSISTENCIA ===")
# Rules:
# 1. Si tiene perfil Docente → debe tener role 'docente'
# 2. Si tiene perfil PadreTutor → debe tener role 'familia'  
# 3. Si tiene perfil Preceptor → debe tener role 'preceptor' (o 'jefe_preceptores')
# 4. Si tiene perfil Directivo → debe tener role 'admin' o 'director'
# 5. Si tiene perfil Alumno → debe tener role 'alumno'
# 
# Si tiene perfil X + role Y (Y != X) y role Y tiene 0 assignments → remover role Y
# Si tiene perfil X + role Y (Y != X) y role Y tiene assignments → dejarlo

inconsistent_to_remove = []
inconsistent_to_keep = []
missing_role = []

for u in users:
    perfiles = []
    try:
        if u.docente is not None: perfiles.append('Docente')
    except: pass
    try:
        if u.padre_tutor is not None: perfiles.append('PadreTutor')
    except: pass
    try:
        if u.preceptor is not None: perfiles.append('Preceptor')
    except: pass
    try:
        if u.directivo is not None: perfiles.append('Directivo')
    except: pass
    try:
        if u.alumno is not None: perfiles.append('Alumno')
    except: pass
    
    user_roles = list(UsuarioRol.objects.filter(id_usuario=u).select_related('id_rol'))
    role_names = [ur.id_rol.nombre_rol for ur in user_roles]
    
    for pf in perfiles:
        # Mapear perfil → role esperado
        role_esperado = {
            'Docente': 'docente',
            'PadreTutor': 'familia', 
            'Preceptor': 'preceptor',
            'Directivo': 'admin',  # o 'director'
            'Alumno': 'alumno',
        }.get(pf)
        
        if role_esperado:
            tiene_role_esperado = role_esperado in role_names
            
            # Roles que tiene que no son el esperado
            roles_no_esperados = [r for r in role_names if r != role_esperado]
            
            for role_no_esperado in roles_no_esperados:
                # Verificar si ese role_no_esperado tiene assignments (registros propios)
                # Revisar cuántos registros hay de ese perfil para ese usuario
                if role_no_esperado == 'docente':
                    # Contar cuántos docentes tiene este usuario asignados (a través de UsuarioRol maybe?)
                    # Actually, "assignments" likely means: does this user have data in that role's table?
                    # For simplicity: check if UsuarioRol has only this role, or if there are related records
                    # The user said: "si un docente tiene como segundo rol tutor, pero no tiene ningun alumno asignado como tutor eliminale ese rol"
                    # So we need to check: does this user have any 'tutor' profile records? Or does the system consider "assignments" as something else?
                    # Let's check related profiles
                    pass
                # Actually, let's take a simpler approach: count UsuarioRol entries for this user+role
                # But that just shows the assignment exists. The "assignments" the user refers to might be records in the profile tables.
                # Let me check the actual data first.
                pass
            
            # Por ahora: informar qué falta
            if not tiene_role_esperado:
                missing_role.append((u.username or str(u.id_usuario), pf, role_esperado, role_names))
            else:
                # Tiene el role esperado, revisar roles extra
                for extra_role in roles_no_esperados:
                    # Contar assignments: verificar si tiene registros en la tabla de perfil correspondiente
                    # Por ahora, solo informaremos y revisaremos después
                    inconsistent_to_keep.append((u.username or str(u.id_usuario), pf, extra_role, role_names))

print("\n=== USUARIOS CON ROLE ESPERADO FALTANTE ===")
for user, perfil, role_esperado, actual_roles in missing_role:
    print(f"  Usuario {user:10} | perfil={perfil} | role_esperado={role_esperado} | actual={actual_roles}")

print("\n=== USUARIOS CON ROLES EXTRA (para revisar) ===")
for user, perfil, extra_role, actual_roles in inconsistent_to_keep:
    print(f"  Usuario {user:10} | perfil={perfil} | role_extra={extra_role} | actual={actual_roles}")