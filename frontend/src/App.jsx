import Login from './components/Login/login';
import PanelProfesores from './components/Profesores/PanelProfesores';
import PreceptorDashboard from './components/Preceptores/PreceptorDashboard';
import JefePreceptorDashboard from './components/JefePreceptores/JefePreceptorDashboard';
import FamiliaDashboard from './components/Familia/FamiliaDashboard';
import AdminDashboard from './components/Administracion/AdminDashboard';
import AlumnoDashboard from './components/Alumno/AlumnoDashboard';
import LoadingScreen from './components/Shared/LoadingScreen';
import { useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';

function Dashboard({ user, logout }) {
  const role = user.role || user.roles?.[0] || '';

  switch (role) {
    case 'preceptor':
      return <PreceptorDashboard user={user} onLogout={logout} />;
    case 'jefe_preceptores':
      return <JefePreceptorDashboard user={user} onLogout={logout} />;
    case 'admin':
    case 'director':
      return <AdminDashboard user={user} onLogout={logout} />;
    case 'docente':
      return <PanelProfesores user={user} onLogout={logout} />;
    case 'familia':
      return <FamiliaDashboard user={user} onLogout={logout} />;
    case 'alumno':
      return <AlumnoDashboard user={user} onLogout={logout} />;
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

function DashboardConDatos({ user, logout }) {
  const { loading } = useData();

  if (loading) {
    return <LoadingScreen fixed text="Cargando el sistema" />;
  }

  return <Dashboard user={user} logout={logout} />;
}

function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <LoadingScreen fixed text="Iniciando sesión" />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <DataProvider>
      <DashboardConDatos user={user} logout={logout} />
    </DataProvider>
  );
}

export default App;
