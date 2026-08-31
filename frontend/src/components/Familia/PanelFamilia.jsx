import { formatDNI } from '../../utils/dni';

function StatCard({ icon, value, label, color }) {
  return (
    <div className="stat-card">
      <i className={`fas ${icon}`} style={{ fontSize: '1.8rem', color: color || 'var(--primary-color)', marginBottom: '4px' }} aria-hidden="true" />
      <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '4px', color: color || 'inherit' }}>
        {value ?? '—'}
      </div>
      <div className="stat-card-label">
        {label}
      </div>
    </div>
  );
}

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
      <div className="card-header-flex mb-20">
        <h3>Perfil del Tutor</h3>
        <span className="badge badge-presente badge--header">
          <i className="fas fa-check-circle" aria-hidden="true" /> Activo
        </span>
      </div>

      <div className="profile-grid">
        <div>
          <label className="profile-label">
            Nombre Completo
          </label>
          <p className="profile-value">
            {miTutor.apellido}, {miTutor.nombre}
          </p>
        </div>
        <div>
          <label className="profile-label">
            Documento (DNI)
          </label>
          <p className="profile-value">{formatDNI(miTutor.dni)}</p>
        </div>
        {miTutor.telefono && (
          <div>
            <label className="profile-label">
              Teléfono de Contacto
            </label>
            <p className="profile-value">{miTutor.telefono}</p>
          </div>
        )}
        {miTutor.direccion && (
          <div>
            <label className="profile-label">
              Dirección
            </label>
            <p className="profile-value">{miTutor.direccion}</p>
          </div>
        )}
        <div>
          <label className="profile-label">
            Usuario
          </label>
          <p className="profile-value">
            {user?.username || '—'}
          </p>
        </div>
        <div>
          <label className="profile-label">
            Rol
          </label>
          <p className="profile-value">
            {miTutor.tipo || '—'}
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="fa-user-graduate" value={hijos.length} label="Hijos vinculados" />
        <StatCard icon="fa-check-circle" value="Activo" label="Estado de la cuenta" color="#15803d" />
      </div>

      {hijos.length > 0 && (
        <div
          style={{
            background: '#f8f9fa',
            borderLeft: '4px solid var(--primary-color)',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '28px',
          }}
        >
          <strong style={{ fontSize: '0.9rem', color: '#444', display: 'block', marginBottom: '10px' }}>
            <i className="fas fa-users icon-primary" aria-hidden="true" />
            Estudiantes asociados
          </strong>
          {hijos.map((hijo, idx) => (
            <div key={hijo.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: idx < hijos.length - 1 ? '1px solid var(--border-color)' : 'none',
              fontSize: '0.9rem',
            }}>
              <span className="font-bold">
                <i className="fas fa-user-graduate" style={{ color: 'var(--primary-color)', marginRight: '8px', fontSize: '0.8rem' }} aria-hidden="true" />
                {hijo.nombre}
              </span>
              <span className="text-muted">Curso: <strong>{hijo.curso || '—'}</strong></span>
            </div>
          ))}
        </div>
      )}

      <div className="info-box mb-28">
        <i className="fas fa-info-circle icon-primary" aria-hidden="true" />
        Desde aquí puede realizar el seguimiento académico de sus hijos, visualizar comunicados, asistencias y calificaciones.
      </div>

    </div>
  );
}

export default PanelFamilia;
