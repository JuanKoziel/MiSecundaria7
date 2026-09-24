export const menuItems = [
  { id: 'perfil', label: 'Mi Perfil', icon: 'fa-user-tie' },

  {
    id: 'jefatura',
    label: 'Gestión de Jefatura',
    icon: 'fa-cogs',
    children: [
      { id: 'admin-preceptores', label: 'Administración de Preceptores', icon: 'fa-user-cog' },
      { id: 'asignacion-cursos', label: 'Asignación de Cursos', icon: 'fa-calendar-day' },
      { id: 'supervision-preceptores', label: 'Supervisión de Preceptores', icon: 'fa-user-shield' },
      { id: 'estadisticas', label: 'Estadísticas', icon: 'fa-chart-bar' },
    ],
  },

  {
    id: 'seguimiento',
    label: 'Seguimiento Escolar',
    icon: 'fa-clipboard-list',
    children: [
      { id: 'alumnos', label: 'Estudiantes', icon: 'fa-user-graduate' },
      { id: 'asistencias', label: 'Asistencias', icon: 'fa-user-check' },
      { id: 'notas', label: 'RITE', icon: 'fa-file-alt' },
      { id: 'actas', label: 'Actas', icon: 'fa-file-signature' },
      { id: 'adelantos-horas', label: 'Adelantos de Horas', icon: 'fa-forward' },
    ],
  },

  {
    id: 'plantel',
    label: 'Plantel',
    icon: 'fa-users',
    children: [
      { id: 'docentes', label: 'Docentes', icon: 'fa-chalkboard-teacher' },
      { id: 'tutores', label: 'Tutores/familias', icon: 'fa-user-shield' },
    ],
  },

  {
    id: 'informacion',
    label: 'Información y Utilidades',
    icon: 'fa-tools',
    children: [
      { id: 'comunicados', label: 'Comunicados', icon: 'fa-bullhorn' },
      { id: 'calendario', label: 'Calendario Institucional', icon: 'fa-calendar-alt' },
      { id: 'historial', label: 'Historial de Cambios', icon: 'fa-history' },
    ],
  },
];

export const bottomItems = [
  { id: 'notificaciones', label: 'Notificaciones', icon: 'fa-bell' },
];