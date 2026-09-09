export const menuItems = [
  { id: 'docente', label: 'Mi Perfil', icon: 'fa-user-tie' },

  {
    id: 'gestion-academica',
    label: 'Gestión Académica Diaria',
    icon: 'fa-chalkboard-teacher',
    children: [
      { id: 'libro-temas', label: 'Libro de Temas', icon: 'fa-book-open' },
      { id: 'asistencia', label: 'Asistencia', icon: 'fa-user-check' },
      { id: 'alumnos', label: 'Calificaciones', icon: 'fa-graduation-cap' },
    ],
  },

  {
    id: 'planificacion',
    label: 'Planificación y Contenidos',
    icon: 'fa-folder-open',
    children: [
      { id: 'planif', label: 'Proyectos', icon: 'fa-folder-open' },
      { id: 'actividades', label: 'Actividades', icon: 'fa-tasks' },
    ],
  },

  {
    id: 'seguimiento',
    label: 'Seguimiento de Alumnos',
    icon: 'fa-users',
    children: [
      { id: 'info', label: 'Diagnósticos grupales', icon: 'fa-info-circle' },
      { id: 'actas', label: 'Actas', icon: 'fa-file-signature' },
    ],
  },

  {
    id: 'utilidades',
    label: 'Información y Utilidades',
    icon: 'fa-tools',
    children: [
      { id: 'calendario', label: 'Calendario Institucional', icon: 'fa-calendar-alt' },
    ],
  },
];

export const bottomItems = [
  { id: 'notificaciones', label: 'Notificaciones', icon: 'fa-bell' },
];