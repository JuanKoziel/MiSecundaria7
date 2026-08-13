// Generación de boletín escolar en PDF (vía ventana de impresión del navegador).
import { cursoConOrientacion } from './orientacion';
import { formatDNI } from './dni';

const PERIODO_LABELS = {
  MARZO: 'Marzo',
  JULIO: 'Julio',
  AGOSTO: 'Agosto',
  DICIEMBRE_1: 'Diciembre 1',
  DICIEMBRE_2: 'Diciembre 2',
  FEBRERO: 'Febrero',
};

const labelPeriodo = (p) => PERIODO_LABELS[p] || p || '—';

function promedioMateria(m) {
  const notas = [m.nota1, m.nota2].filter((n) => n !== null && n !== undefined && n !== '');
  if (notas.length === 0) return null;
  const suma = notas.reduce((acc, n) => acc + Number(n), 0);
  return (suma / notas.length).toFixed(2);
}

function filasMaterias(materias, intensificaciones_1c = {}, bloqueos_por_materia = {}) {
  return materias
    .map((m) => {
      const prom = promedioMateria(m);
      const bloqueada = bloqueos_por_materia[m.materia];
      const claseFila = bloqueada ? ' class="mat-bloqueada"' : '';
      const badgeBloq = bloqueada ? ' <span class="badge badge-danger">Bloqueada</span>' : '';
      const intensif = intensificaciones_1c[m.materia];
      const tieneIntensif = intensif !== undefined && intensif !== null;
      return `
        <tr${claseFila}>
          <td class="mat">${m.materia}${badgeBloq}</td>
          <td>${m.prenota1 || '—'}</td>
          <td>${m.nota1 ?? '—'}</td>
          <td>${m.prenota2 || '—'}</td>
          <td>${m.nota2 ?? '—'}</td>
          <td>${tieneIntensif ? intensif : ''}</td>
          <td></td>
          <td></td>
          <td class="prom">${prom ?? '—'}</td>
          <td>${m.diagnostico || '—'}</td>
        </tr>`;
    })
    .join('');
}

function promedioGeneral(materias) {
  const proms = materias.map(promedioMateria).filter((p) => p !== null).map(Number);
  if (proms.length === 0) return '—';
  return (proms.reduce((a, b) => a + b, 0) / proms.length).toFixed(2);
}

function seccionRecursadas(items) {
  const rows =
    items && items.length
      ? items
          .map(
            (r) => `
        <tr>
          <td>${r.anio || '—'}</td>
          <td>${r.materia || '—'}</td>
          <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
          <td>${r.estado || 'A recursar'}</td>
        </tr>`,
          )
          .join('')
      : '<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
  return `<div class="boletin-seccion"><h3>MATERIAS A RECURSAR</h3><table class="boletin-tabla-extra"><thead>
    <tr>
      <th rowspan="2">Año/Curso</th>
      <th rowspan="2">Materia</th>
      <th colspan="2">1.º Cuatrimestre</th>
      <th colspan="3">2.º Cuatrimestre</th>
      <th colspan="2">Intensificaciones</th>
      <th rowspan="2">Calificación final</th>
      <th rowspan="2">Observaciones</th>
    </tr>
    <tr>
      <th>1.ª Valoración Preliminar</th>
      <th>Calificación</th>
      <th>2.ª Valoración Preliminar</th>
      <th>Calificación</th>
      <th>Intensificación 1.º C</th>
      <th>Diciembre</th>
      <th>Febrero</th>
    </tr>
  </thead><tbody>${rows}</tbody></table></div>`;
}

function seccionPrevias(items) {
  const periodos = [
    { key: 'MARZO', label: 'Marzo' },
    { key: 'JULIO', label: 'Julio' },
    { key: 'AGOSTO', label: 'Agosto' },
    { key: 'DICIEMBRE 1', label: 'Diciembre 1' },
    { key: 'DICIEMBRE 2', label: 'Diciembre 2' },
    { key: 'FEBRERO', label: 'Febrero' },
  ];
  const headCols = periodos.map((p) => `<th>${p.label}</th>`).join('');
  const rows =
    items && items.length
      ? items
          .map((p) => {
            const peri = String(p.periodo || '')
              .trim()
              .toUpperCase();
            const celdas = periodos
              .map((col) =>
                col.key === peri && p.calificacion !== null && p.calificacion !== undefined
                  ? p.calificacion
                  : '',
              )
              .join('</td><td>');
            const califFinal =
              p.calificacion !== null && p.calificacion !== undefined ? p.calificacion : '—';
            return `<tr><td>${p.materia || '—'}</td><td>${p.anio || '—'}</td><td>${celdas}</td><td>${califFinal}</td></tr>`;
          })
          .join('')
      : `<tr><td></td><td></td>${periodos.map(() => '<td></td>').join('')}<td></td></tr>`;
  return `<div class="boletin-seccion"><h3>MATERIAS PREVIAS / ADEUDADAS</h3><table class="boletin-tabla-extra"><thead><tr><th rowspan="2">Materia</th><th rowspan="2">Año (curso)</th><th colspan="6">Período de intensificación</th><th rowspan="2">Calificación final</th></tr><tr>${headCols}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function seccionOtrasIntensificaciones(items) {
  const rows =
    items && items.length
      ? items
          .map(
            (it) =>
              `<tr><td>${it.materia || '—'}</td><td>${
                it.diciembre !== null && it.diciembre !== undefined ? it.diciembre : ''
              }</td><td>${
                it.febrero !== null && it.febrero !== undefined ? it.febrero : ''
              }</td></tr>`,
          )
          .join('')
      : '<tr><td></td><td></td><td></td></tr>';
  return `<div class="boletin-seccion"><h3>INTENSIFICACIONES</h3><table class="boletin-tabla-extra"><thead><tr><th>Materia</th><th>Diciembre</th><th>Febrero</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function boletinHTML({
  alumnoNombre,
  dni,
  cursoNombre,
  anioLectivo,
  materias,
  inasistenciasPorMateria,
  intensificaciones_1c = {},
  bloqueos_por_materia = {},
  intensificaciones_posteriores = [],
  recursadas = [],
  previas = [],
}) {
  const fechaEmision = new Date().toLocaleDateString('es-AR');
  const cursoLabel = cursoConOrientacion(cursoNombre);
  return `
    <div class="boletin">
      <div class="boletin-pagina boletin-pagina-1">
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
              <th colspan="2">1.º Cuatrimestre</th>
              <th colspan="3">2.º Cuatrimestre</th>
              <th colspan="2">Intensificaciones</th>
              <th rowspan="2">Calificación final</th>
              <th rowspan="2">Observaciones</th>
            </tr>
            <tr>
              <th>1.ª Valoración Preliminar</th>
              <th>Calificación</th>
              <th>2.ª Valoración Preliminar</th>
              <th>Calificación</th>
              <th>Intensificación 1.º C</th>
              <th>Diciembre</th>
              <th>Febrero</th>
            </tr>
          </thead>
          <tbody>
            ${
              materias.length
                ? filasMaterias(materias, intensificaciones_1c, bloqueos_por_materia)
                : '<tr><td colspan="10">Sin calificaciones cargadas.</td></tr>'
            }
          </tbody>
        </table>
        <div class="boletin-nota">Prenota = 1.ª y 2.ª Valoración Preliminar</div>
        <div class="boletin-footer">
          <div class="firma">Firma y sello</div>
        </div>
      </div>
      <div class="boletin-pagina boletin-pagina-2">
        ${seccionPrevias(previas)}
        ${seccionRecursadas(recursadas)}
        ${seccionOtrasIntensificaciones(intensificaciones_posteriores)}
      </div>
    </div>`;
}

const BOLETIN_CSS = `
  body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
  .boletin { }
  .boletin-pagina { border: 2px solid #1f2937; border-radius: 8px; padding: 18px; max-width: 900px; margin: 0 auto 24px; }
  .boletin-pagina-2 { page-break-before: always; }
  .boletin-header { border-bottom: 2px solid #1f2937; padding-bottom: 12px; margin-bottom: 14px; }
  .boletin-header .escuela { font-size: 13px; letter-spacing: 1px; text-transform: uppercase; color: #6b7280; }
  .boletin-header .titulo { font-size: 22px; font-weight: bold; margin: 4px 0 10px; }
  .boletin-header .datos { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; font-size: 14px; }
  .boletin-header .datos span { color: #6b7280; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #9ca3af; padding: 6px 8px; text-align: center; font-size: 13px; }
  th { background: #17324d; color: #fff; font-weight: 600; }
  td.mat { text-align: left; font-weight: 600; }
  td.prom { font-weight: 700; }
  .mat-bloqueada { background-color: #fde2e2; }
  .mat-bloqueada td { color: #991b1b; }
  .boletin-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 48px; font-size: 14px; min-height: 80px; }
  .boletin-footer .firma { border-top: 1px solid #1f2937; padding-top: 44px; width: 220px; text-align: center; color: #6b7280; min-height: 28px; }
  .boletin-seccion { margin-top: 24px; page-break-inside: avoid; }
  .boletin-seccion h3 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: #17324d; color: #fff; padding: 7px 12px; margin: 0 0 0 0; page-break-after: avoid; }
  .boletin-lista { margin: 0; padding-left: 18px; font-size: 13px; }
  .boletin-lista li { margin-bottom: 6px; }
  .boletin-lista .badge { display: inline-block; padding: 1px 6px; border-radius: 4px; background: #fef3c7; color: #92400e; font-size: 12px; }
  .boletin-lista .sub { color: #6b7280; }
  .boletin-lista a { color: #1d4ed8; }
  .boletin-tabla-extra { margin-top: 0; page-break-inside: avoid; }
  .boletin-nota { font-size: 12px; font-style: italic; color: #6b7280; margin: 8px 2px 0; }
  .boletin-tabla-extra th, .boletin-tabla-extra td { text-align: center; }
  .boletin-tabla-extra th:first-child, .boletin-tabla-extra td:first-child,
  .boletin-tabla-extra th:nth-child(2), .boletin-tabla-extra td:nth-child(2) { text-align: left; }
  .sin-datos { color: #6b7280; font-size: 13px; font-style: italic; }
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
