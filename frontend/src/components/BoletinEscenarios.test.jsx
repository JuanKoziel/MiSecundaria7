import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BoletinTablaPrincipal from './BoletinTablaPrincipal';
import BoletinExtras from './BoletinExtras';
import { boletinHTML, BOLETIN_CSS } from '../utils/boletin';

// Fixtures con la MISMA forma que devuelve el endpoint real
// /api/boletin-academico/<id>/ (verificado en test_boletin_e2e.py).

const materias = [
  { id: 1, materia: 'Matemática', prenota1: '', nota1: '7', prenota2: '', nota2: '8', diagnostico: 'Buen desempeño' },
  { id: 2, materia: 'Lengua', prenota1: '', nota1: '4', prenota2: '', nota2: '4', diagnostico: '' },
];

function filaDe(tabla, nombreMateria) {
  const trs = [...tabla.querySelectorAll('tbody tr')];
  return trs.find((tr) => tr.cells[0].textContent.includes(nombreMateria));
}

describe('BoletinTablaPrincipal — escenarios', () => {
  it('E5: la nota de Intensificación 1.º C se renderiza en su subcolumna', () => {
    render(
      <BoletinTablaPrincipal
        materias={materias}
        intensificaciones_1c={{ Matemática: 8.0 }}
        bloqueos_por_materia={{}}
      />,
    );
    const tabla = screen.getByRole('table');
    const fila = filaDe(tabla, 'Matemática');
    // Columnas: Materia(0) | 1.ºC val/cal(1,2) | 2.ºC val/cal/int1C(3,4,5) | Dic/Feb(6,7) | Final(8) | Obs(9)
    expect(fila.cells[5].textContent).toBe('8');
  });

  it('E7: la materia bloqueada muestra el badge y no altera el resto', () => {
    render(
      <BoletinTablaPrincipal
        materias={materias}
        bloqueos_por_materia={{ Lengua: { bloqueada: true, motivo: 'Superposición con recursada de Matemática' } }}
      />,
    );
    const tabla = screen.getByRole('table');
    const filaBloqueada = filaDe(tabla, 'Lengua');
    expect(filaBloqueada.textContent).toContain('Bloqueada');
    const filaNormal = filaDe(tabla, 'Matemática');
    expect(filaNormal.textContent).not.toContain('Bloqueada');
  });
});

describe('BoletinExtras — escenarios', () => {
  it('E4: previa sin intensificar aparece sin período ni calificación', () => {
    render(
      <BoletinExtras
        previas={[{ materia: 'Matemática', anio: '1°1', periodo: '', calificacion: null }]}
        recursadas={[]}
        intensificaciones_posteriores={[]}
      />,
    );
    const tablas = screen.getAllByRole('table');
    const previasTabla = tablas[0];
    expect(previasTabla.textContent).toContain('Matemática');
    expect(previasTabla.textContent).toContain('1°1');
  });

  it('E9: la última instancia desaprobada se ubica en su columna de período', () => {
    render(
      <BoletinExtras
        previas={[{ materia: 'Matemática', anio: '1°1', periodo: 'MARZO', calificacion: 5 }]}
        recursadas={[]}
        intensificaciones_posteriores={[]}
      />,
    );
    const previasTabla = screen.getAllByRole('table')[0];
    const fila = [...previasTabla.querySelectorAll('tbody tr')].find((tr) => tr.cells[0].textContent.includes('Matemática'));
    // Materia(0) | Año(1) | Marzo(2) | Julio(3) | Agosto(4) | Dic1(5) | Dic2(6) | Febrero(7) | Final(8)
    const celdas = [...fila.cells].map((c) => c.textContent);
    expect(celdas[2]).toBe('5');
    expect(celdas[3]).toBe('');
    expect(celdas[8]).toBe('5');
  });

  it('E6: intensificación posterior solo en Febrero', () => {
    render(
      <BoletinExtras
        previas={[]}
        recursadas={[]}
        intensificaciones_posteriores={[{ materia: 'Física', anio: '1°1', diciembre: null, febrero: 7 }]}
      />,
    );
    const intensifTabla = screen.getAllByRole('table')[2];
    const fila = intensifTabla.querySelector('tbody tr');
    expect(fila.cells[0].textContent).toContain('Física');
    expect(fila.cells[1].textContent).toBe('');
    expect(fila.cells[2].textContent).toBe('7');
  });

  it('E10: la recursada aparece con su calificación en la columna que corresponde', () => {
    render(
      <BoletinExtras
        previas={[]}
        recursadas={[
          {
            materia: 'Física',
            anio: '2°',
            estado: 'A recursar',
            nota1: 7,
            nota2: 8,
            prenota1: null,
            prenota2: null,
            intensificacion_1c: null,
            diciembre: null,
            febrero: null,
            observaciones: '',
          },
        ]}
        intensificaciones_posteriores={[]}
      />,
    );
    const recursadasTabla = screen.getAllByRole('table')[1];
    expect(recursadasTabla.textContent).toContain('Física');
    const fila = recursadasTabla.querySelector('tbody tr');
    // Año(0) | Materia(1) | 1.ªVal(2) | Calificación(3) | 2.ªVal(4) | Calificación(5) |
    // Intensif1C(6) | Dic(7) | Feb(8) | Final(9) | Obs(10)
    expect(fila.cells[3].textContent).toBe('7');
    expect(fila.cells[5].textContent).toBe('8');
    expect(fila.cells[9].textContent).toBe('7.50');
    expect(fila.cells[10].textContent).toBe('A recursar');
  });

  it('E11: boletín vacío conserva las tres secciones y sus encabezados', () => {
    render(<BoletinExtras previas={[]} recursadas={[]} intensificaciones_posteriores={[]} />);
    const tablas = screen.getAllByRole('table');
    expect(tablas).toHaveLength(3);
    expect(screen.getByText('MATERIAS PREVIAS / ADEUDADAS')).toBeTruthy();
    expect(screen.getByText('MATERIAS A RECURSAR')).toBeTruthy();
    expect(screen.getByText('INTENSIFICACIONES')).toBeTruthy();
  });
});

describe('boletinHTML — hoja 1 y 2 (escenario 13: PDF A4)', () => {
  const html = boletinHTML({
    alumnoNombre: 'FICTICIO, Lucas',
    dni: '98800123',
    cursoNombre: '1°1',
    anioLectivo: 2026,
    materias,
    inasistenciasPorMateria: {},
    intensificaciones_1c: { Matemática: 8 },
    bloqueos_por_materia: { Lengua: { bloqueada: true, motivo: 'Superposición' } },
    intensificaciones_posteriores: [{ materia: 'Física', anio: '1°1', diciembre: null, febrero: 7 }],
    recursadas: [{ materia: 'Física', anio: '2°', estado: 'A recursar', nota1: 7, nota2: 8 }],
    previas: [{ materia: 'Matemática', anio: '1°1', periodo: 'MARZO', calificacion: 5 }],
  });
  const doc = new DOMParser().parseFromString(html, 'text/html');

  it('tiene dos páginas: boletín principal + previas/recursadas/intensif', () => {
    const paginas = doc.querySelectorAll('.boletin-pagina');
    expect(paginas).toHaveLength(2);
    expect(doc.querySelector('.boletin-pagina-1 table')).toBeTruthy();
    expect(doc.querySelector('.boletin-pagina-2 .boletin-seccion-previas')).toBeTruthy();
    expect(doc.querySelector('.boletin-pagina-2 .boletin-seccion-recursadas')).toBeTruthy();
    expect(doc.querySelector('.boletin-pagina-2 .boletin-seccion-intensif')).toBeTruthy();
  });

  it('el CSS exportado declara A4 portrait con márgenes de 7mm y página 2 separada', () => {
    expect(BOLETIN_CSS).toContain('size: A4 portrait');
    expect(BOLETIN_CSS).toContain('margin: 7mm 7mm 7mm 7mm');
    expect(BOLETIN_CSS).toContain('.boletin-pagina-2 { page-break-before: always; }');
  });

  it('las tablas usan table-layout fixed y no fuerzan ancho (sin desborde)', () => {
    expect(BOLETIN_CSS).toContain('table-layout: fixed');
    expect(BOLETIN_CSS).toContain('max-width: 100%');
    expect(BOLETIN_CSS).toContain('overflow-wrap: break-word');
  });

  it('la firma y sello va centrada con línea superior', () => {
    expect(BOLETIN_CSS).toContain('.boletin-footer .firma');
    expect(BOLETIN_CSS).toContain('display: inline-block');
    expect(BOLETIN_CSS).toContain('border-top: 1.5px solid #1f2937');
    const firma = doc.querySelector('.boletin-footer .firma');
    expect(firma).toBeTruthy();
    expect(firma.textContent.trim()).toBe('Firma y sello');
  });

  it('E7: la materia bloqueada lleva la marca en el PDF', () => {
    const fila = filaDe(doc.querySelector('.boletin-pagina-1 table'), 'Lengua');
    expect(fila.classList.contains('mat-bloqueada')).toBe(true);
    expect(fila.textContent).toContain('Bloqueada');
  });

  it('E5: intensificación 1.º C presente en la fila del PDF', () => {
    const fila = filaDe(doc.querySelector('.boletin-pagina-1 table'), 'Matemática');
    expect(fila.cells[5].textContent).toBe('8');
  });

  it('E9: la previa desaprobada muestra su calificación en el período correcto del PDF', () => {
    const fila = filaDe(doc.querySelector('.boletin-pagina-2 .boletin-seccion-previas table'), 'Matemática');
    expect(fila.cells[2].textContent).toBe('5');
    expect(fila.cells[8].textContent).toBe('5');
  });

  it('E10: la nota de la recursada aparece en el PDF en su columna', () => {
    const fila = doc.querySelector('.boletin-pagina-2 .boletin-seccion-recursadas tbody tr');
    // Año(0) | Materia(1) | 1.ªVal(2) | Calificación(3) | 2.ªVal(4) | Calificación(5) |
    // Intensif1C(6) | Dic(7) | Feb(8) | Final(9) | Obs(10)
    expect(fila.cells[3].textContent).toBe('7');
    expect(fila.cells[5].textContent).toBe('8');
    expect(fila.cells[9].textContent).toBe('7.50');
  });
});
