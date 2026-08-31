export const ROLE_INFO = {
  admin: { label: 'Administrador', icon: 'fa-user-shield' },
  director: { label: 'Director', icon: 'fa-user-tie' },
  jefe_preceptores: { label: 'Jefe de Preceptores', icon: 'fa-users-cog' },
  preceptor: { label: 'Preceptor', icon: 'fa-clipboard-user' },
  docente: { label: 'Docente', icon: 'fa-chalkboard-teacher' },
  familia: { label: 'Familia', icon: 'fa-users' },
  alumno: { label: 'Estudiante', icon: 'fa-user-graduate' },
};

export function getRoleInfo(role) {
  return ROLE_INFO[role] || { label: role || 'Sin rol', icon: 'fa-user-circle' };
}
