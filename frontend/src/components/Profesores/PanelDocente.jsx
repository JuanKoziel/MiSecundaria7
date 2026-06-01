import { useData } from '../../context/DataContext';

function PanelDocente({ miDocente }) {
  const { cursoMateria, cursosObj } = useData();

  if (!miDocente) {
    return (
      <div className="card">
        <p className="empty-state-message">
          No se encontró un perfil de docente vinculado a tu usuario.
        </p>
      </div>
    );
  }

  const misAsignaciones = cursoMateria
    .filter((cm) => cm.id_docente === miDocente.id)
    .map((cm) => {
      const cObj = cursosObj.find((c) => c.id_curso === cm.id_curso);
      return {
        id: cm.id,
        curso: cm.curso_nombre || '',
        materia: cm.materia_nombre || '',
        anio: cObj?.ciclo_anio || '',
      };
    });

  return (
    <div className="card">
      <div className="card-header-flex" style={{ marginBottom: '20px' }}>
        <h3>Perfil del Docente</h3>
        <span className="badge badge-presente" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
          <i className="fas fa-check-circle" aria-hidden="true" /> Activo
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '35px',
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        borderLeft: '4px solid var(--primary-color)',
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>Nombre Completo</label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{miDocente.apellido}, {miDocente.nombre}</p>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>Documento (DNI)</label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{miDocente.dni}</p>
        </div>
        {miDocente.correo && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>Correo Electrónico</label>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px', color: 'var(--primary-color)' }}>{miDocente.correo}</p>
          </div>
        )}
        {miDocente.telefono && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>Teléfono de Contacto</label>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{miDocente.telefono}</p>
          </div>
        )}
      </div>

      <div className="card-header-flex">
        <h4>Materias y Cursos Asignados</h4>
      </div>

      <div className="table-responsive" style={{ marginTop: '10px' }}>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', paddingLeft: '15px' }}>Curso / División</th>
              <th style={{ textAlign: 'left', paddingLeft: '15px' }}>Materia Dictada</th>
              <th>Año Lectivo</th>
            </tr>
          </thead>
          <tbody>
            {misAsignaciones.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-state-message">
                  No hay asignaciones registradas.
                </td>
              </tr>
            ) : (
              misAsignaciones.map((item) => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'left', paddingLeft: '15px', fontWeight: '600' }}>
                    <i className="fas fa-users" style={{ color: '#888', marginRight: '8px' }} aria-hidden="true" />
                    {item.curso}
                  </td>
                  <td style={{ textAlign: 'left', paddingLeft: '15px' }}>
                    <i className="fas fa-book" style={{ color: 'var(--primary-color)', marginRight: '8px' }} aria-hidden="true" />
                    {item.materia}
                  </td>
                  <td style={{ color: '#555' }}>{item.anio}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PanelDocente;
