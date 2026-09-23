export const menuItems = [
  { id: 'perfil', label: 'Mi Perfil', icon: 'fa-user-graduate' },

  {
    id: 'seguimiento',
    label: 'Seguimiento Académico',
    icon: 'fa-clipboard-check',
    children: [
      { id: 'calificaciones', label: 'Calificaciones', icon: 'fa-book-open' },
      { id: 'asistencias', label: 'Asistencias', icon: 'fa-user-check' },
    ],
  },

  {
    id: 'contenidos',
    label: 'Contenidos',
    icon: 'fa-folder-open',
    children: [
      { id: 'materias-adeudadas', label: 'Materias Adeudadas', icon: 'fa-book-medical' },
    ],
  },

  {
    id: 'informacion',
    label: 'Información y Utilidades',
    icon: 'fa-tools',
    children: [
      { id: 'horarios', label: 'Horarios', icon: 'fa-calendar-alt' },
      { id: 'comunicados', label: 'Comunicados', icon: 'fa-bullhorn' },
      { id: 'calendario', label: 'Calendario Institucional', icon: 'fa-calendar-alt' },
      { id: 'info', label: 'Diagnósticos', icon: 'fa-info-circle' },
    ],
  },
];

export const bottomItems = [
  { id: 'notificaciones', label: 'Notificaciones', icon: 'fa-bell' },
];