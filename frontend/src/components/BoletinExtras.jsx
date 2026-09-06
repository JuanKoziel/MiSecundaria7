import React from 'react';
import { NOTA_APROBACION } from '../utils/previasRendicion';

const PERIODOS_PREVIA = [
  { key: 'MARZO', label: 'Marzo' },
  { key: 'JULIO', label: 'Julio' },
  { key: 'AGOSTO', label: 'Agosto' },
  { key: 'DICIEMBRE 1', label: 'Diciembre 1' },
  { key: 'DICIEMBRE 2', label: 'Diciembre 2' },
  { key: 'FEBRERO', label: 'Febrero' },
];

function formatearCalif(v) {
  if (v === null || v === undefined || v === '') return '';
  return v;
}

// Cabecera idéntica a la tabla principal (Intensificaciones con sus 3 columnas),
// con una columna extra "Año/Curso" al inicio. Se usa para "Materias a recursar".
function CabeceraBoletinConAnio() {
  return (
      <thead>
        <tr>
          <th rowSpan={2}>Año/Curso</th>
          <th rowSpan={2}>Materia</th>
          <th colSpan={2}>1.º Cuatrimestre</th>
          <th colSpan={2}>2.º Cuatrimestre</th>
          <th colSpan={3}>Intensificaciones</th>
          <th rowSpan={2}>Calificación final</th>
          <th rowSpan={2}>Observaciones</th>
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
  );
}

function SeccionPrevias({ previas = [] }) {
  return (
    <div className="boletin-seccion-extra">
      <div className="boletin-seccion-titulo">MATERIAS PREVIAS / ADEUDADAS</div>
      <div className="table-responsive">
        <table className="boletin-table">
          <colgroup>
            <col style={{ width: '16%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '26%' }} />
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2}>Materia</th>
              <th rowSpan={2}>Año (curso)</th>
              <th colSpan={6}>Período de intensificación</th>
              <th rowSpan={2}>Calificación final</th>
            </tr>
            <tr>
              {PERIODOS_PREVIA.map((p) => (
                <th key={p.key}>{p.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previas.length === 0 ? (
              <tr>
                <td></td>
                <td></td>
                {PERIODOS_PREVIA.map((p) => (
                  <td key={p.key}></td>
                ))}
                <td></td>
              </tr>
            ) : (
              previas.map((p, i) => (
                <tr key={i}>
                  <td className="table-cell-strong">{p.materia || '—'}</td>
                  <td>{p.anio || '—'}</td>
                  {PERIODOS_PREVIA.map((col) => {
                    const nota = p.rendiciones && p.rendiciones[col.key];
                    const aprobada = nota !== null && nota !== undefined && Number(nota) >= NOTA_APROBACION;
                    return (
                      <td
                        key={col.key}
                        className={aprobada ? 'boletin-celda-aprobada' : undefined}
                      >
                        {formatearCalif(nota)}
                      </td>
                    );
                  })}
                  <td>{formatearCalif(p.calificacion_final) || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SeccionRecursadas({ recursadas = [] }) {
  return (
    <div className="boletin-seccion-extra">
      <div className="boletin-seccion-titulo">MATERIAS A RECURSAR</div>
      <div className="table-responsive">
        <table className="boletin-table">
          <colgroup>
            <col style={{ width: '8.5%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8.5%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '8.5%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '6.5%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '14%' }} />
          </colgroup>
          <CabeceraBoletinConAnio />
          <tbody>
            {recursadas.length === 0 ? (
              <tr>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            ) : (
              recursadas.map((r, i) => {
                const n1 = r.nota1 === '' || r.nota1 === null || r.nota1 === undefined ? null : Number(r.nota1);
                const n2 = r.nota2 === '' || r.nota2 === null || r.nota2 === undefined ? null : Number(r.nota2);
                const nums = [n1, n2].filter((n) => n !== null && !Number.isNaN(n));
                const final = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : null;
                return (
                  <tr key={i}>
                    <td className="table-cell-strong">{r.anio || '—'}</td>
                    <td className="table-cell-strong">{r.materia || '—'}</td>
                    <td>{r.prenota1 || '—'}</td>
                    <td>{r.nota1 === '' || r.nota1 === null || r.nota1 === undefined ? '—' : r.nota1}</td>
                    <td>{r.prenota2 || '—'}</td>
                    <td>{r.nota2 === '' || r.nota2 === null || r.nota2 === undefined ? '—' : r.nota2}</td>
                    <td>{r.intensificacion_1c === null || r.intensificacion_1c === undefined ? '' : r.intensificacion_1c}</td>
                    <td>{r.diciembre === null || r.diciembre === undefined ? '' : r.diciembre}</td>
                    <td>{r.febrero === null || r.febrero === undefined ? '' : r.febrero}</td>
                    <td>{final ?? '—'}</td>
                    <td className="cell-obs">{r.observaciones || r.estado || 'A recursar'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BoletinExtras({
  recursadas = [],
  previas = [],
  intensificaciones_posteriores = [],
  loading,
}) {
  return (
    <div className="boletin-extras mt-16">
      <SeccionPrevias previas={previas} />
      <SeccionRecursadas recursadas={recursadas} />

      <p className="boletin-nota">Prenota = 1.ª y 2.ª Valoración Preliminar</p>
    </div>
  );
}
