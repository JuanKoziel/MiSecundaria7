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
      <div className="stat-card-label">
        {label}
      </div>
    </div>
  );
}

function PanelAdmin({ miDirectivo, user }) {
  const { alumnos, docentes, preceptores, padresTutores, cursosObj, materiasObj, planificaciones, comunicados, actas } = useData();

  const systemStats = useMemo(() => {
    if (!miDirectivo) return null;
    return {
      alumnos: (alumnos ?? []).length,
      docentes: (docentes ?? []).length,
      preceptores: (preceptores ?? []).length,
      familias: (padresTutores ?? []).length,
      cursos: (cursosObj ?? []).length,
      materias: (materiasObj ?? []).length,
      proyectos: (planificaciones ?? []).length,
      comunicados: (comunicados ?? []).length,
      actas: (actas ?? []).length,
    };
  }, [miDirectivo, alumnos, docentes, preceptores, padresTutores, cursosObj, materiasObj, planificaciones, comunicados, actas]);

  if (!miDirectivo) {
    return (
      <div className="card">
        <p className="empty-state-message">
          No se encontraron datos de perfil para este usuario.
        </p>
      </div>
    );
  }

  const rolLabel = user?.role === 'director' ? 'Director' : 'Administrador';

  return (
    <div className="card">
      <div className="card-header-flex card-header-flex--compact">
        <h3>{rolLabel === 'Director' ? 'Perfil del Director' : 'Perfil del Administrador'}</h3>
        <span className="badge badge-presente badge--header">
          <i className="fas fa-check-circle" aria-hidden="true" /> Activo
        </span>
      </div>

      <div className="profile-grid">
        <div>
          <label className="profile-label">Nombre Completo</label>
          <p className="profile-value">{miDirectivo.apellido}, {miDirectivo.nombre}</p>
        </div>
        <div>
          <label className="profile-label">Documento (DNI)</label>
          <p className="profile-value">{formatDNI(miDirectivo.dni)}</p>
        </div>
        {miDirectivo.telefono && (
          <div>
            <label className="profile-label">Teléfono de Contacto</label>
            <p className="profile-value">{miDirectivo.telefono}</p>
          </div>
        )}
        {miDirectivo.cargo && (
          <div>
            <label className="profile-label">Cargo</label>
            <p className="profile-value">{miDirectivo.cargo}</p>
          </div>
        )}
        <div>
          <label className="profile-label">Usuario</label>
          <p className="profile-value">{miDirectivo ? `${miDirectivo.apellido}, ${miDirectivo.nombre}` : (user?.username || '—')}</p>
        </div>
        <div>
          <label className="profile-label">Rol</label>
          <p className="profile-value">{rolLabel}</p>
        </div>
      </div>

      <div className="system-status">
        <i className="fas fa-server system-status-icon" aria-hidden="true" />
        Sistema operativo — todos los módulos funcionando con normalidad.
      </div>

      <div className="stats-grid">
        <StatCard icon="fa-user-graduate" value={systemStats.alumnos} label="Estudiantes" />
        <StatCard icon="fa-chalkboard-teacher" value={systemStats.docentes} label="Docentes" />
        <StatCard icon="fa-user-tie" value={systemStats.preceptores} label="Preceptores" />
        <StatCard icon="fa-users" value={systemStats.familias} label="Familias" />
        <StatCard icon="fa-school" value={systemStats.cursos} label="Cursos" />
        <StatCard icon="fa-book" value={systemStats.materias} label="Materias" />
        <StatCard icon="fa-folder-open" value={systemStats.proyectos} label="Proyectos" />
        <StatCard icon="fa-bullhorn" value={systemStats.comunicados} label="Comunicados" />
        <StatCard icon="fa-file-signature" value={systemStats.actas} label="Actas" />
      </div>

      <div className="info-box">
        <i className="fas fa-info-circle info-box-icon" aria-hidden="true" />
        Panel de administración general del sistema escolar. Desde aquí se gestionan usuarios, cursos, materias, configuraciones y toda la información institucional.
      </div>
    </div>
  );
}

export default PanelAdmin;
