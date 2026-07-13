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

function PanelPreceptor({ miPreceptor }) {
  const { cursosObj, alumnos, comunicados, diagnosticos } = useData();

  const stats = useMemo(() => {
    if (!miPreceptor) return null;
    const safeAlumnos = alumnos ?? [];
    const safeComunicados = comunicados ?? [];
    const safeDiagnosticos = diagnosticos ?? [];
    const cursoIds = (miPreceptor.cursos || []).map((c) => c.id_curso).filter(Boolean);
    return {
      cursos: (miPreceptor.cursos || []).length,
      alumnos: safeAlumnos.filter((a) => cursoIds.includes(a.id_curso)).length,
      comunicados: safeComunicados.filter((c) => cursoIds.includes(c.id_curso)).length,
      diagnosticos: safeDiagnosticos.filter((d) => cursoIds.includes(d.id_curso)).length,
      estado: miPreceptor.estado === false ? 'Inactivo' : 'Activo',
    };
  }, [miPreceptor, alumnos, comunicados, diagnosticos]);

  if (!miPreceptor) {
    return (
      <div className="card">
        <p className="empty-state-message">
          No se encontró un perfil de preceptor vinculado a tu usuario.
        </p>
      </div>
    );
  }

  const misCursos = (miPreceptor.cursos || []).map((c) => {
    const cObj = cursosObj.find((co) => co.id_curso === c.id_curso);
    return {
      id: c.id_curso,
      curso: c.nombre_curso || '',
      anio: c.ciclo_anio || cObj?.ciclo_anio || '',
    };
  });

  return (
    <div className="card">
      <div className="card-header-flex card-header-flex--compact">
        <h3>Perfil del Preceptor</h3>
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
      </div>

      <div className="stats-grid">
        <StatCard icon="fa-school" value={stats.cursos} label="Cursos asignados" />
        <StatCard icon="fa-users" value={stats.alumnos} label="Alumnos bajo seguimiento" />
        <StatCard icon="fa-bullhorn" value={stats.comunicados} label="Comunicados" />
        <StatCard icon="fa-chart-bar" value={stats.diagnosticos} label="Diagnósticos grupales" />
        <StatCard
          icon={stats.estado === 'Activo' ? 'fa-check-circle' : 'fa-exclamation-circle'}
          value={stats.estado}
          label="Estado de la cuenta"
          color={stats.estado === 'Activo' ? '#15803d' : '#b91c1c'}
        />
      </div>

      <div className="info-box mb-28">
        <i className="fas fa-info-circle info-box-icon" aria-hidden="true" />
        Responsable del seguimiento diario de los estudiantes, asistencia, comunicación institucional y acompañamiento escolar.
      </div>

      <div className="card-header-flex">
        <h4>Cursos Asignados</h4>
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
            {misCursos.length === 0 ? (
              <tr>
                <td colSpan={2} className="empty-state-message">
                  No hay cursos asignados.
                </td>
              </tr>
            ) : (
              misCursos.map((item) => (
                <tr key={item.id}>
                  <td className="text-left font-bold">
                    <i className="fas fa-users icon-muted" aria-hidden="true" />
                    {item.curso}
                  </td>
                  <td className="text-muted">{item.anio}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PanelPreceptor;
