export const menuItems = [
  { id: 'perfil', label: 'Mi Perfil', icon: 'fa-user-tie' },

  {
    id: 'gestion-alumnos',
    label: 'Gestión de Usuarios',
    icon: 'fa-users',
    children: [
      { id: 'alumnos', label: 'Estudiantes', icon: 'fa-user-graduate' },
      { id: 'tutores', label: 'Tutores', icon: 'fa-user-shield' },
      { id: 'docentes', label: 'Docentes', icon: 'fa-chalkboard-teacher' },
    ],
  },

  {
    id: 'evaluacion',
    label: 'Evaluación',
    icon: 'fa-clipboard-list',
    children: [
      { id: 'asistencias', label: 'Asistencias', icon: 'fa-user-check' },
      { id: 'notas', label: 'Calificaciones', icon: 'fa-graduation-cap' },
      { id: 'actas', label: 'Actas', icon: 'fa-file-signature' },
    ],
  },

  {
    id: 'informacion',
    label: 'Información y Utilidades',
    icon: 'fa-tools',
    children: [
      { id: 'horarios', label: 'Horarios', icon: 'fa-calendar-alt' },
      { id: 'adelantos-horas', label: 'Adelantos de Horas', icon: 'fa-forward' },
      { id: 'comunicados', label: 'Comunicados', icon: 'fa-bullhorn' },
      { id: 'calendario', label: 'Calendario Institucional', icon: 'fa-calendar-alt' },
    ],
  },
];

export const bottomItems = [
  { id: 'notificaciones', label: 'Notificaciones', icon: 'fa-bell' },
];