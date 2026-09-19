export const menuItems = [
  { id: 'perfil', label: 'Mi Perfil', icon: 'fa-user-tie' },

  {
    id: 'seguimiento',
    label: 'Seguimiento Académico',
    icon: 'fa-graduation-cap',
    children: [
      { id: 'resumen', label: 'Resumen', icon: 'fa-home' },
      { id: 'calificaciones', label: 'Calificaciones', icon: 'fa-clipboard-list' },
      { id: 'asistencias', label: 'Asistencias', icon: 'fa-user-check' },
      { id: 'actas', label: 'Actas', icon: 'fa-file-signature' },
    ],
  },

  {
    id: 'planificacion',
    label: 'Planificación y Contenidos',
    icon: 'fa-folder-open',
    children: [
      { id: 'actividades', label: 'Actividades', icon: 'fa-tasks' },
      { id: 'horarios', label: 'Horarios', icon: 'fa-calendar-alt' },
    ],
  },

  {
    id: 'informacion',
    label: 'Información y Utilidades',
    icon: 'fa-tools',
    children: [
      { id: 'comunicados', label: 'Comunicados', icon: 'fa-bullhorn' },
      { id: 'calendario', label: 'Calendario Institucional', icon: 'fa-calendar-alt' },
      { id: 'info', label: 'Diagnósticos', icon: 'fa-info-circle' },
    ],
  },
];

export const bottomItems = [
  { id: 'notificaciones', label: 'Notificaciones', icon: 'fa-bell' },
];