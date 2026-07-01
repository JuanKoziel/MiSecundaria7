// Generación de boletín escolar en PDF (vía ventana de impresión del navegador).
import { cursoConOrientacion } from './orientacion';
import { formatDNI } from './dni';

function promedioMateria(m) {
  const notas = [m.nota1, m.nota2].filter((n) => n !== null && n !== undefined && n !== '');
  if (notas.length === 0) return null;
  const suma = notas.reduce((acc, n) => acc + Number(n), 0);
  return (suma / notas.length).toFixed(2);
}

function filasMaterias(materias, inasistenciasPorMateria) {
  return materias
    .map((m) => {
      const ina = inasistenciasPorMateria[m.materia] || { ausencias: 0, tardanzas: 0 };
      const prom = promedioMateria(m);
      return `
        <tr>
          <td class="mat">${m.materia}</td>
          <td>${m.prenota1 || '—'}</td>
          <td>${m.nota1 ?? '—'}</td>
          <td>${m.prenota2 || '—'}</td>
          <td>${m.nota2 ?? '—'}</td>
          <td class="prom">${prom ?? '—'}</td>
          <td>${ina.ausencias}</td>
          <td>${ina.tardanzas}</td>
        </tr>`;
    })
    .join('');
}

function promedioGeneral(materias) {
  const proms = materias.map(promedioMateria).filter((p) => p !== null).map(Number);
  if (proms.length === 0) return '—';
  return (proms.reduce((a, b) => a + b, 0) / proms.length).toFixed(2);
}

export function boletinHTML({ alumnoNombre, dni, cursoNombre, anioLectivo, materias, inasistenciasPorMateria }) {
  const fechaEmision = new Date().toLocaleDateString('es-AR');
  const cursoLabel = cursoConOrientacion(cursoNombre);
  return `
    <div class="boletin">
      <div class="boletin-header">
        <div class="escuela">Escuela Secundaria N° 7</div>
        <div class="titulo">Boletín de Calificaciones</div>
        <div class="datos">
          <div><span>Alumno/a:</span> ${alumnoNombre}</div>
          ${dni ? `<div><span>DNI:</span> ${formatDNI(dni)}</div>` : ''}
          <div><span>Curso:</span> ${cursoLabel}</div>
          <div><span>Ciclo lectivo:</span> ${anioLectivo}</div>
          <div><span>Fecha de emisión:</span> ${fechaEmision}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th rowspan="2">Materia</th>
            <th colspan="2">1° Cuatrimestre</th>
            <th colspan="2">2° Cuatrimestre</th>
            <th rowspan="2">Promedio</th>
            <th rowspan="2">Inasist.</th>
            <th rowspan="2">Tardanzas</th>
          </tr>
          <tr>
            <th>Prenota</th>
            <th>Nota</th>
            <th>Prenota</th>
            <th>Nota</th>
          </tr>
        </thead>
        <tbody>
          ${materias.length ? filasMaterias(materias, inasistenciasPorMateria) : '<tr><td colspan="8">Sin calificaciones cargadas.</td></tr>'}
        </tbody>
      </table>
      <div class="boletin-footer">
        <div><strong>Promedio general:</strong> ${promedioGeneral(materias)}</div>
        <div class="firma">Firma y sello</div>
      </div>
    </div>`;
}

const BOLETIN_CSS = `
  body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
  .boletin { border: 2px solid #1f2937; border-radius: 8px; padding: 18px; max-width: 900px; margin: 0 auto 24px; }
  .boletin-header { border-bottom: 2px solid #1f2937; padding-bottom: 12px; margin-bottom: 14px; }
  .boletin-header .escuela { font-size: 13px; letter-spacing: 1px; text-transform: uppercase; color: #6b7280; }
  .boletin-header .titulo { font-size: 22px; font-weight: bold; margin: 4px 0 10px; }
  .boletin-header .datos { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; font-size: 14px; }
  .boletin-header .datos span { color: #6b7280; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #9ca3af; padding: 6px 8px; text-align: center; font-size: 13px; }
  th { background: #f3f4f6; }
  td.mat { text-align: left; font-weight: 600; }
  td.prom { font-weight: 700; }
  .boletin-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 18px; font-size: 14px; }
  .boletin-footer .firma { border-top: 1px solid #1f2937; padding-top: 4px; width: 200px; text-align: center; color: #6b7280; }
  @media print { button { display: none; } }
`;

export function exportarBoletinPDF(boletines, titulo) {
  const win = window.open('', '_blank');
  if (!win) return;
  const cuerpo = Array.isArray(boletines) ? boletines.join('') : boletines;
  win.document.write(`
    <html><head><title>${titulo}</title><style>${BOLETIN_CSS}</style></head>
    <body>${cuerpo}<script>window.onload = function(){ window.print(); };<\/script></body></html>
  `);
  win.document.close();
}
