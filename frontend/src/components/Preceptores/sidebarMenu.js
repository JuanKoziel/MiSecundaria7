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
    id: 'gestion-diaria',
    label: 'Gestión Diaria',
    icon: 'fa-clipboard-list',
    children: [
      { id: 'panel-diario', label: 'Panel Diario', icon: 'fa-clipboard-check' },
      { id: 'asistencias', label: 'Asistencias', icon: 'fa-user-check' },
      { id: 'notas', label: 'Calificaciones', icon: 'fa-graduation-cap' },
    ],
  },

  {
    id: 'contenido',
    label: 'Contenido',
    icon: 'fa-folder-open',
    children: [
      { id: 'proyectos', label: 'Proyectos', icon: 'fa-project-diagram' },
      { id: 'libro-temas', label: 'Libros de Temas', icon: 'fa-book-open' },
      { id: 'actas', label: 'Actas', icon: 'fa-file-signature' },
      { id: 'actividades', label: 'Actividades', icon: 'fa-tasks' },
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