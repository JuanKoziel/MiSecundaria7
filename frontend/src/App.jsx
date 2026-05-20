import { useState } from 'react';
import Login from './components/Login/login';
import PanelProfesores from './components/Profesores/Panelprofesores';
// 1. Importamos tu nuevo panel de preceptores (ajustá la ruta según tus carpetas)
import PreceptorDashboard from './components/Preceptores/Preceptordashboard'; 

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Si no hay usuario logueado, mostramos la pantalla de Login
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // 2. Control de acceso según el Rol elegido
  switch (user.role) {
    case 'preceptor':
      // Si entra como preceptor, ejecuta los archivos que me mostraste
      return <PreceptorDashboard user={user} onLogout={handleLogout} />;
      
    case 'docente':
      // Si entra como docente, va a su panel correspondiente
      return <PanelProfesores user={user} onLogout={handleLogout} />;
      
    case 'admin':
      // Si en el futuro hacés un panel exclusivo de Administrador lo ponés acá.
      // Por ahora, como tu PreceptorDashboard incluye lógica de "admin" (ver docentes),
      // podés hacer que comparta el mismo panel o crear uno nuevo.
      return <Administradorativo user={user} onLogout={handleLogout} />;

    case 'comun':
    default:
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Usuario sin panel asignado</h2>
          <button onClick={handleLogout}>Volver</button>
        </div>
      );
  }
}

export default App;