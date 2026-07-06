import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { formatDNI } from '../../utils/dni';
import { cursoConOrientacion } from '../../utils/orientacion';

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

function PanelAlumno({ miAlumno, user }) {
  const { materiasPorCurso, calificacionesCompletas, asistenciasAdmin, periodos } = useData();

  const stats = useMemo(() => {
    if (!miAlumno) return null;
    const safeCalificaciones = calificacionesCompletas ?? [];
    const safeAsistencias = asistenciasAdmin ?? [];
    const misNotas = safeCalificaciones.filter((c) => c.id_alumno === miAlumno.id);
    const notasNumericas = misNotas
      .map((c) => Number(c.nota_numerica))
      .filter((n) => !isNaN(n) && n > 0);
    const promedio = notasNumericas.length > 0
      ? (notasNumericas.reduce((a, b) => a + b, 0) / notasNumericas.length).toFixed(1)
      : null;
    const inasistencias = safeAsistencias.filter(
      (a) => a.alumnoId === miAlumno.id && a.estado === 'Ausente'
    ).length;

    let estadoAcademico = 'Sin calificaciones';
    if (notasNumericas.length > 0) {
      const avg = notasNumericas.reduce((a, b) => a + b, 0) / notasNumericas.length;
      if (avg >= 7) estadoAcademico = 'Promocionado';
      else if (avg >= 4) estadoAcademico = 'Regular';
      else estadoAcademico = 'En seguimiento';
    }

    return { promedio, inasistencias, estadoAcademico };
  }, [miAlumno, calificacionesCompletas, asistenciasAdmin]);

  if (!miAlumno) {
    return (
      <div className="card">
        <p className="empty-state-message">
          No se encontró un alumno vinculado a tu usuario.
        </p>
      </div>
    );
  }

  const division = miAlumno.curso ? miAlumno.curso.split('°')[1] || '' : '';
  const materiasDelCurso = materiasPorCurso[miAlumno.curso] || [];

  return (
    <div className="card">
      <div className="card-header-flex" style={{ marginBottom: '20px' }}>
        <h3>Perfil del Alumno</h3>
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
            {miAlumno.apellido}, {miAlumno.nombre}
          </p>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
            Documento (DNI)
          </label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{formatDNI(miAlumno.dni)}</p>
        </div>
        {miAlumno.telefono && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
              Teléfono de Contacto
            </label>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{miAlumno.telefono}</p>
          </div>
        )}
        {miAlumno.direccion && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
              Dirección
            </label>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{miAlumno.direccion}</p>
          </div>
        )}
        {miAlumno.fecha_nacimiento && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
              Fecha de Nacimiento
            </label>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>
              {miAlumno.fecha_nacimiento}
            </p>
          </div>
        )}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
            Usuario
          </label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>
            {miAlumno.usuario}
          </p>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
            Rol
          </label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>
            Alumno
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {miAlumno.curso && <StatCard icon="fa-users" value={cursoConOrientacion(miAlumno.curso)} label="Curso actual" />}
        <StatCard icon="fa-layer-group" value={division || '—'} label="División" />
        <StatCard icon="fa-calendar" value={miAlumno.ciclo_anio || '—'} label="Ciclo lectivo" />
        <StatCard icon="fa-book" value={materiasDelCurso.length} label="Materias" />
        <StatCard icon="fa-star" value={stats.promedio ?? 'Sin info'} label="Promedio general" />
        <StatCard icon="fa-calendar-times" value={stats.inasistencias} label="Inasistencias" color={stats.inasistencias > 10 ? '#b91c1c' : stats.inasistencias > 5 ? '#e65100' : '#15803d'} />
        <StatCard
          icon={stats.estadoAcademico === 'Promocionado' ? 'fa-check-circle' : stats.estadoAcademico === 'Regular' ? 'fa-minus-circle' : stats.estadoAcademico === 'En seguimiento' ? 'fa-exclamation-circle' : 'fa-question-circle'}
          value={stats.estadoAcademico}
          label="Estado académico"
          color={stats.estadoAcademico === 'Promocionado' ? '#15803d' : stats.estadoAcademico === 'Regular' ? '#e65100' : '#b91c1c'}
        />
      </div>

      <div
        style={{
          background: '#f0f4ff',
          borderLeft: '4px solid var(--primary-color)',
          borderRadius: '8px',
          padding: '14px 20px',
          marginBottom: '28px',
          fontSize: '0.9rem',
          color: '#444',
          lineHeight: '1.6',
        }}
      >
        <i className="fas fa-info-circle" style={{ color: 'var(--primary-color)', marginRight: '8px' }} aria-hidden="true" />
        Desde este perfil puede consultar calificaciones, asistencias, horarios, comunicados y toda su información académica.
      </div>

      <div className="card-header-flex">
        <h4>Cursando</h4>
      </div>

      <div className="table-responsive" style={{ marginTop: '10px' }}>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', paddingLeft: '15px' }}>Curso / División</th>
              <th>Año Lectivo</th>
            </tr>
          </thead>
          <tbody>
            {miAlumno.curso ? (
              <tr>
                <td style={{ textAlign: 'left', paddingLeft: '15px', fontWeight: '600' }}>
                  <i className="fas fa-users" style={{ color: '#888', marginRight: '8px' }} aria-hidden="true" />
                  {cursoConOrientacion(miAlumno.curso)}
                </td>
                <td style={{ color: '#555' }}>{miAlumno.ciclo_anio || '—'}</td>
              </tr>
            ) : (
              <tr>
                <td colSpan={2} className="empty-state-message">
                  No está asignado a ningún curso.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PanelAlumno;
