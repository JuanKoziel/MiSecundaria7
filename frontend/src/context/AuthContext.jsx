import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { login as apiLogin, logout as apiLogout, getMe, forgotPassword, resetPassword } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((data) => setUser({
        id: data.id ?? data.id_usuario,
        username: data.usuario,
        email: data.email ?? '',
        roles: data.rol_nombres ?? data.roles ?? [],
        role: (data.rol_nombres ?? data.roles ?? [])[0] ?? '',
        raw: data,
      }))
      .catch(() => {
        apiLogout();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (usuario, contrasena) => {
    const data = await apiLogin(usuario, contrasena);
    const roles = data.usuario?.rol_nombres ?? data.usuario?.roles ?? [];
    setUser({
      id: data.usuario?.id ?? data.usuario?.id_usuario,
      username: data.usuario?.usuario,
      roles,
      role: data.rol_actual || roles[0] || '',
      raw: data,
    });
    return data;
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (usuario) => forgotPassword(usuario), []);
  const confirmPasswordReset = useCallback(async (payload) => resetPassword(payload), []);

  const value = useMemo(() => ({ user, loading, login, logout, requestPasswordReset, confirmPasswordReset }), [user, loading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
