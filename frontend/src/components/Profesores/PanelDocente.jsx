import { useRef, useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { uploadMiDdjjDocente, BASE_URL } from '../../services/api';
import { formatDNI } from '../../utils/dni';
import { useToast } from '../../context/ToastContext';
import ProfileBanner from '../Shared/ProfileBanner';
import { mensajeErrorAmigable } from '../../utils/errores';

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
  return mensajeErrorAmigable(err);
}

function PanelDocente({ miDocente, mapSuplencias }) {
  const { cursoMateria, cursosObj, alumnos, planificaciones, actasDocente, refreshData } = useData();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [mensaje, setMensaje] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const MEDIA_BASE = BASE_URL;

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
  const ddjjVerificada = ddjjPresentada && Boolean(miDocente.ddjj_verificada);
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
      <ProfileBanner
        icon="fa-chalkboard-teacher"
        nombre={`${miDocente.apellido}, ${miDocente.nombre}`}
        rol="Docente"
        estado={stats.estado}
      />

      <div className="profile-grid">
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
        <StatCard icon="fa-users" value={stats.alumnos} label="Estudiantes a cargo" />
        <StatCard icon="fa-folder-open" value={stats.proyectos} label="Proyectos creados" />
        <StatCard icon="fa-file-signature" value={stats.actas} label="Actas realizadas" />
      </div>

      <div className="card ddjj-card mb-28" style={{ borderLeft: ddjjVerificada ? '4px solid #15803d' : ddjjPresentada ? '4px solid #b45309' : '4px solid #b91c1c' }}>
        <div className="card-header-flex card-header-flex--compact">
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className={`ddjj-icon-wrapper ${ddjjPresentada ? 'ddjj-presentada' : 'ddjj-pendiente'}`}>
              <i className="fas fa-file-signature" aria-hidden="true" />
            </div>
            <span>Declaración Jurada (D.D.J.J.)</span>
          </h4>
        </div>

        <div className="ddjj-content">
          {!ddjjPresentada ? (
            <div className="ddjj-upload-section">
              <div className="ddjj-upload-icon">
                <i className="fas fa-file-upload" aria-hidden="true" />
              </div>
              <h5 className="ddjj-upload-title">Cargar Declaración Jurada</h5>
              <p className="ddjj-upload-text">Seleccioná el archivo PDF de tu D.D.J.J. para presentarla oficialmente.</p>
              <div className="ddjj-upload-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={subiendo}
                >
                  <i className="fas fa-file-upload" aria-hidden="true" /> {subiendo ? 'Subiendo...' : 'Seleccionar y Subir Archivo'}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  handleSubir(file);
                  e.target.value = '';
                }}
              />
            </div>
          ) : (
            <div className="ddjj-presentada-section">
              <div className="ddjj-presentada-header">
                <div className="ddjj-presentada-icon">
                  <i className={`fas ${ddjjVerificada ? 'fa-circle-check' : 'fa-check-circle'}`} aria-hidden="true" />
                </div>
                <div>
                  <h5 className="ddjj-presentada-title">
                    {ddjjVerificada ? 'D.D.J.J. Verificada por el Directivo' : 'D.D.J.J. Presentada Correctamente'}
                  </h5>
                  <p className="ddjj-presentada-subtitle">
                    {ddjjVerificada
                      ? 'Tu declaración jurada fue presentada y verificada por la institución.'
                      : 'Tu declaración jurada fue recibida y registrada en el sistema. Aún está pendiente de verificación.'}
                  </p>
                </div>
              </div>
              <div className="ddjj-presentada-actions">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => window.open(archivoHref, '_blank', 'noopener,noreferrer')}
                  disabled={!archivoHref}
                >
                  <i className="fas fa-eye" aria-hidden="true" /> Ver Archivo
                </button>
              </div>
            </div>
          )}

          <div className="ddjj-info-grid">
            <div className={`ddjj-info-item ${ddjjVerificada ? 'success' : ddjjPresentada ? 'warning' : 'warning'}`}>
              <span className="ddjj-info-label">Estado</span>
              <span className="ddjj-info-value">
                <i className={`fas ${ddjjVerificada ? 'fa-circle-check' : ddjjPresentada ? 'fa-check-circle' : 'fa-clock'}`} aria-hidden="true" />
                {ddjjVerificada ? 'Verificada' : ddjjPresentada ? 'Presentada (pendiente de verificación)' : 'Pendiente de presentación'}
              </span>
            </div>
            <div className="ddjj-info-item">
              <span className="ddjj-info-label">Fecha de carga</span>
              <span className="ddjj-info-value">{fechaCarga || '—'}</span>
            </div>
            <div className="ddjj-info-item">
              <span className="ddjj-info-label">Archivo</span>
              <span className="ddjj-info-value">{nombreArchivo || '—'}</span>
            </div>
          </div>

          {mensaje && (
            <div className={`ddjj-message ${mensaje.startsWith('Error') ? 'error' : 'success'}`}>
              <i className={`fas ${mensaje.startsWith('Error') ? 'fa-exclamation-circle' : 'fa-check-circle'}`} aria-hidden="true" />
              {mensaje}
            </div>
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
