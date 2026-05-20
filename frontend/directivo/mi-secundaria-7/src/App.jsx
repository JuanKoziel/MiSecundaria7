import React, { useState } from 'react';
import Directivos from './views/Directivos';

export default function App() {
  // Simulamos que el Login ya validó al Directivo y nos mandó directo acá
  const [user, setUser] = useState({
    dni: '12345678',
    role: 'Directivos',
    name: 'Director General'
  });
  
  const [currentView, setCurrentView] = useState('inicio');

  const handleLogout = () => {
    alert('Redirigiendo al sistema de Login centralizado...');
  };

  return (
    <div className="dashboard-layout">
      {/* Barra Lateral Institucional (Sidebar) */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <i className="fa-solid fa-school"></i>
          <span>MS7 Gestión</span>
        </div>
        
        <ul className="sidebar-menu">
          <li className={currentView === 'inicio' ? 'active' : ''}>
            <a href="#inicio" onClick={() => setCurrentView('inicio')}>
              <i className="fa-solid fa-chart-pie"></i>
              <span>Panel Directivo</span>
            </a>
          </li>
          
          <li style={{ marginTop: 'auto' }}>
            <a href="#logout" onClick={handleLogout} style={{ color: '#dc3545' }}>
              <i className="fa-solid fa-right-from-bracket"></i>
              <span>Cerrar Sesión</span>
            </a>
          </li>
        </ul>
      </aside>

      {/* Contenido Principal */}
      <main className="main-content">
        <header className="main-header">
          <div>
            <h1>Mi Secundaria 7</h1>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Módulo de Supervisión Directiva</p>
          </div>
          <div className="user-profile-info">
            <div className="user-avatar">D</div>
            <div>
              <h4 style={{ margin: 0 }}>{user.name}</h4>
              <small style={{ color: '#fd7e14', fontWeight: 'bold' }}>{user.role}</small>
            </div>
          </div>
        </header>

        {/* Carga el componente de Directivos directo en la pantalla de inicio */}
        <section className="view-section">
          {currentView === 'inicio' ? (
            <Directivos />
          ) : (
            <div className="card">
              <h2>Vista no disponible</h2>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}