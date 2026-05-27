import { useEffect, useState } from 'react';
import Login from './components/Login/login';
import PanelProfesores from './components/Profesores/PanelProfesores';
import PreceptorDashboard from './components/Preceptores/PreceptorDashboard';
import FamiliaDashboard from './components/Familia/FamiliaDashboard';
<<<<<<< HEAD
import { fetchMe, mapUser } from './api/services';
import { getToken, setToken } from './api/client';
=======
import AdminDashboard from './components/Administracion/AdminDashboard';
>>>>>>> main

function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setBooting(false);
      return;
    }
    fetchMe()
      .then((data) => setUser(mapUser(data)))
      .catch(() => setToken(null))
      .finally(() => setBooting(false));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
  };

  if (booting) {
    return (
      <div className="login-container">
        <p className="empty-state-message">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  switch (user.role) {
    case 'preceptor':
      return <PreceptorDashboard user={user} onLogout={handleLogout} />;
    case 'admin':
      return <AdminDashboard user={user} onLogout={handleLogout} />;
    case 'docente':
      return <PanelProfesores user={user} onLogout={handleLogout} />;

    case 'familia':
      return <FamiliaDashboard user={user} onLogout={handleLogout} />;

    default:
      return (
        <div className="login-container">
          <div className="card" style={{ maxWidth: '480px', textAlign: 'center' }}>
            <h2>Usuario sin panel asignado</h2>
            <p className="empty-state-message" style={{ margin: '16px 0 24px' }}>
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
