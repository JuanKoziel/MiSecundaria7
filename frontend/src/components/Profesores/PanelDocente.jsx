import { useRef, useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { uploadMiDdjjDocente } from '../../services/api';
import { formatDNI } from '../../utils/dni';
import { useToast } from '../../context/ToastContext';

function StatCard({ icon, value, label, color }) {
  return (
    <div className="stat-card">
      <i className={`fas ${icon} stat-card-icon`} style={{ color: color || 'var(--primary-color)' }} aria-hidden="true" />
      <div className="stat-card-value" style={{ color: color || 'inherit' }}>
        {value ?? '—'}
      </div>
      <div className="stat-card-label">
        {label}
      </div>
    </div>
  );
}

function obtenerMensajeApi(err) {
  const data = err?.response?.data;
  if (!data) {
    return err?.message || 'Error al cargar DDJJ.';
  }
  if (typeof data === 'string') {
    return data;
  }
  if (data.error) {
    return data.error;
  }
  if (data.detail) {
    return data.detail;
  }
  const entries = Object.entries(data);
  if (entries.length > 0) {
    return entries
      .map(([campo, valor]) => {
        if (Array.isArray(valor)) {
          return `${campo}: ${valor.join(' ')}`;
        }
        if (valor && typeof valor === 'object') {
          return `${campo}: ${JSON.stringify(valor)}`;
        }
        return `${campo}: ${String(valor)}`;
      })
      .join(' | ');
  }
  return 'Error al cargar DDJJ.';
}

function PanelDocente({ miDocente, mapSuplencias }) {
  const { cursoMateria, cursosObj, alumnos, planificaciones, actasDocente, refreshData } = useData();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [mensaje, setMensaje] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const MEDIA_BASE = 'http://localhost:8000';

  const stats = useMemo(() => {
    if (!miDocente) return null;
    const safeCursoMateria = cursoMateria ?? [];
    const safeAlumnos = alumnos ?? [];
    const safePlanificaciones = planificaciones ?? [];
    const safeActasDocente = actasDocente ?? [];
    const misAsigs = safeCursoMateria.filter((cm) => {
      const s = mapSuplencias?.[cm.id];
      if (cm.id_docente === miDocente.id) return true;
      return Boolean(s && s.id_docente_suplente === miDocente.id);
    });
    const cursoIds = [...new Set(misAsigs.map((cm) => cm.id_curso).filter(Boolean))];
    return {
      materias: [...new Set(misAsigs.map((cm) => cm.materia_nombre).filter(Boolean))].length,
      cursos: [...new Set(misAsigs.map((cm) => cm.curso_nombre).filter(Boolean))].length,
      alumnos: safeAlumnos.filter((a) => cursoIds.includes(a.id_curso)).length,
      proyectos: safePlanificaciones.filter((p) => p.id_docente === miDocente.id).length,
      actas: safeActasDocente.filter((ad) => ad.docenteId === miDocente.id).length,
      estado: miDocente.usuario_estado === false ? 'Inactivo' : 'Activo',
    };
  }, [miDocente, cursoMateria, alumnos, planificaciones, actasDocente, mapSuplencias]);

  if (!miDocente) {
    return (
      <div className="card">
        <p className="empty-state-message">
          No se encontró un perfil de docente vinculado a tu usuario.
        </p>
      </div>
    );
  }

  const misAsignaciones = cursoMateria
    .filter((cm) => {
      const s = mapSuplencias?.[cm.id];
      if (cm.id_docente === miDocente.id) return true;
      return Boolean(s && s.id_docente_suplente === miDocente.id);
    })
    .map((cm) => {
      const s = mapSuplencias?.[cm.id];
      const cObj = cursosObj.find((c) => c.id_curso === cm.id_curso);
      return {
        id: cm.id,
        curso: cm.curso_nombre || '',
        materia: cm.materia_nombre || '',
        anio: cObj?.ciclo_anio || '',
        esSuplente: Boolean(s && s.id_docente_suplente === miDocente.id),
        suplenteNombre: s?.suplente_nombre || null,
      };
    });

  const ddjjPresentada = Boolean(miDocente.ddjj_presentada || miDocente.ddjj_id || miDocente.ruta_ddjj);
  const archivoUrl = miDocente.ddjj_url || miDocente.ruta_ddjj || null;
  const archivoHref = archivoUrl
    ? (archivoUrl.startsWith('http') ? archivoUrl : `${MEDIA_BASE}${archivoUrl}`)
    : null;
  const nombreArchivo = miDocente.ddjj_nombre_archivo || (archivoUrl ? archivoUrl.split('/').pop() : null);
  const fechaCarga = miDocente.ddjj_fecha_carga
    ? new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(miDocente.ddjj_fecha_carga))
    : null;

  const handleSubir = async (file) => {
    if (!file) return;
    setMensaje('');
    setSubiendo(true);
    try {
      await uploadMiDdjjDocente(file);
      toast.success('DDJJ cargada correctamente.');
      await refreshData();
    } catch (err) {
      toast.error(obtenerMensajeApi(err));
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header-flex card-header-flex--compact">
        <h3>Perfil del Docente</h3>
        <span className="badge badge-presente badge--header">
          <i className="fas fa-check-circle" aria-hidden="true" /> Activo
        </span>
      </div>

      <div className="profile-grid" style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          borderLeft: '4px solid var(--primary-color)',
        }}>
        <div>
          <label className="profile-label">
            Nombre Completo
          </label>
          <p className="profile-value">
            {miDocente.apellido}, {miDocente.nombre}
          </p>
        </div>
        <div>
          <label className="profile-label">
            Documento (DNI)
          </label>
          <p className="profile-value">{formatDNI(miDocente.dni)}</p>
        </div>
        {miDocente.correo && (
          <div>
            <label className="profile-label">
              Correo Electrónico
            </label>
            <p className="profile-value--link">
              {miDocente.correo}
            </p>
          </div>
        )}
        {miDocente.telefono && (
          <div>
            <label className="profile-label">
              Teléfono de Contacto
            </label>
            <p className="profile-value">{miDocente.telefono}</p>
          </div>
        )}
      </div>

      <div className="stats-grid">
        <StatCard icon="fa-book" value={stats.materias} label="Materias asignadas" />
        <StatCard icon="fa-school" value={stats.cursos} label="Cursos a cargo" />
        <StatCard icon="fa-users" value={stats.alumnos} label="Alumnos a cargo" />
        <StatCard icon="fa-folder-open" value={stats.proyectos} label="Proyectos creados" />
        <StatCard icon="fa-file-signature" value={stats.actas} label="Actas realizadas" />
        <StatCard icon="fa-clock" value="—" label="Último ingreso" />
        <StatCard
          icon={stats.estado === 'Activo' ? 'fa-check-circle' : 'fa-exclamation-circle'}
          value={stats.estado}
          label="Estado de la cuenta"
          color={stats.estado === 'Activo' ? '#15803d' : '#b91c1c'}
        />
      </div>

      <div className="info-box">
        <i className="fas fa-info-circle info-box-icon" aria-hidden="true" />
        Desde este panel puede administrar calificaciones, asistencias, proyectos, actas y el seguimiento académico de sus cursos.
      </div>

      <div className="flex-row--center mb-28">
        <div className="text-center"
          style={{
            width: '100%',
            maxWidth: '720px',
            padding: '18px',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            background: 'var(--card-bg)',
          }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${ddjjPresentada ? 'btn-success' : 'btn-danger'}`}
              onClick={() => {
                if (!ddjjPresentada) {
                  fileInputRef.current?.click();
                }
              }}
              disabled={subiendo || ddjjPresentada}
            >
              <i className="fas fa-file-upload" aria-hidden="true" /> {ddjjPresentada ? 'D.D.J.J. presentada' : 'D.D.J.J. pendiente'}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => window.open(archivoHref, '_blank', 'noopener,noreferrer')}
              disabled={!archivoHref}
            >
              <i className="fas fa-eye" aria-hidden="true" /> Ver archivo
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              handleSubir(file);
              e.target.value = '';
            }}
          />

          <p className="m-0 mt-10 font-bold">
            Estado: {ddjjPresentada ? 'D.D.J.J. presentada' : 'D.D.J.J. pendiente'}
          </p>
          <p style={{ margin: '6px 0 0' }}>
            Fecha de carga: {fechaCarga || '—'}
          </p>
          <p style={{ margin: '6px 0 0' }}>
            Archivo: {nombreArchivo || '—'}
          </p>
          {mensaje && (
            <p className="m-0 mt-10" style={{ color: mensaje.startsWith('Error') ? '#b91c1c' : '#15803d' }}>
              {mensaje}
            </p>
          )}
        </div>
      </div>

      <div className="card-header-flex">
        <h4>Materias y Cursos Asignados</h4>
      </div>

      <div className="table-responsive mt-10">
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', paddingLeft: '15px' }}>Curso / División</th>
              <th style={{ textAlign: 'left', paddingLeft: '15px' }}>Materia Dictada</th>
              <th>Año Lectivo</th>
            </tr>
          </thead>
          <tbody>
            {misAsignaciones.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-state-message">
                  No hay asignaciones registradas.
                </td>
              </tr>
            ) : (
              misAsignaciones.map((item) => (
                <tr key={item.id}>
                  <td className="font-bold" style={{ textAlign: 'left', paddingLeft: '15px' }}>
                    <i className="fas fa-users icon-muted" aria-hidden="true" />
                    {item.curso}
                  </td>
                  <td style={{ textAlign: 'left', paddingLeft: '15px' }}>
                    <i className="fas fa-book icon-primary" aria-hidden="true" />
                    {item.materia}
                    {item.esSuplente && (
                      <span className="badge badge-warning" style={{ marginLeft: '8px' }}>Suplencia</span>
                    )}
                  </td>
                  <td style={{ color: '#555' }}>{item.anio}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PanelDocente;
