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
