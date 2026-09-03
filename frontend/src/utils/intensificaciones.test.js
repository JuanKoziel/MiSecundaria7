import { describe, it, expect } from 'vitest';
import {
  NOTA_APROBACION,
  PERIODOS_INTENSIFICACION,
  TIPO_POR_BUCKET,
  clampNota,
  tiposIntensifHabilitados,
  cambiosIntensificaciones,
} from './intensificaciones';

// Construye una fila de intensificaciones similar a la que arma
// `cargarIntensificaciones` en PanelAlumnos.
function fila({ alumnoId = 1, nota1 = null, nota2 = null, instancias = [], registros = {}, idHistorial = null }) {
  const habilitados = tiposIntensifHabilitados(nota1, nota2, instancias);
  const registroIds = {};
  instancias.forEach((ins) => {
    registroIds[ins.periodo] = ins.id;
  });
  const registrosLlenos = {};
  PERIODOS_INTENSIFICACION.forEach(({ key }) => {
    registrosLlenos[key] = '';
  });
  return {
    alumnoId,
    nota1,
    nota2,
    instancias,
    idHistorial,
    habilitados,
    registroIds,
    registros: { ...registrosLlenos, ...registros },
  };
}

describe('intensificaciones - reglas de habilitación', () => {
  it('todo bloqueado por defecto (aprobó ambos cuatrimestres)', () => {
    const hab = tiposIntensifHabilitados(8, 8, []);
    expect(hab).toEqual({ '1C': false, DICIEMBRE: false, FEBRERO: false });
  });

  it('notas de cuatrimestre ausentes también dejan todo bloqueado', () => {
    const hab = tiposIntensifHabilitados(null, null, []);
    expect(hab).toEqual({ '1C': false, DICIEMBRE: false, FEBRERO: false });
  });

  it('desaprobó 1.º cuatrimestre -> habilita 1°C', () => {
    const hab = tiposIntensifHabilitados(4, 8, []);
    expect(hab['1C']).toBe(true);
    expect(hab.DICIEMBRE).toBe(false);
    expect(hab.FEBRERO).toBe(false);
  });

  it('desaprobó 2.º cuatrimestre -> habilita Diciembre', () => {
    const hab = tiposIntensifHabilitados(8, 4, []);
    expect(hab.DICIEMBRE).toBe(true);
    expect(hab['1C']).toBe(false);
    expect(hab.FEBRERO).toBe(false);
  });

  it('aprobó 1.º cuatrimestre pero desaprobó Intensificación 1°C -> habilita Diciembre', () => {
    const instancias = [{ id: 10, periodo: 'MARZO', nota: 5, estado: 'DESAPROBADA' }];
    const hab = tiposIntensifHabilitados(8, 8, instancias);
    expect(hab['1C']).toBe(false);
    expect(hab.DICIEMBRE).toBe(true);
    expect(hab.FEBRERO).toBe(false);
  });

  it('desaprobó Diciembre -> habilita Febrero', () => {
    const instancias = [{ id: 10, periodo: 'DICIEMBRE_1', nota: 5, estado: 'DESAPROBADA' }];
    const hab = tiposIntensifHabilitados(8, 8, instancias);
    expect(hab.DICIEMBRE).toBe(false);
    expect(hab.FEBRERO).toBe(true);
  });
});

describe('intensificaciones - clampNota', () => {
  it('convierte y acota entre 1 y 10', () => {
    expect(clampNota('6')).toBe(6);
    expect(clampNota('0')).toBe(1);
    expect(clampNota('99')).toBe(10);
    expect(clampNota('')).toBe('');
    expect(clampNota('abc')).toBe('');
  });
});

describe('intensificaciones - cambiosIntensificaciones', () => {
  const anio = 2026;
  const cmId = 55;

  it('registro con nota vacía: al escribir 6 se genera el cambio con nota: 6', () => {
    // Alumno desaprobó el 1.º cuatrimestre -> 1°C habilidado. Sin instancias previas.
    const f = fila({ nota1: 4, idHistorial: 99, registros: { intensificacion_1c: 6 } });
    const cambios = cambiosIntensificaciones([f], anio, cmId);
    expect(cambios).toHaveLength(1);
    expect(cambios[0].tipo).toBe('create');
    expect(cambios[0].payload).toEqual({
      id_alumno: 1,
      id_curso_materia: cmId,
      id_historial: 99,
      periodo: 'MARZO',
      anio_rendicion: anio,
      nota: 6,
    });
  });

  it('crea aunque no se conozca id_historial (año activo sin historial)', () => {
    const f = fila({ nota1: 4, idHistorial: null, registros: { intensificacion_1c: 6 } });
    const cambios = cambiosIntensificaciones([f], anio, cmId);
    expect(cambios).toHaveLength(1);
    expect(cambios[0].tipo).toBe('create');
    expect(cambios[0].payload).toEqual({
      id_alumno: 1,
      id_curso_materia: cmId,
      periodo: 'MARZO',
      anio_rendicion: anio,
      nota: 6,
    });
    expect(cambios[0].payload.id_historial).toBeUndefined();
  });

  it('no descarta una nota recién escrita sobre un campo originalmente vacío (value numérico)', () => {
    const f = fila({ nota1: 4, idHistorial: 99, registros: { intensificacion_1c: 6 } });
    const cambios = cambiosIntensificaciones([f], anio, cmId);
    expect(cambios.length).toBeGreaterThan(0);
    expect(cambios[0].payload.nota).toBe(6);
  });

  it('registro existente con nota vacía: al escribir 6 se genera PATCH de ese registro', () => {
    const instancias = [{ id: 7, periodo: 'MARZO', nota: null, estado: 'PENDIENTE' }];
    const f = fila({ nota1: 4, instancias, registros: { intensificacion_1c: 6 } });
    const cambios = cambiosIntensificaciones([f], anio, cmId);
    expect(cambios).toHaveLength(1);
    expect(cambios[0].tipo).toBe('update');
    expect(cambios[0].id).toBe(7);
    expect(cambios[0].payload).toEqual({ nota: 6 });
  });

  it('registro existente: modificar nota 5 -> 6 genera PATCH con nota 6', () => {
    const instancias = [{ id: 7, periodo: 'MARZO', nota: 5, estado: 'DESAPROBADA' }];
    const f = fila({ nota1: 4, instancias, registros: { intensificacion_1c: 6 } });
    const cambios = cambiosIntensificaciones([f], anio, cmId);
    expect(cambios).toHaveLength(1);
    expect(cambios[0].tipo).toBe('update');
    expect(cambios[0].payload).toEqual({ nota: 6 });
  });

  it('cambiar la nota 6 -> 7 vuelve a detectar la modificación', () => {
    const instancias = [{ id: 7, periodo: 'MARZO', nota: 6, estado: 'DESAPROBADA' }];
    const f = fila({ nota1: 4, instancias, registros: { intensificacion_1c: 7 } });
    const cambios = cambiosIntensificaciones([f], anio, cmId);
    expect(cambios).toHaveLength(1);
    expect(cambios[0].payload).toEqual({ nota: 7 });
  });

  it('no envía registros vacíos ni columnas bloqueadas', () => {
    const f = fila({ nota1: 8, nota2: 8, idHistorial: 99 }); // nada habilitado
    const cambios = cambiosIntensificaciones([f], anio, cmId);
    expect(cambios).toHaveLength(0);
  });

  it('varios alumnos: solo envía las columnas habilitadas con nota', () => {
    const a = fila({ alumnoId: 1, nota1: 4, idHistorial: 10, registros: { intensificacion_1c: 6 } });
    const b = fila({ alumnoId: 2, nota2: 4, idHistorial: 20, registros: { diciembre: 5 } });
    const c = fila({ alumnoId: 3, nota1: 8, nota2: 8, idHistorial: 30, registros: { intensificacion_1c: 6 } });
    const cambios = cambiosIntensificaciones([a, b, c], anio, cmId);
    expect(cambios).toHaveLength(2);
    const paylods = cambios.map((ch) => ch.payload.nota).sort();
    expect(paylods).toEqual([5, 6]);
  });

  it('usa el período existente para el bucket al actualizar (no siempre el primero)', () => {
    const instancias = [{ id: 11, periodo: 'DICIEMBRE_2', nota: null, estado: 'PENDIENTE' }];
    const f = fila({ nota2: 4, instancias, registros: { diciembre: 6 } });
    const cambios = cambiosIntensificaciones([f], anio, cmId);
    expect(cambios).toHaveLength(1);
    expect(cambios[0].tipo).toBe('update');
    expect(cambios[0].id).toBe(11);
  });
});
