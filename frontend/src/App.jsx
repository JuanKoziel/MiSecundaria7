import Login from './components/Login/login';
import PanelProfesores from './components/Profesores/PanelProfesores';
import PreceptorDashboard from './components/Preceptores/PreceptorDashboard';
import FamiliaDashboard from './components/Familia/FamiliaDashboard';
import AdminDashboard from './components/Administracion/AdminDashboard';
import { useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

function Dashboard({ user, logout }) {
  const role = user.role || user.roles?.[0] || '';

  switch (role) {
    case 'preceptor':
      return <PreceptorDashboard user={user} onLogout={logout} />;
    case 'admin':
      return <AdminDashboard user={user} onLogout={logout} />;
    case 'docente':
      return <PanelProfesores user={user} onLogout={logout} />;
    case 'familia':
      return <FamiliaDashboard user={user} onLogout={logout} />;
    default:
      return (
        <div className="login-container">
          <div className="card" style={{ maxWidth: '480px', textAlign: 'center' }}>
            <h2>Usuario sin panel asignado</h2>
            <p style={{ color: 'var(--text-light)', margin: '16px 0 24px' }}>
              El rol seleccionado no tiene un panel configurado.
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
