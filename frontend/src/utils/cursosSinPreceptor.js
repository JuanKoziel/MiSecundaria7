/**
 * Punto 5.14 - avisador de cursos sin preceptor asignado.
 *
 * Se comparte entre la vista de Administración y la de Jefe de Preceptores para
 * que el banner se calcule igual en los dos lugares. `cursosObj` es la lista
 * completa que publica DataContext (no viene filtrada por el selector global),
 * así que el conteo no depende de qué curso esté seleccionado arriba.
 *
 * La fuente de verdad es `id_preceptor` del propio curso: `CursoSerializer` usa
 * `fields = '__all__'`, así que el endpoint de cursos ya trae la FK y no hace
 * falta cruzarla contra la lista de preceptores. El cruce se usa solo como
 * respaldo si el payload no viniera con ese campo.
 */

/** Ids de curso que tienen al menos un preceptor con el curso en su lista. */
export function idsCursosAsignados(preceptores) {
  const ids = new Set();
  for (const preceptor of preceptores || []) {
    for (const curso of preceptor?.cursos || []) {
      if (curso && curso.id_curso !== null && curso.id_curso !== undefined) {
        ids.add(curso.id_curso);
      }
    }
  }
  return ids;
}

export function cursosSinPreceptor(cursosObj, preceptores) {
  const lista = (cursosObj || []).filter(Boolean);
  if (lista.length === 0) return [];
  const traeFk = lista.some((c) => 'id_preceptor' in c);
  if (traeFk) {
    return lista.filter((c) => c.id_preceptor === null || c.id_preceptor === undefined);
  }
  const asignados = idsCursosAsignados(preceptores);
  return lista.filter((c) => !asignados.has(c.id_curso));
}

export function etiquetaCursosSinPreceptor(cursos, maximo = 8) {
  const total = cursos.length;
  const plural = total === 1 ? 'curso' : 'cursos';
  if (total === 0) return '';
  const nombres = cursos.map((c) => c.nombre_curso).filter(Boolean);
  if (total <= maximo) {
    return `Hay ${total} ${plural} sin preceptor asignado: ${nombres.join(', ')}.`;
  }
  const resto = total - maximo;
  return `Hay ${total} ${plural} sin preceptor asignado: ${nombres.slice(0, maximo).join(', ')} y ${resto} más.`;
}
