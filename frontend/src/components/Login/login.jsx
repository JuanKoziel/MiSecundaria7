import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

function Login() {
  const { login, requestPasswordReset, confirmPasswordReset } = useAuth();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setMessage('');
    setError('');
    setNewPassword('');
    setConfirmPassword('');
    setToken('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await login(username, password);
      setMessage('Sesión iniciada correctamente.');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const data = await requestPasswordReset(username || 'admin');
      setToken(data.token || '');
      setMessage(data.mensaje || 'Token generado correctamente.');
      setMode('reset');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo generar el token.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const data = await confirmPasswordReset({ usuario: username, token, nueva_contrasena: newPassword, confirmar_contrasena: confirmPassword });
      setMessage(data.mensaje || 'Contraseña actualizada.');
      setMode('login');
      setToken('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#0f172a_0%,#111827_45%,#1f2937_100%)] px-4 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col items-center justify-center gap-8 lg:flex-row">
        <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl lg:p-10">
          <p className="text-sm uppercase tracking-[0.35em] text-orange-300">MiSecundaria 7</p>
          <h1 className="mt-3 text-4xl font-semibold">Acceso seguro para estudiantes, docentes y familias</h1>
          <p className="mt-4 text-slate-200">Inicia sesión con tu usuario y contraseña, o recupera el acceso si lo olvidaste. El flujo se integra con la API real del backend.</p>
        </section>

        <section className="w-full max-w-md rounded-3xl bg-white p-8 text-slate-800 shadow-2xl">
          <div className="flex items-center gap-2 text-sm">
            <button type="button" onClick={() => { setMode('login'); resetForm(); }} className={`rounded-full px-3 py-1 ${mode === 'login' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>Login</button>
            <button type="button" onClick={() => { setMode('recover'); resetForm(); }} className={`rounded-full px-3 py-1 ${mode === 'recover' || mode === 'reset' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>Recuperar</button>
          </div>

          {message && <div className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
          {error && <div className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

          {mode === 'login' && (
            <form className="mt-6 space-y-4" onSubmit={handleLogin}>
              <label className="block text-sm font-medium">Usuario</label>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="admin, prof_juan..." />
              <label className="block text-sm font-medium">Contraseña</label>
              <input type="password" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-orange-500 px-4 py-3 font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70">{loading ? 'Ingresando...' : 'Ingresar'}</button>
            </form>
          )}

          {(mode === 'recover' || mode === 'reset') && (
            <form className="mt-6 space-y-4" onSubmit={mode === 'recover' ? handleRecover : handleReset}>
              <label className="block text-sm font-medium">Usuario</label>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Tu nombre de usuario" />
              {mode === 'reset' && (
                <>
                  <label className="block text-sm font-medium">Token de recuperación</label>
                  <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" value={token} onChange={(e) => setToken(e.target.value)} required placeholder="Pegá el token recibido" />
                  <label className="block text-sm font-medium">Nueva contraseña</label>
                  <input type="password" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  <label className="block text-sm font-medium">Confirmar contraseña</label>
                  <input type="password" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </>
              )}
              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70">{mode === 'recover' ? 'Generar token' : 'Restablecer contraseña'}</button>
            </form>
          )}

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Usuarios demo</p>
            <p className="mt-1">admin / admin123 • prof_juan / docente123 • familia_anna / familia123</p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;
