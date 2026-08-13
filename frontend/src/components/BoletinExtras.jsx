import React from 'react';

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

// Cabecera idéntica a la tabla principal (Intensificación 1.º C como grupo propio),
// con una columna extra "Año/Curso" al inicio. Se usa para "Materias a recursar".
function CabeceraBoletinConAnio() {
  return (
      <thead>
        <tr>
          <th rowSpan={2}>Año/Curso</th>
          <th rowSpan={2}>Materia</th>
          <th colSpan={2}>1.º Cuatrimestre</th>
          <th colSpan={3}>2.º Cuatrimestre</th>
          <th colSpan={2}>Intensificaciones</th>
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
              previas.map((p, i) => {
                const peri = String(p.periodo || '')
                  .trim()
                  .toUpperCase();
                return (
                  <tr key={i}>
                    <td className="table-cell-strong">{p.materia || '—'}</td>
                    <td>{p.anio || '—'}</td>
                    {PERIODOS_PREVIA.map((col) => (
                      <td key={col.key}>
                        {col.key === peri ? formatearCalif(p.calificacion) : ''}
                      </td>
                    ))}
                    <td>{formatearCalif(p.calificacion) || '—'}</td>
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

function SeccionRecursadas({ recursadas = [] }) {
  return (
    <div className="boletin-seccion-extra">
      <div className="boletin-seccion-titulo">MATERIAS A RECURSAR</div>
      <div className="table-responsive">
        <table className="boletin-table">
          <colgroup>
            <col style={{ width: '7.5%' }} />
            <col style={{ width: '12.5%' }} />
            <col style={{ width: '7.5%' }} />
            <col style={{ width: '8.5%' }} />
            <col style={{ width: '7.5%' }} />
            <col style={{ width: '8.5%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '6.5%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '8.5%' }} />
            <col style={{ width: '16%' }} />
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
              recursadas.map((r, i) => (
                <tr key={i}>
                  <td className="table-cell-strong">{r.anio || '—'}</td>
                  <td className="table-cell-strong">{r.materia || '—'}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td className="cell-obs">{r.estado || 'A recursar'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SeccionOtrasIntensificaciones({ intensificaciones_posteriores = [] }) {
  return (
    <div className="boletin-seccion-extra">
      <div className="boletin-seccion-titulo">INTENSIFICACIONES</div>
      <div className="table-responsive">
        <table className="boletin-table">
          <colgroup>
            <col style={{ width: '34%' }} />
            <col style={{ width: '33%' }} />
            <col style={{ width: '33%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Materia</th>
              <th>Diciembre</th>
              <th>Febrero</th>
            </tr>
          </thead>
          <tbody>
            {intensificaciones_posteriores.length === 0 ? (
              <tr>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            ) : (
              intensificaciones_posteriores.map((it, i) => (
                <tr key={i}>
                  <td className="table-cell-strong">{it.materia || '—'}</td>
                  <td>{it.diciembre !== null && it.diciembre !== undefined ? it.diciembre : ''}</td>
                  <td>{it.febrero !== null && it.febrero !== undefined ? it.febrero : ''}</td>
                </tr>
              ))
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
      <SeccionOtrasIntensificaciones intensificaciones_posteriores={intensificaciones_posteriores} />

      <p className="boletin-nota">Prenota = 1.ª y 2.ª Valoración Preliminar</p>
    </div>
  );
}
