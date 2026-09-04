import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  getMe,
  seleccionarRol as apiSeleccionarRol,
} from '../services/api';

const AuthContext = createContext(null);

const ROL_STORAGE_PREFIX = 'rol_activo_';

function buildUser(data, rolActivo) {
  const roles = Array.isArray(data.roles) ? data.roles : [];
  const perfil = data.perfil || {};
  return {
    id: data.id_usuario,
    id_usuario: data.id_usuario,
    username: data.usuario,
    roles,
    role: rolActivo || '',
    nombreCompleto: perfil.nombre_completo || null,
    nombre: perfil.nombre || null,
    apellido: perfil.apellido || null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [rolActivo, setRolActivo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Con un único rol se entra directo. Con varios se conserva el rol ya
  // elegido en esta sesión (si pertenece a los roles reales del usuario);
  // en cualquier otro caso el usuario debe elegir en el selector.
  const resolverRolInicial = useCallback((roles, username) => {
    if (roles.length === 1) return roles[0];
    if (roles.length > 1) {
      const guardado = sessionStorage.getItem(ROL_STORAGE_PREFIX + username);
      if (guardado && roles.includes(guardado)) return guardado;
    }
    return null;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((data) => {
        const roles = Array.isArray(data.roles) ? data.roles : [];
        const inicial = resolverRolInicial(roles, data.usuario);
        setUser(buildUser(data, inicial));
        setRolActivo(inicial);
      })
      .catch(() => {
        apiLogout();
        setUser(null);
        setRolActivo(null);
      })
      .finally(() => setLoading(false));
  }, [resolverRolInicial]);

  const login = useCallback(
    async (usuario, contrasena) => {
      const data = await apiLogin(usuario, contrasena);
      const roles = Array.isArray(data.roles) ? data.roles : [];
      const inicial = resolverRolInicial(roles, data.usuario);
      setUser(buildUser(data, inicial));
      setRolActivo(inicial);
      return data;
    },
    [resolverRolInicial],
  );

  const seleccionarRol = useCallback(
    async (rol) => {
      if (!user || !Array.isArray(user.roles) || !user.roles.includes(rol)) {
        throw new Error('El rol seleccionado no está asignado a tu usuario.');
      }
      // Validación en backend: rechaza roles que el usuario no posee.
      const data = await apiSeleccionarRol(rol);
      const roles = Array.isArray(data.roles) ? data.roles : [];
      setUser((prev) => ({ ...prev, roles, role: rol }));
      setRolActivo(rol);
      sessionStorage.setItem(ROL_STORAGE_PREFIX + user.username, rol);
      return data;
    },
    [user],
  );

  const cambiarRol = useCallback(() => {
    if (user) {
      sessionStorage.removeItem(ROL_STORAGE_PREFIX + user.username);
    }
    setRolActivo(null);
    setUser((prev) => (prev ? { ...prev, role: '' } : prev));
  }, [user]);

  const logout = useCallback(() => {
    if (user) {
      sessionStorage.removeItem(ROL_STORAGE_PREFIX + user.username);
    }
    apiLogout();
    setUser(null);
    setRolActivo(null);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        rolActivo,
        loading,
        login,
        seleccionarRol,
        cambiarRol,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
