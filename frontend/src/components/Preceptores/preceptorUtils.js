import {
  alumnos,
  docentes,
  inscripciones,
  asignacionesDocente,
  cursos,
  hijosFamilia,
  calificacionesFamilia,
} from '../../data/mockData';

export function fechaHoy() {
  return new Date().toISOString().slice(0, 10);
}

export function clampNota(value) {
  if (value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return String(Math.min(10, Math.max(1, num)));
}

export function alumnosPorAnioYCurso(anioLectivo, curso) {
  if (!anioLectivo || !curso) return [];
  const ids = inscripciones
    .filter((i) => i.anioLectivo === Number(anioLectivo) && i.curso === curso)
    .map((i) => i.alumnoId);
  return alumnos.filter((a) => ids.includes(a.id));
}

export function cursosPorAnio(anioLectivo) {
  if (!anioLectivo) return [];
  const delAnio = [...new Set(
    inscripciones
      .filter((i) => i.anioLectivo === Number(anioLectivo))
      .map((i) => i.curso),
  )];
  return cursos.filter((c) => delAnio.includes(c));
}

export function docentesPorFiltros(anioLectivo, curso, materia) {
  return docentes.filter((d) =>
    asignacionesDocente.some((a) => {
      if (a.docenteId !== d.id) return false;
      if (anioLectivo && a.anioLectivo !== Number(anioLectivo)) return false;
      if (curso && a.curso !== curso) return false;
      if (materia && a.materia !== materia) return false;
      return true;
    }),
  );
}

export function docentesDelCurso(anioLectivo, curso) {
  return docentesPorFiltros(anioLectivo, curso, '');
}

export function nombreDocente(docente) {
  return `${docente.apellido}, ${docente.nombre}`;
}

export function filtrosCompletos(anioLectivo, curso) {
  return Boolean(anioLectivo && curso);
}

export function boletinPorAlumno(alumnoId, curso) {
  const hijo = hijosFamilia.find(
    (h) => h.alumnoId === alumnoId && (!curso || h.curso === curso),
  );
  if (!hijo) return [];
  return calificacionesFamilia.filter((c) => c.hijoId === hijo.id);
}
