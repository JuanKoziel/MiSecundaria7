import { describe, it, expect } from 'vitest';
import {
  PERIODOS_RENDICION,
  PERIODO_ORDEN,
  PERIODO_LABELS,
  notaAprobo,
  registroAprobo,
  periodosRendidos,
  proximoPeriodoEditable,
  notaGuardada,
  periodoAprobado,
  NOTA_APROBACION,
} from './previasRendicion';

const materias = {
  sinRendir: { estado: 'ADEUDADA', rendiciones: [] },
  aprobada: { estado: 'APROBADA', rendiciones: [{ periodo: 'JULIO', anio: 2026, nota: 8, resultado: 'APROBADA' }] },
  marzoSolo: { estado: 'ADEUDADA', rendiciones: [{ periodo: 'MARZO', anio: 2026, nota: 4, resultado: 'DESAPROBADA' }] },
  marzoJulio: { estado: 'ADEUDADA', rendiciones: [{ periodo: 'MARZO', anio: 2026, nota: 4, resultado: 'DESAPROBADA' }, { periodo: 'JULIO', anio: 2026, nota: 5, resultado: 'DESAPROBADA' }] },
  todos: { estado: 'ADEUDADA', rendiciones: PERIODOS_RENDICION.map((p, i) => ({ periodo: p, anio: 2026, nota: i + 1, resultado: 'DESAPROBADA' })) },
};

describe('previasRendicion — constantes', () => {
  it('define el orden canónico de períodos de rendición', () => {
    expect(PERIODOS_RENDICION).toEqual(['MARZO', 'JULIO', 'AGOSTO', 'DICIEMBRE_1', 'DICIEMBRE_2', 'FEBRERO']);
    expect(PERIODO_ORDEN.MARZO).toBe(1);
    expect(PERIODO_ORDEN.AGOSTO).toBe(3);
    expect(PERIODO_ORDEN.FEBRERO).toBe(6);
  });

  it('expone una etiqueta legible por período', () => {
    expect(PERIODO_LABELS.MARZO).toBe('Marzo');
    expect(PERIODO_LABELS.DICIEMBRE_1).toBe('Diciembre 1');
  });
});

describe('previasRendicion — aprobación', () => {
  it('aprueba con nota >= umbral', () => {
    expect(NOTA_APROBACION).toBe(7);
    expect(notaAprobo(7)).toBe(true);
    expect(notaAprobo(8)).toBe(true);
    expect(notaAprobo(6)).toBe(false);
    expect(notaAprobo(4)).toBe(false);
  });

  it('reconoce un registro aprobado', () => {
    expect(registroAprobo({ resultado: 'APROBADA' })).toBe(true);
    expect(registroAprobo({ resultado: 'DESAPROBADA' })).toBe(false);
  });
});

describe('previasRendicion — orden de períodos rendidos', () => {
  it('devuelve los períodos rendidos en orden canónico', () => {
    expect(periodosRendidos([{ periodo: 'JULIO' }, { periodo: 'MARZO' }])).toEqual(['MARZO', 'JULIO']);
  });
});

describe('previasRendicion — próximo período editable (secuencia)', () => {
  it('sin rendiciones, habilita MARZO', () => {
    expect(proximoPeriodoEditable(materias.sinRendir)).toBe('MARZO');
  });

  it('con MARZO rendido habilita JULIO', () => {
    expect(proximoPeriodoEditable(materias.marzoSolo)).toBe('JULIO');
  });

  it('con MARZO + JULIO habilita AGOSTO', () => {
    expect(proximoPeriodoEditable(materias.marzoJulio)).toBe('AGOSTO');
  });

  it('bloquea por completo una previa ya aprobada', () => {
    expect(proximoPeriodoEditable(materias.aprobada)).toBeNull();
  });

  it('devuelve null cuando ya se rindieron todos los períodos', () => {
    expect(proximoPeriodoEditable(materias.todos)).toBeNull();
  });

  it('devuelve null si no hay materia', () => {
    expect(proximoPeriodoEditable(null)).toBeNull();
  });
});

describe('previasRendicion — persistencia pre-cargada de nota', () => {
  it('recupera la nota guardada de un período + año concreto', () => {
    const rendiciones = [{ periodo: 'MARZO', anio: 2026, nota: 4 }];
    expect(notaGuardada(rendiciones, 'MARZO', 2026)).toBe(4);
    expect(notaGuardada(rendiciones, 'MARZO', 2027)).toBeNull();
    expect(notaGuardada(rendiciones, 'JULIO', 2026)).toBeNull();
  });

  it('identifica el período en que se aprobó la previa', () => {
    const r = periodoAprobado(materias.aprobada.rendiciones);
    expect(r.periodo).toBe('JULIO');
    expect(periodoAprobado(materias.marzoSolo.rendiciones)).toBeNull();
  });
});
