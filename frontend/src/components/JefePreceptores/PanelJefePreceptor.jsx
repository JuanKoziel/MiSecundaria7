import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { formatDNI } from '../../utils/dni';

function StatCard({ icon, value, label, color }) {
  return (
    <div className="stat-card">
      <i className={`fas ${icon} stat-card-icon`} style={{ color: color || 'var(--primary-color)' }} aria-hidden="true" />
      <div className="stat-card-value" style={{ color: color || 'inherit' }}>
        {value ?? '—'}
      </div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return 'Nunca';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Nunca';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function PanelJefePreceptor({ miPreceptor }) {
  const { preceptores, alumnos, tutores, cursosObj, actas, comunicados } = useData();

  const stats = useMemo(() => {
    if (!miPreceptor) return null;
    const safePreceptores = preceptores ?? [];
    const safeAlumnos = alumnos ?? [];
    const safeTutores = tutores ?? [];
    const safeActas = actas ?? [];
    const safeComunicados = comunicados ?? [];
    return {
      totalPreceptores: safePreceptores.length,
      cursosSupervisados: (cursosObj || []).length,
      alumnosSupervisados: safeAlumnos.length,
      tutoresSupervisados: safeTutores.length,
      actasCreadas: safeActas.length,
      comunicadosEnviados: safeComunicados.length,
      ultimoAcceso: miPreceptor.usuario_fecha_ultimo_acceso || null,
      estado: miPreceptor.estado === false ? 'Inactivo' : 'Activo',
    };
  }, [miPreceptor, preceptores, alumnos, tutores, cursosObj, actas, comunicados]);

  if (!miPreceptor) {
    return (
      <div className="card">
        <p className="empty-state-message">
          No se encontró un perfil de jefe de preceptores vinculado a tu usuario.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header-flex card-header-flex--compact">
        <h3>Perfil del Jefe de Preceptores</h3>
        <span className="badge badge-presente badge--header">
          <i className="fas fa-check-circle" aria-hidden="true" /> Activo
        </span>
      </div>

      <div className="profile-grid">
        <div>
          <label className="profile-label">Nombre Completo</label>
          <p className="profile-value">{miPreceptor.apellido}, {miPreceptor.nombre}</p>
        </div>
        <div>
          <label className="profile-label">Documento (DNI)</label>
          <p className="profile-value">{formatDNI(miPreceptor.dni)}</p>
        </div>
        {miPreceptor.correo && (
          <div>
            <label className="profile-label">Correo Electrónico</label>
            <p className="profile-value--link">{miPreceptor.correo}</p>
          </div>
        )}
        {miPreceptor.telefono && (
          <div>
            <label className="profile-label">Teléfono de Contacto</label>
            <p className="profile-value">{miPreceptor.telefono}</p>
          </div>
        )}
        <div>
          <label className="profile-label">Rol</label>
          <p className="profile-value">Jefe de Preceptores</p>
        </div>
        <div>
          <label className="profile-label">Último Acceso</label>
          <p className="profile-value">{formatDateTime(stats.ultimoAcceso)}</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="fa-user-tie" value={stats.totalPreceptores} label="Preceptores admin" />
        <StatCard icon="fa-school" value={stats.cursosSupervisados} label="Cursos supervisados" />
        <StatCard icon="fa-users" value={stats.alumnosSupervisados} label="Alumnos supervisados" />
        <StatCard icon="fa-user-shield" value={stats.tutoresSupervisados} label="Tutores supervisados" />
        <StatCard icon="fa-file-alt" value={stats.actasCreadas} label="Actas creadas" />
        <StatCard icon="fa-bullhorn" value={stats.comunicadosEnviados} label="Comunicados enviados" />
        <StatCard
          icon={stats.estado === 'Activo' ? 'fa-check-circle' : 'fa-exclamation-circle'}
          value={stats.estado}
          label="Estado de la cuenta"
          color={stats.estado === 'Activo' ? '#15803d' : '#b91c1c'}
        />
      </div>

      <div className="info-box mb-28">
        <i className="fas fa-info-circle info-box-icon" aria-hidden="true" />
        Supervisor general de la actividad preceptoría. Gestiona preceptores, supervisa cursos, alumnos y tutores, y coordina la comunicación institucional.
      </div>
    </div>
  );
}

export default PanelJefePreceptor;
