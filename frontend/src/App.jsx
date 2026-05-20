import { useState } from 'react';
import Login from './components/Login/login';
import PanelProfesores from './components/Profesores/Panelprofesores';
import PanelPreceptores from './components/Preceptores/Preceptordashboard';

function App() {
  // Estado para guardar los datos del usuario logueado (ej: username y role)
  const [user, setUser] = useState(null);

  // Función que se ejecutará cuando el login sea exitoso
  const handleLogin = (userData) => {
    setUser(userData); // Guardamos el usuario (esto cambia el estado)
  };

  // Función opcional por si después querés agregar un botón de "Cerrar Sesión"
  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
      return <Login onLogin={(data) => setUser(data)} />;
    }

    // Renderizado basado en el rol del usuario
    switch (user.role) {
      case 'directivo':
        return <PanelDirectivos user={user} onLogout={() => setUser(null)} />;
      case 'preceptor':
        return <PanelPreceptores user={user} onLogout={() => setUser(null)} />;
      case 'docente':
        return <PanelProfesores user={user} onLogout={() => setUser(null)} />;
      case 'comun':
      default:
        return <PanelComun user={user} onLogout={() => setUser(null)} />;
    }
}

export default App;