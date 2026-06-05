<<<<<<< HEAD
import { useState, useEffect } from 'react';
=======
>>>>>>> 5e4dc3228e3b802dcda3721ee7db3cdb90281b0f
import Login from './components/Login/login';
import PanelProfesores from './components/Profesores/PanelProfesores';
import PreceptorDashboard from './components/Preceptores/PreceptorDashboard';
import FamiliaDashboard from './components/Familia/FamiliaDashboard';
import AdminDashboard from './components/Administracion/AdminDashboard';
<<<<<<< HEAD
import apiClient from './services/apiClient';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Intenta restaurar la sesión del usuario desde localStorage
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          // Establecer el token en el cliente API
          apiClient.token = token;
          apiClient.refreshToken = localStorage.getItem('refresh_token');
          
          // Verificar que el token siga siendo válido
          const userData = await apiClient.getCurrentUser();
          setUser({
            usuario: userData,
            rol_actual: userData.rol_nombres?.[0] || 'usuario',
            roles: userData.rol_nombres || [],
          });
        }
      } catch (error) {
        console.error('Error restaurando sesión:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Usar rol_actual como identificador principal
  const userRole = user.rol_actual || user.role;

  switch (userRole) {
=======
import AlumnoDashboard from './components/Alumno/AlumnoDashboard';
import { useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

function Dashboard({ user, logout }) {
  const role = user.role || user.roles?.[0] || '';

  switch (role) {
>>>>>>> 5e4dc3228e3b802dcda3721ee7db3cdb90281b0f
    case 'preceptor':
      return <PreceptorDashboard user={user} onLogout={logout} />;
    case 'admin':
      return <AdminDashboard user={user} onLogout={logout} />;
    case 'docente':
<<<<<<< HEAD
      return <PanelProfesores user={user} onLogout={handleLogout} />;
    case 'familia':
      return <FamiliaDashboard user={user} onLogout={handleLogout} />;
    case 'alumno':
      return (
        <div className="login-container">
          <div className="card" style={{ maxWidth: '480px', textAlign: 'center' }}>
            <h2>Panel de Alumno</h2>
            <p style={{ color: 'var(--text-light)', margin: '16px 0 24px' }}>
              Bienvenido {user.usuario?.usuario}. El panel de alumno aún está en desarrollo.
            </p>
            <button type="button" className="btn btn-primary" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      );

=======
      return <PanelProfesores user={user} onLogout={logout} />;
    case 'familia':
      return <FamiliaDashboard user={user} onLogout={logout} />;
    case 'alumno':
      return <AlumnoDashboard user={user} onLogout={logout} />;
>>>>>>> 5e4dc3228e3b802dcda3721ee7db3cdb90281b0f
    default:
      return (
        <div className="login-container">
          <div className="card" style={{ maxWidth: '480px', textAlign: 'center' }}>
            <h2>Usuario sin panel asignado</h2>
            <p style={{ color: 'var(--text-light)', margin: '16px 0 24px' }}>
              El rol "{userRole}" no tiene un panel configurado.
            </p>
            <button type="button" className="btn btn-primary" onClick={logout}>
              Volver al inicio
            </button>
          </div>
        </div>
      );
  }
}

function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="login-container">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <DataProvider>
      <Dashboard user={user} logout={logout} />
    </DataProvider>
  );
}

export default App;
