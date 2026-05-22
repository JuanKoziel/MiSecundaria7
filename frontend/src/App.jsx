import { useState } from 'react';
import Login from './components/Login/login';
import PanelProfesores from './components/Profesores/PanelProfesores';
import PreceptorDashboard from './components/Preceptores/PreceptorDashboard';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  switch (user.role) {
    case 'preceptor':
    case 'admin':
      return <PreceptorDashboard user={user} onLogout={handleLogout} />;

    case 'docente':
      return <PanelProfesores user={user} onLogout={handleLogout} />;

    case 'familia':
      return (
        <div className="login-container">
          <div className="card" style={{ maxWidth: '480px', textAlign: 'center' }}>
            <h2>Panel de Familia</h2>
            <p style={{ color: 'var(--text-light)', margin: '16px 0 24px' }}>
              Esta sección estará disponible próximamente.
            </p>
            <button type="button" className="btn btn-primary" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      );

    default:
      return (
        <div className="login-container">
          <div className="card" style={{ maxWidth: '480px', textAlign: 'center' }}>
            <h2>Usuario sin panel asignado</h2>
            <p style={{ color: 'var(--text-light)', margin: '16px 0 24px' }}>
              El rol seleccionado no tiene un panel configurado.
            </p>
            <button type="button" className="btn btn-primary" onClick={handleLogout}>
              Volver al inicio
            </button>
          </div>
        </div>
      );
  }
}

export default App;
