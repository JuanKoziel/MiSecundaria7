import React from 'react';

function Sidebar({ seccionActiva, onCambiarSeccion, onReiniciar }) {
  const menuItems = [
    { id: 'alumnos', label: 'Calificaciones', icon: 'fa-graduation-cap' },
    { id: 'info', label: 'Info General', icon: 'fa-info-circle' },
    { id: 'planif', label: 'Planificaciones', icon: 'fa-folder-open' },
    { id: 'asistencia', label: 'Asistencia', icon: 'fa-user-check' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <i className="fas fa-school"></i>
        <span>EduGestion</span>
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.id} className={seccionActiva === item.id ? 'active' : ''}>
            <a href={`#${item.id}`} onClick={(e) => { e.preventDefault(); onCambiarSeccion(item.id); }}>
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
            </a>
          </li>
        ))}

        <li className="logout-li">
          <a href="#reset" onClick={(e) => { e.preventDefault(); onReiniciar(); }}>
            <i className="fas fa-sync-alt"></i>
            <span>Reiniciar App</span>
          </a>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;