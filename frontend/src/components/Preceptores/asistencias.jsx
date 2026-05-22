import { useState } from 'react';
import { alumnos, nombreCorto } from '../../data/mockData';

function Asistencias() {
  const [asistencias, setAsistencias] = useState({});

  const toggleAsistencia = (id) => {
    setAsistencias((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Control de Asistencia Diaria</h3>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Estado de Asistencia</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((a) => {
              const isPresente = asistencias[a.id] ?? false;
              return (
                <tr key={a.id}>
                  <td>{nombreCorto(a)}</td>
                  <td>
                    <button
                      type="button"
                      className={`badge ${isPresente ? 'badge-presente' : 'badge-ausente'}`}
                      onClick={() => toggleAsistencia(a.id)}
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      {isPresente ? '✓ Presente' : '✕ Ausente'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Asistencias;
