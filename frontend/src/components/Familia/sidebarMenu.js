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
      { id: 'materias-adeudadas', label: 'Materias Adeudadas', icon: 'fa-book' },
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
      // "Diagnósticos" se saco del menu de Familia: los diagnosticos son grupales
      // (del curso) y las familias no deben verlos. El portal lo muestra solo
      // para roles pedagogicos.
    ],
  },
];

export const bottomItems = [
  { id: 'notificaciones', label: 'Notificaciones', icon: 'fa-bell' },
];