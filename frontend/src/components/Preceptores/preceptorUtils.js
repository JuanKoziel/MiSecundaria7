import { hoy as fechaHoy } from '../../utils/fechas';

export { fechaHoy };

export function clampNota(value) {
  if (value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return String(Math.min(10, Math.max(1, num)));
}

function normalizeCursoPermitido(c) {
  if (!c) return '';
  if (typeof c === 'string') return c;
  if (typeof c === 'object') return c.nombre_curso || '';
  return '';
}

// 5.6 — Normaliza la selección de cursos a un array de nombres. Acepta un
// string (comportamiento anterior, un curso solo) o el array del header global.
export function aListaCursos(curso) {
  if (Array.isArray(curso)) return curso.filter(Boolean);
  return curso ? [curso] : [];
}

export function estudiantesPorAnioYCurso(anioLectivo, curso, inscripciones, estudiantes, cursosPermitidos = []) {
  const seleccionados = aListaCursos(curso);
  if (!anioLectivo || seleccionados.length === 0) return [];
  const nombresPermitidos = cursosPermitidos.map(normalizeCursoPermitido).filter(Boolean);
  if (nombresPermitidos.length > 0 && !seleccionados.some((c) => nombresPermitidos.includes(c))) return [];
  const anio = Number(anioLectivo);
  const idsInscripcion = inscripciones
    .filter((i) => i.anioLectivo === anio && seleccionados.includes(i.curso))
    .map((i) => i.alumnoId);
  return estudiantes.filter(
    (a) => idsInscripcion.includes(a.id) || (seleccionados.includes(a.curso) && Number(a.ciclo_anio) === anio),
  );
}

export function cursosPorAnio(anioLectivo, inscripciones, cursos, cursosObj, cursosPermitidos = []) {
  if (!anioLectivo) return [];
  const anioNum = Number(anioLectivo);
  const delAnio = [...new Set(
    inscripciones
      .filter((i) => i.anioLectivo === anioNum)
      .map((i) => i.curso),
  )];
  const delAnioCursos = (cursosObj || []).filter(
    (c) => Number(c.ciclo_anio) === anioNum,
  ).map((c) => c.nombre_curso);
  const todos = [...new Set([...delAnio, ...delAnioCursos])];
  let resultado = cursos.filter((c) => todos.includes(c));
  const nombresPermitidos = cursosPermitidos.map(normalizeCursoPermitido).filter(Boolean);
  if (nombresPermitidos.length > 0) {
    resultado = resultado.filter((c) => nombresPermitidos.includes(c));
  }
  return resultado;
}

export function docentesPorFiltros(anioLectivo, curso, materia, docentes, asignacionesDocente) {
  // 5.6 — `curso` puede ser un array (multiselección del header): el docente
  // tiene que tener alguna asignación en CUALQUIER curso marcado.
  const seleccionados = aListaCursos(curso);
  return docentes.filter((d) =>
    asignacionesDocente.some((a) => {
      if (a.docenteId !== d.id) return false;
      if (anioLectivo && a.anioLectivo !== Number(anioLectivo)) return false;
      if (seleccionados.length > 0 && !seleccionados.includes(a.curso)) return false;
      if (materia && a.materia !== materia) return false;
      return true;
    }),
  );
}

export function docentesDelCurso(anioLectivo, curso, docentes, asignacionesDocente) {
  return docentesPorFiltros(anioLectivo, curso, '', docentes, asignacionesDocente);
}

export function nombreDocente(docente) {
  return `${docente.apellido}, ${docente.nombre}`;
}

// Los tutores se filtran por el curso del selector global del header: se
// muestra solo el tutor que tiene al menos un alumno en ese curso/año. `curso`
// acepta el string del preceptor o el array del multiselect (Admin/Jefe).
export function tutoresPorAnioYCurso(anioLectivo, curso, tutores, cursosPermitidos = []) {
  const seleccionados = aListaCursos(curso);
  if (!anioLectivo || seleccionados.length === 0) return [];
  const permitidos = (cursosPermitidos || []).map(normalizeCursoPermitido).filter(Boolean);
  if (permitidos.length > 0 && !seleccionados.some((c) => permitidos.includes(c))) return [];
  const anio = Number(anioLectivo);
  return (tutores || []).filter((t) =>
    (t.alumnos || t.estudiantes || []).some((al) => {
      const nombreCurso = al.curso_nombre || al.curso || '';
      if (!seleccionados.includes(nombreCurso)) return false;
      const anioAlumno = al.ciclo_anio ?? al.anio_lectivo ?? null;
      if (anioAlumno !== null && anioAlumno !== undefined && Number(anioAlumno) !== anio) return false;
      return true;
    }),
  );
}

export function filtrosCompletos(anioLectivo, curso) {
  // 5.6 — Con multiselección alcanza con que haya al menos un curso marcado, y
  // cada uno debe traer año y división (ej: "2°1"), no solo el año ("2°").
  const seleccionados = aListaCursos(curso);
  if (!anioLectivo || seleccionados.length === 0) return false;
  return seleccionados.some((c) => /\d+\s*[°º]\s*\d+/.test(String(c)));
}

export function ritePorEstudiante(alumnoId, curso, hijosFamilia, calificacionesFamilia) {
  const hijo = hijosFamilia.find(
    (h) => h.alumnoId === alumnoId && (!curso || h.curso === curso),
  );
  if (!hijo) return [];
  return calificacionesFamilia.filter((c) => c.hijoId === hijo.id);
}
