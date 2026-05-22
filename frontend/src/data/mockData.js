export const alumnos = [
  { id: 1, dni: '44.123.456', nombre: 'Agustín', apellido: 'Hoffer' },
  { id: 2, dni: '45.987.654', nombre: 'Sofía', apellido: 'Martínez' },
];

export const docentes = [
  { id: 1, dni: '30.123.456', nombre: 'Carlos', apellido: 'Gómez', materia: 'Matemática' },
  { id: 2, dni: '28.987.654', nombre: 'Laura', apellido: 'Pérez', materia: 'Lengua y Lit.' },
];

export const actas = [
  { id: 1, curso: '1°1', fecha: '2025-03-10', descripcion: 'Inicio de clases' },
  { id: 2, curso: '1°2', fecha: '2025-03-12', descripcion: 'Reunión de padres' },
];

export const actasAlumno = [
  {
    id: 1,
    alumnoId: 1,
    titulo: 'Informe parcial - Matemática',
    materia: 'Matemática',
    fecha: '2026-05-15',
    cargadoPor: 'Carlos Gómez',
    archivo: 'informe_mat_agustin.pdf',
  },
  {
    id: 2,
    alumnoId: 1,
    titulo: 'Acta de evaluación - Lengua',
    materia: 'Lengua y Lit.',
    fecha: '2026-05-10',
    cargadoPor: 'Laura Pérez',
    archivo: 'acta_lengua_agustin.pdf',
  },
  {
    id: 3,
    alumnoId: 1,
    titulo: 'Informe de conducta 1° bimestre',
    materia: 'General',
    fecha: '2026-04-28',
    cargadoPor: 'Preceptoría',
    archivo: 'conducta_agustin.pdf',
  },
  {
    id: 4,
    alumnoId: 2,
    titulo: 'Informe parcial - Matemática',
    materia: 'Matemática',
    fecha: '2026-05-14',
    cargadoPor: 'Carlos Gómez',
    archivo: 'informe_mat_sofia.pdf',
  },
  {
    id: 5,
    alumnoId: 2,
    titulo: 'Acta reunión tutoría',
    materia: 'General',
    fecha: '2026-05-08',
    cargadoPor: 'Preceptoría',
    archivo: 'tutoria_sofia.pdf',
  },
];

export const aniosLectivos = [2025, 2026];

export const inscripciones = [
  { id: 1, alumnoId: 1, anioLectivo: 2026, curso: '1°1' },
  { id: 2, alumnoId: 2, anioLectivo: 2026, curso: '1°2' },
  { id: 3, alumnoId: 1, anioLectivo: 2025, curso: '1°1' },
  { id: 4, alumnoId: 2, anioLectivo: 2025, curso: '1°1' },
];

export const asignacionesDocente = [
  { id: 1, docenteId: 1, anioLectivo: 2026, curso: '1°1', materia: 'Matemática' },
  { id: 2, docenteId: 2, anioLectivo: 2026, curso: '1°1', materia: 'Lengua y Lit.' },
  { id: 3, docenteId: 1, anioLectivo: 2026, curso: '1°2', materia: 'Matemática' },
  { id: 4, docenteId: 2, anioLectivo: 2026, curso: '1°2', materia: 'Lengua y Lit.' },
  { id: 5, docenteId: 1, anioLectivo: 2025, curso: '1°1', materia: 'Matemática' },
  { id: 6, docenteId: 2, anioLectivo: 2025, curso: '1°1', materia: 'Lengua y Lit.' },
];

export const cursos = [
  '1°1', '1°2', '1°3',
  '2°1', '2°2', '2°3',
  '3°1', '3°2', '3°3',
  '4°1', '4°2', '4°3',
  '5°1', '5°2', '5°3',
  '6°1', '6°2', '6°3',
];

export const materias = ['Matemática', 'Lengua y Lit.', 'Física', 'Química'];

export const alumnosDocenteInicial = alumnos.map((a) => ({
  id: a.id,
  nombre: `${a.apellido}, ${a.nombre}`,
  prenota1: '',
  nota1: '',
  prenota2: '',
  nota2: '',
  diag: '',
}));

export const asistenciaDocenteInicial = alumnos.map((a) => ({
  id: a.id,
  nombre: `${a.apellido}, ${a.nombre}`,
  estado: 'Presente',
}));

export function nombreCompleto(alumno) {
  return `${alumno.apellido}, ${alumno.nombre}`;
}

export function nombreCorto(alumno) {
  return `${alumno.nombre} ${alumno.apellido}`;
}

export const hijosFamilia = [
  { id: 1, alumnoId: 1, curso: '1°1', vinculo: 'Padre/Madre/Tutor' },
  { id: 2, alumnoId: 2, curso: '1°2', vinculo: 'Padre/Madre/Tutor' },
];

export const calificacionesFamilia = [
  {
    id: 1,
    hijoId: 1,
    materia: 'Matemática',
    prenota1: 'TEP',
    nota1: 8,
    prenota2: 'TEA',
    nota2: 9,
    diagnostico: 'Buen desempeño sostenido',
  },
  {
    id: 2,
    hijoId: 1,
    materia: 'Lengua y Lit.',
    prenota1: 'TEA',
    nota1: 9,
    prenota2: 'TEP',
    nota2: 8,
    diagnostico: 'Participación activa',
  },
  {
    id: 3,
    hijoId: 1,
    materia: 'Física',
    prenota1: 'TEP',
    nota1: 7,
    prenota2: 'TEP',
    nota2: 8,
    diagnostico: 'En proceso de mejora',
  },
  {
    id: 4,
    hijoId: 2,
    materia: 'Matemática',
    prenota1: 'TEA',
    nota1: 10,
    prenota2: 'TEA',
    nota2: 9,
    diagnostico: 'Excelente desempeño',
  },
  {
    id: 5,
    hijoId: 2,
    materia: 'Lengua y Lit.',
    prenota1: 'TEP',
    nota1: 8,
    prenota2: 'TEP',
    nota2: 8,
    diagnostico: 'Cumple con los objetivos',
  },
];

export const asistenciasFamilia = [
  { id: 1, hijoId: 1, fecha: '2026-05-21', estado: 'Presente' },
  { id: 2, hijoId: 1, fecha: '2026-05-20', estado: 'Presente' },
  { id: 3, hijoId: 1, fecha: '2026-05-19', estado: 'Tarde' },
  { id: 4, hijoId: 1, fecha: '2026-05-18', estado: 'Presente' },
  { id: 5, hijoId: 1, fecha: '2026-05-17', estado: 'Ausente' },
  { id: 6, hijoId: 2, fecha: '2026-05-21', estado: 'Presente' },
  { id: 7, hijoId: 2, fecha: '2026-05-20', estado: 'Presente' },
  { id: 8, hijoId: 2, fecha: '2026-05-19', estado: 'Presente' },
];

export const comunicadosFamilia = [
  {
    id: 1,
    curso: '1°1',
    fecha: '2026-05-10',
    titulo: 'Reunión de padres',
    descripcion: 'Convocatoria para el viernes 16/05 a las 18:00 en el SUM.',
  },
  {
    id: 2,
    curso: '1°1',
    fecha: '2026-05-05',
    titulo: 'Entrega de informes',
    descripcion: 'Disponibles los informes parciales en secretaría.',
  },
  {
    id: 3,
    curso: '1°2',
    fecha: '2026-05-08',
    titulo: 'Salida educativa',
    descripcion: 'Autorización requerida antes del 20/05.',
  },
];

export function getAlumnoById(alumnoId) {
  return alumnos.find((a) => a.id === alumnoId);
}

export function getHijoLabel(hijo) {
  const alumno = getAlumnoById(hijo.alumnoId);
  if (!alumno) return 'Alumno';
  return `${nombreCorto(alumno)} (${hijo.curso})`;
}
