export function fechaHoy() {
  return new Date().toISOString().slice(0, 10);
}

export function clampNota(value) {
  if (value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return String(Math.min(10, Math.max(1, num)));
}

export function alumnosPorAnioYCurso(anioLectivo, curso, inscripciones, alumnos) {
  if (!anioLectivo || !curso) return [];
  const anio = Number(anioLectivo);
  const idsInscripcion = inscripciones
    .filter((i) => i.anioLectivo === anio && i.curso === curso)
    .map((i) => i.alumnoId);
  return alumnos.filter(
    (a) => idsInscripcion.includes(a.id) || (a.curso === curso && a.ciclo_anio === anio),
  );
}

export function cursosPorAnio(anioLectivo, inscripciones, cursos, cursosObj) {
  if (!anioLectivo) return [];
  const delAnio = [...new Set(
    inscripciones
      .filter((i) => i.anioLectivo === Number(anioLectivo))
      .map((i) => i.curso),
  )];
  const delAnioCursos = (cursosObj || []).filter(
    (c) => c.ciclo_anio === Number(anioLectivo),
  ).map((c) => c.nombre_curso);
  const todos = [...new Set([...delAnio, ...delAnioCursos])];
  return cursos.filter((c) => todos.includes(c));
}

export function docentesPorFiltros(anioLectivo, curso, materia, docentes, asignacionesDocente) {
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

export function docentesDelCurso(anioLectivo, curso, docentes, asignacionesDocente) {
  return docentesPorFiltros(anioLectivo, curso, '', docentes, asignacionesDocente);
}

export function nombreDocente(docente) {
  return `${docente.apellido}, ${docente.nombre}`;
}

export function filtrosCompletos(anioLectivo, curso) {
  return Boolean(anioLectivo && curso);
}

export function boletinPorAlumno(alumnoId, curso, hijosFamilia, calificacionesFamilia) {
  const hijo = hijosFamilia.find(
    (h) => h.alumnoId === alumnoId && (!curso || h.curso === curso),
  );
  if (!hijo) return [];
  return calificacionesFamilia.filter((c) => c.hijoId === hijo.id);
}
