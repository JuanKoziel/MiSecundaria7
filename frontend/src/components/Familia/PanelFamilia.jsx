import { formatDNI } from '../../utils/dni';

function PanelFamilia({ miTutor, user, hijos }) {
  if (!miTutor) {
    return (
      <div className="card">
        <p className="empty-state-message">
          No se encontró un tutor vinculado a tu usuario.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header-flex" style={{ marginBottom: '20px' }}>
        <h3>Perfil del Tutor</h3>
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
            {miTutor.apellido}, {miTutor.nombre}
          </p>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
            Documento (DNI)
          </label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{formatDNI(miTutor.dni)}</p>
        </div>
        {miTutor.telefono && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
              Teléfono de Contacto
            </label>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{miTutor.telefono}</p>
          </div>
        )}
        {miTutor.direccion && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
              Dirección
            </label>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{miTutor.direccion}</p>
          </div>
        )}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
            Usuario
          </label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>
            {user?.username || '—'}
          </p>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
            Rol
          </label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>
            Tutor
          </p>
        </div>
      </div>

      <div className="card-header-flex">
        <h4>Hijos Vinculados</h4>
      </div>

      <div className="table-responsive" style={{ marginTop: '10px' }}>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', paddingLeft: '15px' }}>Alumno</th>
              <th style={{ textAlign: 'left', paddingLeft: '15px' }}>DNI</th>
              <th>Curso</th>
            </tr>
          </thead>
          <tbody>
            {hijos.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-state-message">
                  No hay hijos vinculados.
                </td>
              </tr>
            ) : (
              hijos.map((hijo) => (
                <tr key={hijo.id}>
                  <td style={{ textAlign: 'left', paddingLeft: '15px', fontWeight: '600' }}>
                    <i className="fas fa-user-graduate" style={{ color: 'var(--primary-color)', marginRight: '8px' }} aria-hidden="true" />
                    {hijo.nombre}
                  </td>
                  <td style={{ textAlign: 'left', paddingLeft: '15px' }}>{hijo.dni}</td>
                  <td style={{ color: '#555' }}>{hijo.curso}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PanelFamilia;
