import { docentes } from '../../data/mockData';

function Docentes() {
  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Docentes</h3>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>DNI</th>
              <th>Nombre</th>
              <th>Curso</th>
              <th>Materia(s)</th>
            </tr>
          </thead>
          <tbody>
            {docentes.flatMap((d) => {
              if (!d.asignaciones?.length) {
                return (
                  <tr key={d.id}>
                    <td>{d.dni}</td>
                    <td>{d.apellido}, {d.nombre}</td>
                    <td colSpan={2}>Sin asignaciones</td>
                  </tr>
                );
              }
              return d.asignaciones.map((asignacion, index) => (
                <tr key={`${d.id}-${asignacion.curso}`}>
                  {index === 0 && (
                    <>
                      <td rowSpan={d.asignaciones.length}>{d.dni}</td>
                      <td rowSpan={d.asignaciones.length}>
                        {d.apellido}, {d.nombre}
                      </td>
                    </>
                  )}
                  <td>{asignacion.curso}</td>
                  <td>{asignacion.materias.join(', ')}</td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Docentes;
