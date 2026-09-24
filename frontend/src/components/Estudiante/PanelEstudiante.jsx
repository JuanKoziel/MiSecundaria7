import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { formatDNI } from '../../utils/dni';
import { cursoConOrientacion } from '../../utils/orientacion';
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

function PanelEstudiante({ miEstudiante, user, recursadas = [] }) {
  const { materiasPorCurso, calificacionesCompletas, asistenciasAdmin, periodos } = useData();

  const stats = useMemo(() => {
    if (!miEstudiante) return null;
    const safeCalificaciones = calificacionesCompletas ?? [];
    const safeAsistencias = asistenciasAdmin ?? [];
    const misNotas = safeCalificaciones.filter((c) => c.id_alumno === miEstudiante.id);
    const notasNumericas = misNotas
      .map((c) => Number(c.nota_numerica))
      .filter((n) => !isNaN(n) && n > 0);
    const promedio = notasNumericas.length > 0
      ? (notasNumericas.reduce((a, b) => a + b, 0) / notasNumericas.length).toFixed(1)
      : null;
    const inasistencias = safeAsistencias.filter(
      (a) => a.alumnoId === miEstudiante.id && a.estado === 'Ausente'
    ).length;

    let estadoAcademico = 'Sin calificaciones';
    if (notasNumericas.length > 0) {
      const avg = notasNumericas.reduce((a, b) => a + b, 0) / notasNumericas.length;
      if (avg >= 7) estadoAcademico = 'Promocionado';
      else if (avg >= 4) estadoAcademico = 'Regular';
      else estadoAcademico = 'En seguimiento';
    }

    return { promedio, inasistencias, estadoAcademico, notasCount: notasNumericas.length };
  }, [miEstudiante, calificacionesCompletas, asistenciasAdmin]);

  if (!miEstudiante) {
    return (
      <div className="card">
        <p className="empty-state-message">
          No se encontró un estudiante vinculado a tu usuario.
        </p>
      </div>
    );
  }

  const materiasDelCurso = materiasPorCurso[miEstudiante.curso] || [];

  return (
    <div className="card">
      <ProfileBanner
        icon="fa-user-graduate"
        nombre={`${miEstudiante.apellido}, ${miEstudiante.nombre}`}
        rol="Estudiante"
        estado="Activo"
      />

      <div className="profile-grid">
        <div>
          <label className="profile-label">Nombre Completo</label>
          <p className="profile-value">{miEstudiante.apellido}, {miEstudiante.nombre}</p>
        </div>
        <div>
          <label className="profile-label">Documento (DNI)</label>
          <p className="profile-value">{formatDNI(miEstudiante.dni)}</p>
        </div>
        {miEstudiante.telefono && (
          <div>
            <label className="profile-label">Teléfono de Contacto</label>
            <p className="profile-value">{miEstudiante.telefono}</p>
          </div>
        )}
        {miEstudiante.direccion && (
          <div>
            <label className="profile-label">Dirección</label>
            <p className="profile-value">{miEstudiante.direccion}</p>
          </div>
        )}
        {miEstudiante.fecha_nacimiento && (
          <div>
            <label className="profile-label">Fecha de Nacimiento</label>
            <p className="profile-value">{miEstudiante.fecha_nacimiento}</p>
          </div>
        )}
        <div>
          <label className="profile-label">Usuario</label>
          <p className="profile-value">{miEstudiante.usuario}</p>
        </div>
        <div>
          <label className="profile-label">Rol</label>
          <p className="profile-value">Estudiante</p>
        </div>
      </div>

      <div className="stats-grid">
        {miEstudiante.curso && <StatCard icon="fa-users" value={cursoConOrientacion(miEstudiante.curso)} label="Curso actual" />}
        <StatCard icon="fa-calendar" value={miEstudiante.ciclo_anio || '—'} label="Ciclo lectivo" />
        <StatCard icon="fa-book" value={materiasDelCurso.length} label="Materias" />
        {stats.notasCount >= 3 && <StatCard icon="fa-star" value={stats.promedio} label="Promedio general" />}
        <StatCard icon="fa-calendar-times" value={stats.inasistencias} label="Inasistencias" color={stats.inasistencias > 10 ? '#b91c1c' : stats.inasistencias > 5 ? '#e65100' : '#15803d'} />
      </div>

      {recursadas && recursadas.length > 0 && (
      <>
        <div className="card-header-flex">
          <h4 className="preceptor-section-title"><i className="fas fa-redo" aria-hidden="true" /> Cursando (Recursada)</h4>
        </div>

        <div className="table-responsive mt-10">
          <table>
            <thead>
              <tr>
                <th className="text-left">Curso / División</th>
                <th>Año Lectivo</th>
              </tr>
            </thead>
            <tbody>
              {recursadas.map((r) => (
                <tr key={r.id_curso || r.id || r.curso}>
                  <td className="text-left font-bold">
                    <i className="fas fa-users icon-muted" aria-hidden="true" />
                    {r.curso || r.curso_nombre || 'Curso en recursada'}
                  </td>
                  <td className="text-muted">{r.ciclo_anio || r.anio || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )}
    </div>
  );
}

export default PanelEstudiante;
