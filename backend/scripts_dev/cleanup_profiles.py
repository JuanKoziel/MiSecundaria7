#!/usr/bin/env python
import os, django
sys_path = r'C:\Users\eest n2\Documents\Secundaria 7\Mi Secundaria 7\backend\proyecto'
if sys_path not in __import__('sys').path:
    __import__('sys').path.insert(0, sys_path)
os.environ['DJANGO_SETTINGS_MODULE'] = 'proyecto.settings'
django.setup()

from escuela.models import Usuario, Rol, UsuarioRol, Docente, PadreTutor, Preceptor, Directivo, Alumno

print("=" * 70)
print("LIMPIEZA DE CONSISTENCIA PERFIL-ROLE")
print("=" * 70)

# Step 1: Collect all user data
users = Usuario.objects.all()

user_profiles = {}
for u in users:
    pfs = []
    try:
        if u.docente is not None: pfs.append('Docente')
    except: pass
    try:
        if u.padre_tutor is not None: pfs.append('PadreTutor')
    except: pass
    try:
        if u.preceptor is not None: pfs.append('Preceptor')
    except: pass
    try:
        if u.directivo is not None: pfs.append('Directivo')
    except: pass
    try:
        if u.alumno is not None: pfs.append('Alumno')
    except: pass
    user_profiles[u.id_usuario] = pfs

user_roles = {}
for u in users:
    rls = [ur.id_rol.nombre_rol for ur in UsuarioRol.objects.filter(id_usuario=u).select_related('id_rol')]
    user_roles[u.id_usuario] = rls

PROFILE_TO_ROLE = {
    'Docente': 'docente',
    'PadreTutor': 'familia',
    'Preceptor': 'preceptor',
    'Directivo': 'admin',
    'Alumno': 'alumno',
}

print("\n--- PASO 1: Usuarios con perfil pero role esperado FALTANTE ---")
missing_role_users = []
for uid, profiles in user_profiles.items():
    u = Usuario.objects.get(id_usuario=uid)
    for pf in profiles:
        expected_role = PROFILE_TO_ROLE.get(pf)
        if expected_role and expected_role not in user_roles.get(uid, []):
            missing_role_users.append((u.usuario, pf, expected_role))
            print("  [X] User " + str(u.usuario)[:15] + " | perfil=" + pf + " | role_esperado=" + expected_role + " | roles_actuales=" + str(user_roles.get(uid, [])))

if not missing_role_users:
    print("  Ningun usuario con perfil faltante de role esperado.")

print("\n--- PASO 2: Roles inconsistentes a remover ---")
removed = 0
for uid in user_profiles:
    profiles = user_profiles[uid]
    roles = user_roles.get(uid, [])
    
    for pf in profiles:
        expected_role = PROFILE_TO_ROLE.get(pf)
        if not expected_role:
            continue
        
        unexpected_roles = [r for r in roles if r != expected_role]
        
        for role_no_esperado in unexpected_roles:
            # Mapping: role name -> profile type
            role_to_profile = {'docente': 'Docente', 'familia': 'PadreTutor',
                               'preceptor': 'Preceptor', 'alumno': 'Alumno'}
            profile_for_unexpected = role_to_profile.get(role_no_esperado)
            
            if profile_for_unexpected:
                user_has_unexpected_profile = profile_for_unexpected in user_profiles.get(uid, [])
                if not user_has_unexpected_profile:
                    # Remover role
                    UsuarioRol.objects.filter(id_usuario=uid, id_rol__nombre_rol=role_no_esperado).delete()
                    removed += 1
                    u = Usuario.objects.get(id_usuario=uid)
                    print("  [REMOVIDO] role '" + role_no_esperado + "' de user " + str(u.usuario))

print("\n  Total roles removidos: " + str(removed))

print("\n--- PASO 3: Resumen final ---")
for uid in sorted(user_profiles.keys()):
    u = Usuario.objects.get(id_usuario=uid)
    profiles = user_profiles[uid]
    roles = user_roles.get(uid, [])
    
    uname = str(u.usuario)[:12] if u.usuario else str(uid)[:12]
    
    # Check for issues
    has_issues = False
    issue_parts = []
    
    for pf in profiles:
        expected_role = PROFILE_TO_ROLE.get(pf)
        if expected_role and expected_role not in roles:
            has_issues = True
            issue_parts.append("perfil=" + pf + " missing role=" + expected_role)
    
    if has_issues or (len(profiles) == 0 and len(roles) > 0):
        issue_str = "; ".join(issue_parts) if issue_parts else "sin perfil pero tiene roles"
        print("  [!] User " + uname + " | perfiles=" + str(profiles) + " | roles=" + str(roles) + " | " + issue_str)

print("\n" + "=" * 70)
print("LIMPIEZA COMPLETADA")
print("=" * 70)