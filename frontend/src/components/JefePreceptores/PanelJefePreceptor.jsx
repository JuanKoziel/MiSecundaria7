import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { formatDNI } from '../../utils/dni';
import ProfileBanner from '../Shared/ProfileBanner';

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
      <ProfileBanner
        icon="fa-user-tie"
        nombre={`${miPreceptor.apellido}, ${miPreceptor.nombre}`}
        rol="Jefe de Preceptores"
        estado={stats.estado}
      />

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
        <StatCard icon="fa-users" value={stats.alumnosSupervisados} label="Estudiantes supervisados" />
        <StatCard icon="fa-user-shield" value={stats.tutoresSupervisados} label="Tutores supervisados" />
        <StatCard icon="fa-file-alt" value={stats.actasCreadas} label="Actas creadas" />
        <StatCard icon="fa-bullhorn" value={stats.comunicadosEnviados} label="Comunicados enviados" />
      </div>
    </div>
  );
}

export default PanelJefePreceptor;
