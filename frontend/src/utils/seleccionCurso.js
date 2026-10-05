// Los selectores globales son de UN solo curso (Año lectivo → Año → División).
// Cuando se elige un Año pero todavía no una División, el curso es incompleto
// ("1°"): ese nombre no corresponde a ningún curso real (los reales son "1°1",
// "1°2", ...). Publicarlo tal cual haría que las vistas filtren por un string
// inexistente y queden vacías, así que se descarta: mientras no haya División
// el filtro global es "sin selección".

export function resolverCursosSeleccionados(nombres, cursosObj) {
  const lista = Array.isArray(nombres) ? nombres.filter(Boolean) : [];
  const cursos = Array.isArray(cursosObj) ? cursosObj : [];

  const pares = lista
    .map((nombre) => ({
      nombre,
      id: cursos.find((c) => c.nombre_curso === nombre)?.id_curso,
    }))
    .filter((p) => p.id !== undefined && p.id !== null);

  return {
    nombres: pares.map((p) => p.nombre),
    ids: pares.map((p) => String(p.id)),
  };
}

// La guarda de publicación compara nombres e IDs: comparar sólo los IDs dejaba
// el contexto sin actualizar cuando cambiaba el nombre y los IDs seguían vacíos
// (por ejemplo al pasar de "sin selección" a un Año sin División).
export function firmaSeleccion(nombres, ids) {
  return `${(nombres || []).join(',')}|${(ids || []).join(',')}`;
}