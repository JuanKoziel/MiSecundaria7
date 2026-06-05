import Login from './components/Login/login';
import PanelProfesores from './components/Profesores/PanelProfesores';
import PreceptorDashboard from './components/Preceptores/PreceptorDashboard';
import FamiliaDashboard from './components/Familia/FamiliaDashboard';
import AdminDashboard from './components/Administracion/AdminDashboard';
import AlumnoDashboard from './components/Alumno/AlumnoDashboard';
import { useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

function Dashboard({ user, logout }) {
  const role = (user.role || user.roles?.[0] || '').toLowerCase();

  switch (role) {
    case 'preceptor':
      return <PreceptorDashboard user={user} onLogout={logout} />;
    case 'admin':
      return <AdminDashboard user={user} onLogout={logout} />;
    case 'docente':
      return <PanelProfesores user={user} onLogout={logout} />;
    case 'familia':
      return <FamiliaDashboard user={user} onLogout={logout} />;
    case 'alumno':
      return <AlumnoDashboard user={user} onLogout={logout} />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
            <h2 className="text-2xl font-semibold text-slate-800">Rol sin panel asignado</h2>
            <p className="mt-4 text-slate-500">El rol "{role || 'sin definir'}" aún no tiene un panel configurado.</p>
            <button type="button" className="mt-6 rounded-xl bg-orange-500 px-4 py-2 text-white" onClick={logout}>Volver al inicio</button>
          </div>
        </div>
      );
  }
}

function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500">
        Cargando sesión...
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
