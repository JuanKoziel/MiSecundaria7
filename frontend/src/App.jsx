import Login from './components/Login/login';
import PanelProfesores from './components/Profesores/PanelProfesores';
import PreceptorDashboard from './components/Preceptores/PreceptorDashboard';
import JefePreceptorDashboard from './components/JefePreceptores/JefePreceptorDashboard';
import FamiliaDashboard from './components/Familia/FamiliaDashboard';
import AdminDashboard from './components/Administracion/AdminDashboard';
import AlumnoDashboard from './components/Alumno/AlumnoDashboard';
import LoadingScreen from './components/Shared/LoadingScreen';
import SeleccionRol from './components/Shared/SeleccionRol';
import { useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';

function Dashboard({ user, rolActivo, logout }) {
  switch (rolActivo) {
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
      return null;
  }
}

function DashboardConDatos({ user, rolActivo, logout }) {
  const { loading, refreshing } = useData();

  if (loading && !refreshing) {
    return <LoadingScreen fixed text="Cargando el sistema" />;
  }

  return <Dashboard user={user} rolActivo={rolActivo} logout={logout} />;
}

function App() {
  const { user, rolActivo, loading, logout } = useAuth();

  if (loading) {
    return <LoadingScreen fixed text="Iniciando sesión" />;
  }

  if (!user) {
    return <Login />;
  }

  if (!rolActivo) {
    return <SeleccionRol />;
  }

  return (
    <DataProvider>
      <DashboardConDatos user={user} rolActivo={rolActivo} logout={logout} />
    </DataProvider>
  );
}

export default App;
