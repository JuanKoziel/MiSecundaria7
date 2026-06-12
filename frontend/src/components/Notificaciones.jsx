import { useState } from 'react';

function Notificaciones({ userRole, selectedChild }) {
  const [activeTab, setActiveTab] = useState('alumno');

  // For Familia role, show tabs for student and personal notifications
  if (userRole === 'familia') {
    return (
      <div className="card">
        <div className="card-header-flex">
          <h3>Notificaciones</h3>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button
            type="button"
            className={`tab-button ${activeTab === 'alumno' ? 'active' : ''}`}
            onClick={() => setActiveTab('alumno')}
          >
            Del Alumno
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            Personales
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'alumno' ? (
          <div className="tab-content">
            {selectedChild ? (
              <div className="notificaciones-empty">
                <i className="fas fa-bell-slash" aria-hidden="true" />
                <p>
                  No hay notificaciones disponibles para {selectedChild.nombre}.
                </p>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  (Funcionalidad pendiente de implementación en backend)
                </p>
              </div>
            ) : (
              <div className="notificaciones-empty">
                <i className="fas fa-user-slash" aria-hidden="true" />
                <p>Seleccioná un alumno para ver sus notificaciones.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="tab-content">
            <div className="notificaciones-empty">
              <i className="fas fa-bell-slash" aria-hidden="true" />
              <p>No hay notificaciones personales disponibles.</p>
              <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                (Funcionalidad pendiente de implementación en backend)
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // For other roles (Alumno, Docente, Preceptor, Admin), show single view
  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Notificaciones</h3>
      </div>
      <div className="notificaciones-empty">
        <i className="fas fa-bell-slash" aria-hidden="true" />
        <p>No hay notificaciones disponibles.</p>
      </div>
    </div>
  );
}

export default Notificaciones;
