import { formatDNI } from '../../utils/dni';
import { useData } from '../../context/DataContext';
import ProfileBanner from '../Shared/ProfileBanner';

function PanelFamilia({ miTutor, user, hijos }) {
  const { getAlumnoById } = useData();

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
      <ProfileBanner
        icon="fa-user-tie"
        nombre={`${miTutor.apellido}, ${miTutor.nombre}`}
        rol={miTutor.tipo || 'Tutor'}
        estado="Activo"
      />

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
            {miTutor ? `${miTutor.apellido}, ${miTutor.nombre}` : (user?.username || '—')}
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
        <div>
          <label className="profile-label">
            Hijos vinculados
          </label>
          <p className="profile-value">{hijos.length}</p>
        </div>
      </div>

      {hijos.length > 0 && (
        <div className="familia-hijos-section">
          <h4 className="familia-hijos-title">
            <i className="fas fa-users icon-primary" aria-hidden="true" />
            Estudiantes asociados
          </h4>
          {hijos.map((hijo, idx) => {
            const alumnoCompleto = getAlumnoById(hijo.alumnoId);
            return (
              <div key={hijo.id} className="familia-hijo-card" style={{ borderBottom: idx < hijos.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <div className="familia-hijo-main">
                  <div className="familia-hijo-avatar">
                    <i className="fas fa-user-graduate" aria-hidden="true" />
                  </div>
                  <div className="familia-hijo-info">
                    <span className="familia-hijo-nombre">{hijo.nombre}</span>
                    <div className="familia-hijo-meta">
                      <span>Curso: <strong>{hijo.curso || '—'}</strong></span>
                      {alumnoCompleto && alumnoCompleto.dni && (
                        <span>DNI: <strong>{formatDNI(alumnoCompleto.dni)}</strong></span>
                      )}
                      {alumnoCompleto && alumnoCompleto.fecha_nacimiento && (
                        <span>Nac.: <strong>{alumnoCompleto.fecha_nacimiento}</strong></span>
                      )}
                    </div>
                  </div>
                </div>
                {alumnoCompleto && (alumnoCompleto.telefono || alumnoCompleto.direccion) && (
                  <div className="familia-hijo-extra">
                    {alumnoCompleto.telefono && (
                      <span className="familia-hijo-extra-item">
                        <i className="fas fa-phone" aria-hidden="true" />
                        {alumnoCompleto.telefono}
                      </span>
                    )}
                    {alumnoCompleto.direccion && (
                      <span className="familia-hijo-extra-item">
                        <i className="fas fa-map-marker-alt" aria-hidden="true" />
                        {alumnoCompleto.direccion}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default PanelFamilia;
