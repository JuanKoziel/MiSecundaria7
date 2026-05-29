import './login.css';
import { useState } from 'react';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('admin');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({
      username: username.toUpperCase(),
      role,
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-icon">🏫</div>

        <h2>MiSecundaria 7</h2>
        <p>Ingresa tus credenciales para acceder</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              placeholder="Ej: JMARTINEZ"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Rol de Usuario</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="admin">Administrador</option>
              <option value="docente">Docente</option>
              <option value="preceptor">Preceptor</option>
              <option value="familia">Familia</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-login">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
