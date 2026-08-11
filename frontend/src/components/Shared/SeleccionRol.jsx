import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Logo from './Logo';
import { getRoleInfo } from '../../utils/roles';

function SeleccionRol() {
  const { user, seleccionarRol, logout } = useAuth();
  const toast = useToast();
  const [cargando, setCargando] = useState('');

  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const sinRoles = roles.length === 0;

  const handleSeleccionar = async (rol) => {
    setCargando(rol);
    try {
      await seleccionarRol(rol);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        'No se pudo seleccionar el rol.';
      toast.error(msg);
    } finally {
      setCargando('');
    }
  };

  if (sinRoles) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ maxWidth: '460px', textAlign: 'center' }}>
          <div className="login-icon">
            <Logo />
          </div>
          <h2>MiSecundaria 7</h2>
          <p>Hola, {user?.username}</p>
          <div className="rol-sin-roles">
            Tu usuario no tiene ningún rol asignado.
            <br />
            Contactá al administrador.
          </div>
          <button type="button" className="btn btn-primary" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card rol-selector-card">
        <div className="login-icon">
          <Logo />
        </div>
        <h2>Seleccioná tu perfil</h2>
        <p className="rol-selector-saludo">
          Hola, {user?.username}. ¿Con qué perfil querés ingresar?
        </p>

        <div className="rol-selector-grid">
          {roles.map((rol) => {
            const info = getRoleInfo(rol);
            return (
              <button
                key={rol}
                type="button"
                className="rol-selector-card-item"
                onClick={() => handleSeleccionar(rol)}
                disabled={cargando !== ''}
              >
                <span className="rol-selector-icon">
                  <i className={`fas ${info.icon}`} aria-hidden="true" />
                </span>
                <span className="rol-selector-label">{info.label}</span>
                <span className="rol-selector-cta">
                  {cargando === rol ? 'Ingresando...' : 'Ingresar como'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rol-selector-logout">
          <button type="button" className="btn btn-secondary" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default SeleccionRol;
