import "./login.css";
import { useState } from "react";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("admin");

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
        {/* Ícono decorativo que pide tu index.css */}
        <div className="login-icon">🏫</div> 
        
        <h2>EduGestion</h2>
        <p>Ingresa tus credenciales para acceder</p>

        <form onSubmit={handleSubmit}>
          {/* Agrupamos cada input en un .form-group como dicta tu CSS */}
          <div className="form-group">
            <label>Usuario</label>
            <input
              type="text"
              placeholder="Ej: JMARTINEZ"
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Rol de Usuario</label>
            <select onChange={(e) => setRole(e.target.value)}>
              <option value="admin">Administrador</option>
              <option value="docente">Docente</option>
              <option value="preceptor">Preceptor</option>
              <option value="familia">Familia</option>
            </select>
          </div>

          {/* Combinamos tus clases utilitarias del index.css */}
          <button type="submit" className="btn btn-primary btn-login">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;