import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BoletinTablaPrincipal from './BoletinTablaPrincipal';
import BoletinExtras from './BoletinExtras';

const materias = [
  { id: 1, materia: 'Matemática', prenota1: '', nota1: '7', prenota2: '', nota2: '8', diagnostico: 'Buen desempeño' },
  { id: 2, materia: 'Prácticas del Lenguaje', prenota1: '', nota1: '', prenota2: '', nota2: '', diagnostico: '' },
];

function celdasFila(tr) {
  return [...tr.children].reduce((acc, c) => acc + Number(c.getAttribute('colspan') || 1), 0);
}

function analizar(tabla) {
  const colgroup = tabla.querySelector('colgroup');
  const total = colgroup ? colgroup.querySelectorAll('col').length : 0;
  const widths = colgroup ? [...colgroup.querySelectorAll('col')].map((c) => parseFloat(c.style.width) || 0) : [];
  return { total, sumaWidths: widths.reduce((a, b) => a + b, 0), tabla };
}

describe('BoletinTablaPrincipal — maquetación', () => {
  it('declara 10 columnas y cada fila las cubre sin exceder el 100%', () => {
    render(<BoletinTablaPrincipal materias={materias} intensificaciones_1c={{ Matemática: 7 }} bloqueos_por_materia={{}} />);
    const tabla = screen.getByRole('table');
    const { total, sumaWidths } = analizar(tabla);
    expect(total).toBe(10);
    expect(sumaWidths).toBeLessThanOrEqual(100.5);
    tabla.querySelectorAll('tbody tr').forEach((tr) => expect(celdasFila(tr)).toBe(total));
    const filas = tabla.querySelectorAll('thead tr');
    expect(celdasFila(filas[0])).toBe(total);
  });

  it('mantiene palabras completas en los encabezados', () => {
    render(<BoletinTablaPrincipal materias={materias} />);
    const encabezados = [...screen.getByRole('table').querySelectorAll('thead th')].map((th) => th.textContent.trim());
    for (const palabra of ['Calificación', 'Preliminar', 'Intensificación 1.º C', 'Observaciones']) {
      expect(encabezados.some((h) => h.includes(palabra))).toBe(true);
    }
  });

  it('coloca la observación en una celda alineada a la izquierda', () => {
    render(<BoletinTablaPrincipal materias={materias} />);
    const obs = screen.getByRole('table').querySelector('td.cell-obs');
    expect(obs).toBeTruthy();
    expect(obs.textContent).toContain('Buen desempeño');
  });
});

describe('BoletinExtras — maquetación', () => {
  it('las tres tablas extra se renderizan con columnas consistentes', () => {
    render(
      <BoletinExtras
        previas={[]}
        recursadas={[]}
        intensificaciones_posteriores={[]}
        loading={false}
      />,
    );
    const tablas = screen.getAllByRole('table');
    const esperados = [9, 11, 3];
    expect(tablas).toHaveLength(3);
    tablas.forEach((tabla, i) => {
      const { total, sumaWidths } = analizar(tabla);
      expect(total).toBe(esperados[i]);
      expect(sumaWidths).toBeLessThanOrEqual(100.5);
      tabla.querySelectorAll('tbody tr').forEach((tr) => expect(celdasFila(tr)).toBe(total));
    });
  });
});
