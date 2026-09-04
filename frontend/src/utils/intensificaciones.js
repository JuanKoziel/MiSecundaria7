import { NOTA_APROBACION } from './previasRendicion';

// Estructura ORIGINAL de Intensificaciones: 3 columnas fijas.
// Cada columna agrupa un subconjunto de los períodos canónicos de rendición
// (fuente central `PERIODOS_RENDICION` en previasRendicion).
export const PERIODOS_INTENSIFICACION = [
  { key: 'intensificacion_1c', label: 'Intensificación 1.º C', periodos: ['MARZO', 'JULIO', 'AGOSTO'] },
  { key: 'diciembre', label: 'Diciembre', periodos: ['DICIEMBRE_1', 'DICIEMBRE_2'] },
  { key: 'febrero', label: 'Febrero', periodos: ['FEBRERO'] },
];

export const BUCKET_POR_PERIODO = PERIODOS_INTENSIFICACION.reduce(
  (acc, { key, periodos }) => {
    periodos.forEach((p) => {
      acc[p] = key;
    });
    return acc;
  },
  {},
);

export const TIPO_POR_BUCKET = {
  intensificacion_1c: '1C',
  diciembre: 'DICIEMBRE',
  febrero: 'FEBRERO',
};

export function clampNota(value) {
  if (value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return Math.min(10, Math.max(1, num));
}

// Reglas académicas de habilitación (TODO bloqueado por defecto):
//  1°C  habilitado <=> desaprobó el Primer Cuatrimestre.
//  Dic  habilitado <=> desaprobó el Segundo Cuatrimestre O ALGUNA 1°C está DESAPROBADA.
//  Feb  habilitado <=> ALGUNA Intensificación de Diciembre está DESAPROBADA.
export function tiposIntensifHabilitados(nota1, nota2, instancias) {
  const estadoTipo = { '1C': [], DICIEMBRE: [], FEBRERO: [] };
  (instancias || []).forEach((ins) => {
    const tipo = TIPO_POR_BUCKET[BUCKET_POR_PERIODO[ins.periodo]];
    if (ins.estado && tipo) {
      estadoTipo[tipo].push(ins.estado);
    }
  });

  const hab1c = nota1 != null && nota1 < NOTA_APROBACION;
  const habDic =
    (nota2 != null && nota2 < NOTA_APROBACION) || estadoTipo['1C'].includes('DESAPROBADA');
  const habFeb = estadoTipo['DICIEMBRE'].includes('DESAPROBADA');

  return {
    '1C': hab1c,
    DICIEMBRE: habDic,
    FEBRERO: habFeb,
  };
}

// Construye la lista de operaciones a persistir a partir de las notas
// ingresadas. Devuelve un array de { tipo, id?, payload } donde:
//   - tipo 'update': PATCH /api/intensificaciones-academicas/{id}/ con {nota}
//   - tipo 'create': POST /api/intensificaciones-academicas/ con el payload completo
// Solo considera columnas habilitadas con una nota ingresada (no vacía),
// y NO descarta 0 ni valores recién escritos sobre campos originalmente vacíos.
export function cambiosIntensificaciones(intensificaciones, anio, cursoMateriaId) {
  const cambios = [];
  for (const fila of intensificaciones) {
    for (const { key, periodos } of PERIODOS_INTENSIFICACION) {
      const tipo = TIPO_POR_BUCKET[key];
      const habilitado = fila.habilitados[tipo];
      if (!habilitado) continue;
      const nota = fila.registros[key];
      if (nota === '' || nota === null || nota === undefined) continue;
      const periodo = periodos.find((per) => fila.registroIds[per] != null) || periodos[0];
      const registroId = fila.registroIds[periodo];
      const payloadNota = Number(nota);
      if (registroId) {
        cambios.push({ tipo: 'update', id: registroId, payload: { nota: payloadNota } });
      } else {
        // El backend resuelve/crea el historial a partir de id_alumno +
        // id_curso_materia si no viene id_historial (año activo sin historial).
        const payload = {
          id_alumno: fila.alumnoId,
          id_curso_materia: cursoMateriaId,
          periodo,
          anio_rendicion: anio,
          nota: payloadNota,
        };
        if (fila.idHistorial) payload.id_historial = fila.idHistorial;
        cambios.push({ tipo: 'create', payload });
      }
    }
  }
  return cambios;
}
