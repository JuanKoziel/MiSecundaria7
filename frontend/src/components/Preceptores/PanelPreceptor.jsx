import { useData } from '../../context/DataContext';
import { formatDNI } from '../../utils/dni';

function PanelPreceptor({ miPreceptor }) {
  const { cursosObj } = useData();

  if (!miPreceptor) {
    return (
      <div className="card">
        <p className="empty-state-message">
          No se encontró un perfil de preceptor vinculado a tu usuario.
        </p>
      </div>
    );
  }

  const misCursos = (miPreceptor.cursos || []).map((c) => {
    const cObj = cursosObj.find((co) => co.id_curso === c.id_curso);
    return {
      id: c.id_curso,
      curso: c.nombre_curso || '',
      anio: c.ciclo_anio || cObj?.ciclo_anio || '',
    };
  });

  return (
    <div className="card">
      <div className="card-header-flex" style={{ marginBottom: '20px' }}>
        <h3>Perfil del Preceptor</h3>
        <span className="badge badge-presente" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
          <i className="fas fa-check-circle" aria-hidden="true" /> Activo
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          borderLeft: '4px solid var(--primary-color)',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
            Nombre Completo
          </label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>
            {miPreceptor.apellido}, {miPreceptor.nombre}
          </p>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
            Documento (DNI)
          </label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{formatDNI(miPreceptor.dni)}</p>
        </div>
        {miPreceptor.correo && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
              Correo Electrónico
            </label>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px', color: 'var(--primary-color)', wordBreak: 'break-all' }}>
              {miPreceptor.correo}
            </p>
          </div>
        )}
        {miPreceptor.telefono && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
              Teléfono de Contacto
            </label>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{miPreceptor.telefono}</p>
          </div>
        )}
      </div>

      <div className="card-header-flex">
        <h4>Cursos Asignados</h4>
      </div>

      <div className="table-responsive" style={{ marginTop: '10px' }}>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', paddingLeft: '15px' }}>Curso / División</th>
              <th>Año Lectivo</th>
            </tr>
          </thead>
          <tbody>
            {misCursos.length === 0 ? (
              <tr>
                <td colSpan={2} className="empty-state-message">
                  No hay cursos asignados.
                </td>
              </tr>
            ) : (
              misCursos.map((item) => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'left', paddingLeft: '15px', fontWeight: '600' }}>
                    <i className="fas fa-users" style={{ color: '#888', marginRight: '8px' }} aria-hidden="true" />
                    {item.curso}
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

export default PanelPreceptor;
