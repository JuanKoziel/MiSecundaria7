import { parseCurso } from '../../utils/orientacion';

function uniqueSorted(values, compare) {
  return [...new Set(values.filter((value) => value !== '' && value != null))].sort(compare);
}

export function getAniosLectivos(cursosObj) {
  return uniqueSorted(
    (cursosObj || []).map((c) => Number(c.ciclo_anio) || null),
    (a, b) => b - a,
  ).map(String);
}

export function getAniosCurso(cursosObj, anioLectivo = '') {
  const lectivo = anioLectivo ? Number(anioLectivo) : null;
  const values = (cursosObj || []).flatMap((c) => {
    if (lectivo && Number(c.ciclo_anio) !== lectivo) return [];
    const { anio } = parseCurso(c.nombre_curso);
    return anio ? [anio] : [];
  });
  return uniqueSorted(values, (a, b) => a - b).map(String);
}

export function getDivisiones(cursosObj, anioLectivo = '', anioCurso = '') {
  const lectivo = anioLectivo ? Number(anioLectivo) : null;
  const curso = anioCurso ? Number(anioCurso) : null;
  const values = (cursosObj || []).flatMap((c) => {
    if (lectivo && Number(c.ciclo_anio) !== lectivo) return [];
    const parts = parseCurso(c.nombre_curso);
    if (curso && parts.anio !== curso) return [];
    return parts.division ? [parts.division] : [];
  });
  return uniqueSorted(values, (a, b) => a - b).map(String);
}

export function findCursoObj(cursosObj, anioLectivo = '', anioCurso = '', division = '') {
  const lectivo = anioLectivo ? Number(anioLectivo) : null;
  const curso = anioCurso ? Number(anioCurso) : null;
  const div = division ? Number(division) : null;
  return (cursosObj || []).find((c) => {
    if (lectivo && Number(c.ciclo_anio) !== lectivo) return false;
    const parts = parseCurso(c.nombre_curso);
    if (curso && parts.anio !== curso) return false;
    if (div && parts.division !== div) return false;
    return true;
  }) || null;
}

export function getCursoParts(cursoObj) {
  const parts = parseCurso(cursoObj?.nombre_curso || '');
  return {
    anioLectivo: cursoObj?.ciclo_anio ? String(cursoObj.ciclo_anio) : '',
    anioCurso: parts.anio ? String(parts.anio) : '',
    division: parts.division ? String(parts.division) : '',
  };
}

export function formatCursoOption(cursoObj) {
  if (!cursoObj) return '';
  return `${cursoObj.nombre_curso}${cursoObj.ciclo_anio ? ` (${cursoObj.ciclo_anio})` : ''}`;
}
