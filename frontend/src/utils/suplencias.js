function aFechaYmd(valor) {
  if (!valor) return null;
  if (valor instanceof Date) {
    const y = valor.getFullYear();
    const m = String(valor.getMonth() + 1).padStart(2, '0');
    const d = String(valor.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(valor).slice(0, 10) || null;
}

export function hoyYmd(fecha = new Date()) {
  return aFechaYmd(fecha);
}

export function suplenciasActivasLista(suplencias, fecha = new Date()) {
  const ref = aFechaYmd(fecha);
  return (suplencias ?? []).filter((s) => {
    if (!s || s.estado === false || !s.id_curso_materia || !ref) return false;
    if (s.fecha_inicio && s.fecha_inicio > ref) return false;
    if (s.fecha_fin && s.fecha_fin < ref) return false;
    return true;
  });
}

export function suplenciasActivasEnFecha(suplencias, fecha = new Date()) {
  const mapa = {};
  suplenciasActivasLista(suplencias, fecha).forEach((s) => {
    const actual = mapa[s.id_curso_materia];
    if (!actual || (s.nivel ?? 1) > (actual.nivel ?? 1)) {
      mapa[s.id_curso_materia] = s;
    }
  });
  return mapa;
}

export function esDocenteActivoEnMateria(mapa, cmId, docenteId) {
  if (!mapa || !cmId || !docenteId) return null;
  const s = mapa[cmId];
  if (s && s.id_docente_suplente && s.id_docente_suplente === docenteId) {
    return s;
  }
  return null;
}
