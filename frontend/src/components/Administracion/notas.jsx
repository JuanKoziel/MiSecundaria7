import { useState } from 'react';
import { alumnos, nombreCorto } from '../../data/mockData';

function clampNota(value) {
  if (value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return String(Math.min(10, Math.max(1, num)));
}

function Notas() {
  const [notas, setNotas] = useState({});

  const handleChange = (id, value) => {
    setNotas((prev) => ({ ...prev, [id]: clampNota(value) }));
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Calificaciones del Periodo</h3>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Alumno</th>
              <th style={{ width: '150px' }}>Nota Final</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((a) => (
              <tr key={a.id}>
                <td>{nombreCorto(a)}</td>
                <td>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="input-table input-table--wide"
                    value={notas[a.id] ?? ''}
                    onChange={(e) => handleChange(a.id, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Notas;
