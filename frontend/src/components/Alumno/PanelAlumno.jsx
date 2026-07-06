import { formatDNI } from '../../utils/dni';
import { cursoConOrientacion } from '../../utils/orientacion';

function PanelAlumno({ miAlumno, user }) {
  if (!miAlumno) {
    return (
      <div className="card">
        <p className="empty-state-message">
          No se encontró un alumno vinculado a tu usuario.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header-flex" style={{ marginBottom: '20px' }}>
        <h3>Perfil del Alumno</h3>
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
            {miAlumno.apellido}, {miAlumno.nombre}
          </p>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
            Documento (DNI)
          </label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{formatDNI(miAlumno.dni)}</p>
        </div>
        {miAlumno.telefono && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
              Teléfono de Contacto
            </label>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{miAlumno.telefono}</p>
          </div>
        )}
        {miAlumno.direccion && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
              Dirección
            </label>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{miAlumno.direccion}</p>
          </div>
        )}
        {miAlumno.fecha_nacimiento && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
              Fecha de Nacimiento
            </label>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>
              {miAlumno.fecha_nacimiento}
            </p>
          </div>
        )}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
            Usuario
          </label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>
            {miAlumno.usuario}
          </p>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
            Rol
          </label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>
            Alumno
          </p>
        </div>
      </div>

      <div className="card-header-flex">
        <h4>Cursando</h4>
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
            {miAlumno.curso ? (
              <tr>
                <td style={{ textAlign: 'left', paddingLeft: '15px', fontWeight: '600' }}>
                  <i className="fas fa-users" style={{ color: '#888', marginRight: '8px' }} aria-hidden="true" />
                  {cursoConOrientacion(miAlumno.curso)}
                </td>
                <td style={{ color: '#555' }}>{miAlumno.ciclo_anio || '—'}</td>
              </tr>
            ) : (
              <tr>
                <td colSpan={2} className="empty-state-message">
                  No está asignado a ningún curso.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PanelAlumno;
