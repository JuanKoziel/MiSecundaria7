import './login.css';
import { useState } from 'react';
import apiClient from '../../services/apiClient';

function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Llamar a la API de login
      const response = await apiClient.login(usuario, contrasena);

      // Pasar los datos del usuario autenticado con su rol
      onLogin({
        usuario: response.usuario,
        rol_actual: response.rol_actual,
        roles: response.usuario.rol_nombres,
      });
    } catch (err) {
      console.error('Login error:', err);
      
      // Mostrar error específico
      if (err.data && err.data.error) {
        // Error es un string o un diccionario
        const errorMsg = typeof err.data.error === 'string' 
          ? err.data.error 
          : Object.values(err.data.error).flat().join(' ');
        setError(errorMsg);
      } else {
        setError('Error al iniciar sesión. Verifique usuario y contraseña.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-icon">🏫</div>

        <h2>MiSecundaria 7</h2>
        <p>Ingresa tus credenciales para acceder</p>

        {error && <div className="error-message" style={{ 
          color: '#d32f2f', 
          marginBottom: '1rem', 
          padding: '0.75rem', 
          backgroundColor: '#ffebee',
          borderRadius: '4px',
          fontSize: '0.9rem'
        }}>
          ⚠️ {error}
        </div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="usuario">Usuario</label>
            <input
              id="usuario"
              type="text"
              placeholder="Ej: admin, prof_juan, alumno_lucas"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena"
              type="password"
              placeholder="Ingresa tu contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-login"
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          fontSize: '0.85rem',
          color: '#666'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>📋 Usuarios de prueba:</p>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.2rem' }}>
            <li>admin / admin123</li>
            <li>prof_juan / docente123</li>
            <li>prof_maria / docente123</li>
            <li>preceptor_carlos / preceptor123</li>
            <li>familia_anna / familia123</li>
            <li>alumno_lucas / alumno123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Login;
