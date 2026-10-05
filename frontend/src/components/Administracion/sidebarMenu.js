export const menuItems = [
  { id: 'perfil', label: 'Mi Perfil', icon: 'fa-user-shield' },

  {
    id: 'gestion-academica',
    label: 'Gestión Académica',
    icon: 'fa-school',
    children: [
      { id: 'alumnos', label: 'Estudiantes', icon: 'fa-user-graduate' },
      { id: 'tutores', label: 'Tutores/familias', icon: 'fa-user-shield' },
      { id: 'docentes', label: 'Docentes', icon: 'fa-chalkboard-teacher' },
      { id: 'preceptores', label: 'Preceptores', icon: 'fa-user-tie' },
      { id: 'jefes-preceptores', label: 'Jefes de Preceptores', icon: 'fa-user-cog' },
      { id: 'administradores', label: 'Administradores', icon: 'fa-user-shield', directorOnly: true },
      { id: 'cursos', label: 'Cursos', icon: 'fa-book-open' },
      { id: 'materias', label: 'Materias', icon: 'fa-book' },
      { id: 'suplencias', label: 'Suplencias Docentes', icon: 'fa-user-clock', roles: ['admin', 'director'] },
      { id: 'info', label: 'Diagnósticos de Curso', icon: 'fa-info-circle' },
    ],
  },

  {
    id: 'horarios-asistencia',
    label: 'Horarios y Asistencia',
    icon: 'fa-clock',
    children: [
      { id: 'horarios', label: 'Horarios', icon: 'fa-calendar-alt' },
      { id: 'adelantos-horas', label: 'Adelantos de Horas', icon: 'fa-forward' },
      { id: 'asistencias', label: 'Asistencias', icon: 'fa-user-check' },
    ],
  },

  {
    id: 'evaluacion',
    label: 'Evaluación',
    icon: 'fa-clipboard-list',
    children: [
      { id: 'notas', label: 'RITE', icon: 'fa-file-alt' },
      { id: 'actas', label: 'Actas', icon: 'fa-file-signature' },
    ],
  },

  {
    id: 'comunicacion',
    label: 'Comunicación y Utilidades',
    icon: 'fa-tools',
    children: [
      { id: 'comunicados', label: 'Comunicados', icon: 'fa-bullhorn' },
      { id: 'calendario', label: 'Calendario Institucional', icon: 'fa-calendar-alt' },
      { id: 'historial', label: 'Historial de Cambios', icon: 'fa-history', roles: ['admin', 'director'] },
    ],
  },

  // Datos maestros. Sin esta sección, configurar un ciclo lectivo, un módulo
  // horario o un período de evaluación exigía un INSERT SQL manual. La escritura
  // está restringida a admin/director en el backend (`IsAdminOrDirectorForWrite`),
  // y acá el grupo solo se muestra para esos mismos roles.
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: 'fa-sliders-h',
    roles: ['admin', 'director'],
    children: [
      { id: 'ciclos-lectivos', label: 'Ciclos lectivos', icon: 'fa-calendar-check', roles: ['admin', 'director'] },
      { id: 'modulos-horarios', label: 'Módulos horarios', icon: 'fa-clock', roles: ['admin', 'director'] },
      { id: 'periodos-evaluacion', label: 'Períodos de evaluación', icon: 'fa-list-ol', roles: ['admin', 'director'] },
      { id: 'estados-asistencia', label: 'Estados de asistencia', icon: 'fa-user-check', roles: ['admin', 'director'] },
      { id: 'tipos-acta', label: 'Tipos de acta', icon: 'fa-file-signature', roles: ['admin', 'director'] },
    ],
  },
];

export const bottomItems = [
  { id: 'notificaciones', label: 'Notificaciones', icon: 'fa-bell' },
];