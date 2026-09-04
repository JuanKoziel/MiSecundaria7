import { useEffect, useState } from 'react';
import { getHistorialCambios, getTiposAccion, getUsuarios } from '../../services/api';
import LoadingSpinner from '../Shared/LoadingSpinner';

const TABLAS = [
  { value: 'alumnos', label: 'Estudiantes' },
  { value: 'tutores', label: 'Tutores' },
  { value: 'docentes', label: 'Docentes' },
  { value: 'preceptores', label: 'Preceptores' },
  { value: 'jefes_preceptores', label: 'Jefes de Preceptores' },
  { value: 'directores', label: 'Directores' },
  { value: 'usuarios', label: 'Usuarios' },
  { value: 'comunicados', label: 'Comunicados' },
  { value: 'actas', label: 'Actas' },
  { value: 'diagnosticos', label: 'Diagnósticos' },
  { value: 'cursos', label: 'Cursos' },
  { value: 'materias', label: 'Materias' },
  { value: 'asignaciones_cursos', label: 'Asignaciones de Cursos' },
  { value: 'eventos_institucionales', label: 'Eventos Institucionales' },
];

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'director', label: 'Director' },
  { value: 'jefe_preceptores', label: 'Jefe de Preceptores' },
  { value: 'preceptor', label: 'Preceptor' },
  { value: 'docente', label: 'Docente' },
  { value: 'alumno', label: 'Estudiante' },
  { value: 'familia', label: 'Familia' },
];

const FILTROS_VACIOS = {
  fecha_desde: '',
  fecha_hasta: '',
  usuario_id: '',
  rol: '',
  accion: '',
  tabla: '',
};

function Historial({ ocultarRegistro = false }) {
  const [registros, setRegistros] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [acciones, setAcciones] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getUsuarios().then(setUsuarios).catch(() => setUsuarios([]));
    getTiposAccion().then(setAcciones).catch(() => setAcciones([]));
  }, []);

  const cargar = async (params = filtros) => {
    setCargando(true);
    setError('');
    try {
      const data = await getHistorialCambios(params);
      setRegistros(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Error al cargar el historial');
      setRegistros([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar(FILTROS_VACIOS);
  }, []);

  const cambiarFiltro = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const aplicarFiltros = (e) => {
    e.preventDefault();
    const params = {};
    Object.entries(filtros).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) params[k] = v;
    });
    cargar(params);
  };

  const limpiarFiltros = () => {
    setFiltros(FILTROS_VACIOS);
    cargar(FILTROS_VACIOS);
  };

  const filtrar = (campo, valor) => {
    cambiarFiltro(campo, valor);
    const params = { ...filtros, [campo]: valor };
    Object.keys(params).forEach((k) => {
      if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k];
    });
    cargar(params);
  };

  const nombreUsuario = (id) => {
    const u = usuarios.find((us) => us.id_usuario === id);
    if (!u) return `#${id}`;
    // Si el usuario tiene nombre y apellido (vienen del serializer de Usuarios), usarlos
    if (u.nombre && u.apellido) return `${u.apellido}, ${u.nombre}`;
    // Fallback al username
    return u.usuario;
  };

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}

      <form className="filtros-historial" onSubmit={aplicarFiltros}>
        <div className="form-group-filter">
          <label htmlFor="hist-desde">Desde</label>
          <input id="hist-desde" type="date" value={filtros.fecha_desde} onChange={(e) => cambiarFiltro('fecha_desde', e.target.value)} />
        </div>
        <div className="form-group-filter">
          <label htmlFor="hist-hasta">Hasta</label>
          <input id="hist-hasta" type="date" value={filtros.fecha_hasta} onChange={(e) => cambiarFiltro('fecha_hasta', e.target.value)} />
        </div>
        <div className="form-group-filter">
          <label htmlFor="hist-usuario">Usuario</label>
          <select id="hist-usuario" value={filtros.usuario_id} onChange={(e) => filtrar('usuario_id', e.target.value)}>
            <option value="">Todos</option>
            {usuarios.map((u) => (
              <option key={u.id_usuario} value={u.id_usuario}>{u.usuario}</option>
            ))}
          </select>
        </div>
        <div className="form-group-filter">
          <label htmlFor="hist-rol">Rol</label>
          <select id="hist-rol" value={filtros.rol} onChange={(e) => filtrar('rol', e.target.value)}>
            <option value="">Todos</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group-filter">
          <label htmlFor="hist-accion">Acción</label>
          <select id="hist-accion" value={filtros.accion} onChange={(e) => filtrar('accion', e.target.value)}>
            <option value="">Todas</option>
            {acciones.map((a) => (
              <option key={a.id_tipo_accion} value={a.nombre_accion}>{a.nombre_accion}</option>
            ))}
          </select>
        </div>
        <div className="form-group-filter">
          <label htmlFor="hist-tabla">Módulo</label>
          <select id="hist-tabla" value={filtros.tabla} onChange={(e) => filtrar('tabla', e.target.value)}>
            <option value="">Todos</option>
            {TABLAS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="filtros-historial-acciones">
          <button type="submit" className="btn btn-primary">
            <i className="fas fa-search" aria-hidden="true" /> Aplicar
          </button>
          <button type="button" className="btn btn-secondary" onClick={limpiarFiltros}>
            <i className="fas fa-eraser" aria-hidden="true" /> Limpiar
          </button>
        </div>
      </form>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Acción</th>
              <th>Módulo</th>
              {!ocultarRegistro && <th>Registro</th>}
              <th>Valor anterior</th>
              <th>Valor nuevo</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={ocultarRegistro ? 7 : 8} className="empty-state-message"><LoadingSpinner text="Cargando historial..." size="sm" inline /></td></tr>
            ) : registros.length === 0 ? (
              <tr><td colSpan={ocultarRegistro ? 7 : 8} className="empty-state-message">No hay registros de historial.</td></tr>
            ) : (
              registros.map((h) => (
                <tr key={h.id_historial}>
                  <td className="nowrap">{h.fecha_formateada || h.fecha}</td>
                  <td>{h.usuario_nombre || nombreUsuario(h.id_usuario)}</td>
                  <td>
                    {(h.roles_usuario || []).length > 0
                      ? h.roles_usuario.map((r) => {
                          const rol = ROLES.find((x) => x.value === r);
                          return <span key={r} className="badge badge-neutral" style={{ marginRight: 4 }}>{rol ? rol.label : r}</span>;
                        })
                      : '-'}
                  </td>
                  <td><span className="badge badge-neutral">{h.accion}</span></td>
                  <td>{h.tabla_label || h.tabla_modificada}</td>
                  {!ocultarRegistro && <td>{h.id_registro}</td>}
                  <td className="historial-valor">{h.valor_anterior || '-'}</td>
                  <td className="historial-valor">{h.valor_nuevo || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Historial;
