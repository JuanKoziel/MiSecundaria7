import { useEffect, useState } from 'react';
import { fetchAlumnos } from '../../api/services';

function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlumnos()
      .then(setAlumnos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Listado de Alumnos</h3>
      </div>

      {loading ? (
        <p className="empty-state-message">Cargando alumnos...</p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>DNI</th>
                <th>Nombre Completo</th>
                <th>Curso</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.dni}</strong></td>
                  <td>{a.apellido}, {a.nombre}</td>
                  <td>{a.curso}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Alumnos;
