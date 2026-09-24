// Generación de RITE escolar en PDF (vía ventana de impresión del navegador).
import { cursoConOrientacion } from './orientacion';
import { formatDNI } from './dni';
import { NOTA_APROBACION } from './previasRendicion';

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

function filasMaterias(materias, intensificaciones_1c = {}, bloqueos_por_materia = {}, intensificaciones_posteriores = []) {
  const posterioresPorMateria = {};
  (intensificaciones_posteriores || []).forEach((it) => {
    if (it.materia) posterioresPorMateria[it.materia] = it;
  });
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
          <td>${posterioresPorMateria[m.materia]?.diciembre ?? ''}</td>
          <td>${posterioresPorMateria[m.materia]?.febrero ?? ''}</td>
          <td class="prom">${prom ?? '—'}</td>
          <td class="cell-obs">${m.diagnostico || '—'}</td>
        </tr>`;
    })
    .join('');
}

function promedioGeneral(materias) {
  const proms = materias.map(promedioMateria).filter((p) => p !== null).map(Number);
  if (proms.length === 0) return '—';
  return (proms.reduce((a, b) => a + b, 0) / proms.length).toFixed(2);
}

function filaRecursada(r) {
  const prom = promedioMateria(r);
  return `
        <tr>
          <td>${r.anio || '—'}</td>
          <td class="mat">${r.materia || '—'}</td>
          <td>${r.prenota1 || '—'}</td>
          <td>${r.nota1 ?? '—'}</td>
          <td>${r.prenota2 || '—'}</td>
          <td>${r.nota2 ?? '—'}</td>
          <td>${r.intensificacion_1c ?? ''}</td>
          <td>${r.diciembre ?? ''}</td>
          <td>${r.febrero ?? ''}</td>
          <td class="prom">${prom ?? '—'}</td>
          <td class="cell-obs">${r.observaciones || r.estado || 'A recursar'}</td>
        </tr>`;
}

function seccionRecursadas(items) {
  const rows =
    items && items.length
      ? items.map(filaRecursada).join('')
      : '<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
  return `<div class="rite-seccion rite-seccion-recursadas"><h3>MATERIAS A RECURSAR</h3><table class="rite-tabla-extra"><colgroup>
      <col style="width:8.5%" />
      <col style="width:8%" />
      <col style="width:8.5%" />
      <col style="width:9%" />
      <col style="width:8.5%" />
      <col style="width:9%" />
      <col style="width:11%" />
      <col style="width:8%" />
      <col style="width:6.5%" />
      <col style="width:9%" />
      <col style="width:14%" />
    </colgroup><thead>
    <tr>
      <th rowspan="2">Año/Curso</th>
      <th rowspan="2">Materia</th>
      <th colspan="2">1.º Cuatrimestre</th>
      <th colspan="2">2.º Cuatrimestre</th>
      <th colspan="3">Intensificaciones</th>
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
            const celdas = periodos
              .map((col) => {
                const nota =
                  p.rendiciones && p.rendiciones[col.key] !== null && p.rendiciones[col.key] !== undefined
                    ? p.rendiciones[col.key]
                    : '';
                const clase =
                  nota !== '' && Number(nota) >= NOTA_APROBACION ? ' class="celda-aprobada"' : '';
                return `<td${clase}>${nota}</td>`;
              })
              .join('');
            const califFinal =
              p.calificacion_final !== null && p.calificacion_final !== undefined ? p.calificacion_final : '—';
            return `<tr><td>${p.materia || '—'}</td><td>${p.anio || '—'}</td>${celdas}<td>${califFinal}</td></tr>`;
          })
          .join('')
      : `<tr><td></td><td></td>${periodos.map(() => '<td></td>').join('')}<td></td></tr>`;
  return `<div class="rite-seccion rite-seccion-previas"><h3>MATERIAS PREVIAS / ADEUDADAS</h3><table class="rite-tabla-extra"><colgroup>
      <col style="width:16%" />
      <col style="width:10%" />
      <col style="width:8%" />
      <col style="width:8%" />
      <col style="width:8%" />
      <col style="width:8%" />
      <col style="width:8%" />
      <col style="width:8%" />
      <col style="width:26%" />
    </colgroup><thead><tr><th rowspan="2">Materia</th><th rowspan="2">Año (curso)</th><th colspan="6">Período de intensificación</th><th rowspan="2">Calificación final</th></tr><tr>${headCols}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function riteHTML({
  estudianteNombre,
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
    <div class="rite">
      <div class="rite-pagina rite-pagina-1">
        <div class="rite-header">
          <div class="escuela">Escuela Secundaria N° 7</div>
          <div class="titulo">RITE de Calificaciones</div>
          <div class="datos">
            <div><span>Estudiante:</span> ${estudianteNombre}</div>
            ${dni ? `<div><span>DNI:</span> ${formatDNI(dni)}</div>` : ''}
            <div><span>Curso:</span> ${cursoLabel}</div>
            <div><span>Ciclo lectivo:</span> ${anioLectivo}</div>
            <div><span>Fecha de emisión:</span> ${fechaEmision}</div>
          </div>
        </div>
        <table>
          <colgroup>
            <col style="width:12%" />
            <col style="width:8.5%" />
            <col style="width:9.5%" />
            <col style="width:8.5%" />
            <col style="width:9.5%" />
            <col style="width:11.5%" />
            <col style="width:8.5%" />
            <col style="width:7%" />
            <col style="width:13%" />
            <col style="width:12%" />
          </colgroup>
          <thead>
            <tr>
              <th rowspan="2">Materia</th>
              <th colspan="2">1.º Cuatrimestre</th>
              <th colspan="2">2.º Cuatrimestre</th>
              <th colspan="3">Intensificaciones</th>
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
                ? filasMaterias(materias, intensificaciones_1c, bloqueos_por_materia, intensificaciones_posteriores)
                : '<tr><td colspan="10">Sin calificaciones cargadas.</td></tr>'
            }
          </tbody>
        </table>
        <div class="rite-nota">Prenota = 1.ª y 2.ª Valoración Preliminar</div>
        <div class="rite-footer">
          <div class="firma">Firma y sello</div>
        </div>
      </div>
      <div class="rite-pagina rite-pagina-2">
        ${seccionPrevias(previas)}
        ${seccionRecursadas(recursadas)}
      </div>
    </div>`;
}

export const RITE_CSS = `
  @page {
    size: A4 portrait;
    margin: 7mm 7mm 7mm 7mm;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
    color: #1f2937;
  }
  .rite-pagina {
    width: 100%;
    border: 2px solid #1f2937;
    border-radius: 8px;
    padding: 10px 8px;
    margin-bottom: 18px;
  }
  .rite-pagina-2 { page-break-before: always; }
  .rite-header { border-bottom: 2px solid #1f2937; padding-bottom: 10px; margin-bottom: 12px; }
  .rite-header .escuela { font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: #6b7280; }
  .rite-header .titulo { font-size: 20px; font-weight: bold; margin: 4px 0 10px; }
  .rite-header .datos { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 24px; font-size: 13px; }
  .rite-header .datos span { color: #6b7280; }
  table { width: 100%; max-width: 100%; table-layout: fixed; border-collapse: collapse; }
  th, td {
    border: 1px solid #9ca3af;
    padding: 5px 4px;
    text-align: center;
    vertical-align: top;
    font-size: 12px;
    word-break: normal;
    overflow-wrap: break-word;
    hyphens: none;
  }
  thead th {
    background: #17324d;
    color: #fff;
    font-weight: 700;
    font-size: 10px;
    line-height: 1.3;
    letter-spacing: 0;
    padding: 6px 1px;
    overflow-wrap: normal;
  }
  td.mat { text-align: left; font-weight: 600; }
  td.prom { font-weight: 700; }
  td.cell-obs { text-align: left; }
  td.celda-aprobada {
    background-color: #dff6e6;
    color: #166534;
    font-weight: 700;
  }
  .mat-bloqueada { background-color: #fde2e2; }
  .mat-bloqueada td { color: #991b1b; }
  .rite-footer { margin-top: 64px; text-align: center; page-break-inside: avoid; }
  .rite-footer .firma {
    display: inline-block;
    min-width: 280px;
    border-top: 1.5px solid #1f2937;
    padding-top: 10px;
    color: #6b7280;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .rite-seccion { margin-top: 22px; page-break-inside: avoid; }
  .rite-seccion h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: #17324d; color: #fff; padding: 7px 12px; margin: 0 0 0 0; page-break-after: avoid; }
  .rite-tabla-extra { margin-top: 0; page-break-inside: avoid; }
  .rite-nota { font-size: 11px; font-style: italic; color: #6b7280; margin: 8px 2px 0; }
  .rite-seccion-previas .rite-tabla-extra th:first-child, .rite-seccion-previas .rite-tabla-extra td:first-child,
  .rite-seccion-previas .rite-tabla-extra th:nth-child(2), .rite-seccion-previas .rite-tabla-extra td:nth-child(2) { text-align: left; }
  .rite-seccion-recursadas .rite-tabla-extra th:first-child, .rite-seccion-recursadas .rite-tabla-extra td:first-child,
  .rite-seccion-recursadas .rite-tabla-extra th:nth-child(2), .rite-seccion-recursadas .rite-tabla-extra td:nth-child(2) { text-align: left; }
  @media print { button { display: none; } }
`;

export function exportarRitePDF(ritees, titulo) {
  const win = window.open('', '_blank');
  if (!win) return;
  const cuerpo = Array.isArray(ritees) ? ritees.join('') : ritees;
  win.document.write(`
    <html><head><title>${titulo}</title><style>${RITE_CSS}</style></head>
    <body>${cuerpo}<script>window.onload = function(){ window.print(); };<\/script></body></html>
  `);
  win.document.close();
}
