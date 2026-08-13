import { describe, it, expect } from 'vitest';
import { boletinHTML } from './boletin';

const materias = [
  {
    id: 1,
    materia: 'Matemática',
    prenota1: '',
    nota1: '7',
    prenota2: '',
    nota2: '8',
    diagnostico: 'Muy buen desempeño durante todo el año',
  },
  {
    id: 2,
    materia: 'Prácticas del Lenguaje',
    prenota1: '',
    nota1: '',
    prenota2: '',
    nota2: '',
    diagnostico: '',
  },
];

const previas = [{ materia: 'Lengua', anio: '1°', periodo: 'JULIO', calificacion: '6' }];
const recursadas = [{ anio: '2°', materia: 'Física', estado: 'A recursar' }];
const intensificaciones_posteriores = [{ materia: 'Química', diciembre: 5, febrero: null }];

function generarDoc() {
  const html = boletinHTML({
    alumnoNombre: 'Pérez, Juan',
    dni: '12345678',
    cursoNombre: '4°1',
    anioLectivo: 2025,
    materias,
    inasistenciasPorMateria: {},
    intensificaciones_1c: { Matemática: 7 },
    bloqueos_por_materia: { Física: true },
    intensificaciones_posteriores,
    recursadas,
    previas,
  });
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.querySelectorAll('.boletin-pagina table');
}

// Cuenta las columnas reales que ocupa una fila (suma de colspans).
function celdasFila(tr) {
  return [...tr.children].reduce((acc, celda) => acc + Number(celda.getAttribute('colspan') || 1), 0);
}

// Columnas ocupadas por celdas con rowspan en la primera fila del encabezado.
function rowspanBase(thead) {
  const primera = thead.querySelector('tr');
  return [...primera.children].reduce(
    (acc, celda) => acc + (Number(celda.getAttribute('rowspan') || 1) > 1 ? 1 : 0),
    0,
  );
}

function analizarTabla(tabla) {
  const colgroup = [...tabla.querySelectorAll('colgroup col')];
  const widths = colgroup.map((c) => parseFloat(c.style.width) || 0);
  const thead = tabla.querySelector('thead');
  const tbody = tabla.querySelector('tbody');
  return {
    totalColumnas: colgroup.length,
    widths,
    sumaWidths: widths.reduce((a, b) => a + b, 0),
    thead,
    tbody,
  };
}

describe('boletinHTML — integridad de columnas', () => {
  const tablas = generarDoc();
  const [tablaPrincipal, previasTabla, recursadasTabla, intensifTabla] = tablas;

  it('genera la tabla principal y las tres tablas extra', () => {
    expect(tablas).toHaveLength(4);
    expect(tablaPrincipal).toBeTruthy();
    expect(previasTabla).toBeTruthy();
    expect(recursadasTabla).toBeTruthy();
    expect(intensifTabla).toBeTruthy();
  });

  it.each([
    ['tabla principal', 0, 10],
    ['previas', 1, 9],
    ['recursadas', 2, 11],
    ['intensificaciones', 3, 3],
  ])('%s declara %i columnas en el colgroup', (_nombre, idx, esperado) => {
    expect(analizarTabla(tablas[idx]).totalColumnas).toBe(esperado);
  });

  it.each([0, 1, 2, 3])('la tabla %i no excede el ancho disponible (colgroup ≤ 100%%)', (idx) => {
    const { sumaWidths } = analizarTabla(tablas[idx]);
    expect(sumaWidths).toBeGreaterThan(0);
    expect(sumaWidths).toBeLessThanOrEqual(100.5);
  });

  it.each([0, 1, 2, 3])('las filas de datos de la tabla %i cubren todas las columnas', (idx) => {
    const { totalColumnas, tbody } = analizarTabla(tablas[idx]);
    tbody.querySelectorAll('tr').forEach((tr) => {
      expect(celdasFila(tr)).toBe(totalColumnas);
    });
  });

  it.each([0, 1, 2])('los encabezados de la tabla %i son consistentes (colspan + rowspan)', (idx) => {
    const { totalColumnas, thead } = analizarTabla(tablas[idx]);
    const filas = thead.querySelectorAll('tr');
    const base = rowspanBase(thead);
    expect(celdasFila(filas[0])).toBe(totalColumnas);
    if (filas.length > 1) {
      expect(celdasFila(filas[1]) + base).toBe(totalColumnas);
    }
  });

  it('no divide palabras en los encabezados (texto completo)', () => {
    const encabezados = [...tablaPrincipal.querySelectorAll('thead th')].map(
      (th) => th.textContent.trim(),
    );
    for (const palabra of [
      'Calificación',
      'Preliminar',
      'Intensificación 1.º C',
      'Observaciones',
      'Intensificaciones',
      'Cuatrimestre',
    ]) {
      const presente = encabezados.some((h) => h.includes(palabra));
      expect(presente, `"${palabra}" debería aparecer completa en algún encabezado`).toBe(true);
    }
  });

  it('la celda de observaciones de la tabla principal usa la clase de texto', () => {
    const obs = tablaPrincipal.querySelectorAll('tbody tr td.cell-obs');
    expect(obs.length).toBeGreaterThan(0);
    expect(obs[0].textContent).toContain('Muy buen desempeño');
  });
});
