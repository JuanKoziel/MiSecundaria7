import React from 'react';

function TopHeader({ cursoSeleccionado, materiaSeleccionada }) {
  return (
    <header className="main-header">
      <div>
        <h2>Panel de Gestión Docente</h2>
        <div className="main-header-subtitle">
          {cursoSeleccionado ? (
            <span>
              {cursoSeleccionado} {materiaSeleccionada && <> &gt; <span className="font-accent">{materiaSeleccionada}</span></>}
            </span>
          ) : (
            'Aguardando selección de grupo...'
          )}
        </div>
      </div>
      <div className="user-profile-info">
        <span className="badge role-badge-display">Docente</span>
        <div className="user-avatar">QA</div>
      </div>
    </header>
  );
}

export default TopHeader;