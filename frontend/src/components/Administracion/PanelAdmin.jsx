import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { formatDNI } from '../../utils/dni';

function StatCard({ icon, value, label, color }) {
  return (
    <div style={{
      background: 'var(--card-bg)',
      borderRadius: '8px',
      padding: '16px',
      textAlign: 'center',
      border: '1px solid var(--border-color)',
    }}>
      <i className={`fas ${icon}`} style={{ fontSize: '1.8rem', color: color || 'var(--primary-color)', marginBottom: '4px' }} aria-hidden="true" />
      <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '4px', color: color || 'inherit' }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
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
      <div className="card-header-flex" style={{ marginBottom: '20px' }}>
        <h3>{rolLabel === 'Director' ? 'Perfil del Director' : 'Perfil del Administrador'}</h3>
        <span className="badge badge-presente" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
          <i className="fas fa-check-circle" aria-hidden="true" /> Activo
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          borderLeft: '4px solid var(--primary-color)',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
            Nombre Completo
          </label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>
            {miDirectivo.apellido}, {miDirectivo.nombre}
          </p>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
            Documento (DNI)
          </label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{formatDNI(miDirectivo.dni)}</p>
        </div>
        {miDirectivo.telefono && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
              Teléfono de Contacto
            </label>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{miDirectivo.telefono}</p>
          </div>
        )}
        {miDirectivo.cargo && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
              Cargo
            </label>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{miDirectivo.cargo}</p>
          </div>
        )}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
            Usuario
          </label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>
            {user?.username || '—'}
          </p>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
            Rol
          </label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>
            {rolLabel}
          </p>
        </div>
      </div>

      <div
        style={{
          background: '#e8f5e9',
          borderLeft: '4px solid #2e7d32',
          borderRadius: '8px',
          padding: '14px 20px',
          marginBottom: '28px',
          fontSize: '0.9rem',
          color: '#1b5e20',
          lineHeight: '1.6',
        }}
      >
        <i className="fas fa-server" style={{ color: '#2e7d32', marginRight: '8px' }} aria-hidden="true" />
        Sistema operativo — todos los módulos funcionando con normalidad.
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <StatCard icon="fa-user-graduate" value={systemStats.alumnos} label="Alumnos" />
        <StatCard icon="fa-chalkboard-teacher" value={systemStats.docentes} label="Docentes" />
        <StatCard icon="fa-user-tie" value={systemStats.preceptores} label="Preceptores" />
        <StatCard icon="fa-users" value={systemStats.familias} label="Familias" />
        <StatCard icon="fa-school" value={systemStats.cursos} label="Cursos" />
        <StatCard icon="fa-book" value={systemStats.materias} label="Materias" />
        <StatCard icon="fa-folder-open" value={systemStats.proyectos} label="Proyectos" />
        <StatCard icon="fa-bullhorn" value={systemStats.comunicados} label="Comunicados" />
        <StatCard icon="fa-file-signature" value={systemStats.actas} label="Actas" />
      </div>

      <div
        style={{
          background: '#f0f4ff',
          borderLeft: '4px solid var(--primary-color)',
          borderRadius: '8px',
          padding: '14px 20px',
          fontSize: '0.9rem',
          color: '#444',
          lineHeight: '1.6',
        }}
      >
        <i className="fas fa-info-circle" style={{ color: 'var(--primary-color)', marginRight: '8px' }} aria-hidden="true" />
        Panel de administración general del sistema escolar. Desde aquí se gestionan usuarios, cursos, materias, configuraciones y toda la información institucional.
      </div>
    </div>
  );
}

export default PanelAdmin;
