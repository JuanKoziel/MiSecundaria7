export const PERIODOS_RENDICION = ['MARZO', 'JULIO', 'AGOSTO', 'DICIEMBRE_1', 'DICIEMBRE_2', 'FEBRERO'];

export const PERIODO_ORDEN = PERIODOS_RENDICION.reduce(
  (acc, p, i) => ({ ...acc, [p]: i + 1 }),
  {},
);

export const PERIODO_LABELS = {
  MARZO: 'Marzo',
  JULIO: 'Julio',
  AGOSTO: 'Agosto',
  DICIEMBRE_1: 'Diciembre 1',
  DICIEMBRE_2: 'Diciembre 2',
  FEBRERO: 'Febrero',
};

export const NOTA_APROBACION = 7;

export function notaAprobo(nota) {
  const n = Number(nota);
  return !Number.isNaN(n) && n >= NOTA_APROBACION;
}

export function registroAprobo(registro) {
  return Boolean(registro) && registro.resultado === 'APROBADA';
}

/** Períodos ya rendidos para una materia (ordenados según el orden canónico). */
export function periodosRendidos(rendiciones = []) {
  const set = new Set((rendiciones || []).map((r) => r.periodo));
  return PERIODOS_RENDICION.filter((p) => set.has(p));
}

/**
 * Próximo período habilitado para rendir.
 * - Devuelve `null` si la materia ya está aprobada o ya se rindieron todos.
 * - Devuelve `null` si la secuencia está rota (falta un período anterior), es
 *   decir, no se puede saltar períodos.
 * - Devuelve el primer período sin rendir en orden canónico si todos los
 *   anteriores ya están rendidos.
 */
export function proximoPeriodoEditable(materia) {
  if (!materia) return null;
  if (materia.estado === 'APROBADA') return null;
  const rendidos = new Set((materia.rendiciones || []).map((r) => r.periodo));
  for (const per of PERIODOS_RENDICION) {
    if (rendidos.has(per)) continue;
    // el primer faltante es el candidato; si todos sus anteriores ya fueron
    // rendidos, es editable; de lo contrario la secuencia está rota.
    const anterioresCompletos = PERIODOS_RENDICION.every((pp) =>
      PERIODO_ORDEN[pp] < PERIODO_ORDEN[per] ? rendidos.has(pp) : true,
    );
    return anterioresCompletos ? per : null;
  }
  return null; // todos rendidos
}

/** Nota guardada para un período + año concreto (para no perder la nota pre-cargada). */
export function notaGuardada(rendiciones = [], periodo, anio) {
  const r = (rendiciones || []).find(
    (x) => x.periodo === periodo && Number(x.anio) === Number(anio),
  );
  return r ? Number(r.nota) : null;
}

export function periodoAprobado(rendiciones = []) {
  const r = (rendiciones || []).find((x) => x.resultado === 'APROBADA');
  return r || null;
}
