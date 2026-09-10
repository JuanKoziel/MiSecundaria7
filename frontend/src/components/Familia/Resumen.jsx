import { useData } from '../../context/DataContext';
import { cursoConOrientacion } from '../../utils/orientacion';
import { formatDNI } from '../../utils/dni';

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

function StatTile({ icon, label, value, color }) {
  return (
    <div className="card familia-stat-card">
      <i className={`fas ${icon} familia-stat-icon`} style={color ? { color } : undefined} aria-hidden="true" />
      <span className="familia-stat-label">{label}</span>
      <strong className="familia-stat-value">{value}</strong>
    </div>
  );
}

function EstadoTile({ label, estado, color }) {
  return (
    <div className="card familia-stat-card">
      <i className="fas fa-medal familia-stat-icon" style={{ color }} aria-hidden="true" />
      <span className="familia-stat-label">{label}</span>
      <span className="familia-estado-pill" style={{ backgroundColor: `${color}1a`, color }}>
        {estado}
      </span>
    </div>
  );
}

function Resumen({ hijo }) {
  const { asistenciasFamilia, calificacionesFamilia, cursosObj, getAlumnoById, materiasPorCurso } = useData();
  const alumno = getAlumnoById(hijo.alumnoId);
  const cursoObj = cursosObj.find((c) => c.id_curso === alumno?.id_curso);
  const turno = cursoObj?.turno_calculado || '—';
  const preceptor = cursoObj?.preceptor_nombre_completo || '—';
  const asistencias = asistenciasFamilia.filter((a) => a.hijoId === hijo.id);
  const calificaciones = calificacionesFamilia.filter((c) => c.hijoId === hijo.id);

  const presentes = asistencias.filter((a) => a.estado === 'Presente').length;
  const ausentes = asistencias.filter((a) => a.estado === 'Ausente').length;
  const tardanzas = asistencias.filter((a) => a.estado === 'Tarde').length;
  const registradas = asistencias.length;
  const porcentajeAsistencia =
    registradas > 0 ? clamp((presentes / registradas) * 100) : 0;

  const promediosPorMateria = calificaciones.map((c) => (Number(c.nota1) + Number(c.nota2)) / 2);
  const promedio =
    promediosPorMateria.length > 0
      ? (promediosPorMateria.reduce((acc, n) => acc + n, 0) / promediosPorMateria.length).toFixed(1)
      : '—';

  const promedioNum = Number(promedio);
  let estado = 'Sin calificaciones';
  let estadoColor = '#9aa5b1';
  if (!Number.isNaN(promedioNum) && promediosPorMateria.length > 0) {
    if (promedioNum >= 7) {
      estado = 'Promocionado';
      estadoColor = '#15803d';
    } else if (promedioNum >= 4) {
      estado = 'En condiciones de promover';
      estadoColor = '#b45309';
    } else {
      estado = 'En seguimiento';
      estadoColor = '#b91c1c';
    }
  }

  const materiasCount = materiasPorCurso[hijo.curso]?.length ?? '—';

  return (
    <div>
      <div className="familia-resumen-grid">
        <StatTile icon="fa-graduation-cap" label="Curso" value={cursoConOrientacion(hijo.curso)} />
        <StatTile icon="fa-clock" label="Turno" value={turno} />
        <StatTile icon="fa-users" label="Vínculo" value={hijo.vinculo || '—'} />
        <EstadoTile label="Estado académico" estado={estado} color={estadoColor} />
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header-flex">
          <h3><i className="fas fa-chart-pie" aria-hidden="true" /> Resumen académico</h3>
        </div>
        <div className="familia-academico-grid">
          <div className="card familia-academico-item center">
            <span className="familia-stat-label">Promedio general</span>
            <strong className="familia-stat-value font-accent">{promedio}</strong>
          </div>
          <div className="card familia-academico-item">
            <span className="familia-stat-label">Asistencia reciente</span>
            <strong className="familia-stat-value font-accent">{porcentajeAsistencia}%</strong>
            <div className="familia-asist-bar">
              <div className="familia-asist-bar-fill" style={{ width: `${porcentajeAsistencia}%` }} />
            </div>
            <div className="familia-asist-nums">
              <span className="ok">Presentes: <strong>{presentes}</strong></span>
              <span>Ausentes: <strong>{ausentes}</strong></span>
              <span>Tardanzas: <strong>{tardanzas}</strong></span>
              <span>Registros: <strong>{registradas}</strong></span>
            </div>
          </div>
          <div className="card familia-academico-item center">
            <span className="familia-stat-label">Materias del ciclo</span>
            <strong className="familia-stat-value font-accent">{materiasCount}</strong>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header-flex">
          <h3><i className="fas fa-user-graduate" aria-hidden="true" /> Información del estudiante</h3>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
          <div className="familia-avatar">
            <i className="fas fa-user-graduate" aria-hidden="true" />
          </div>
          <div>
            <strong className="familia-stat-value">{hijo.nombre}</strong>
            <div className="familia-hijo-pill" style={{ marginTop: '6px' }}>
              {cursoConOrientacion(hijo.curso)}
            </div>
          </div>
        </div>
        <div className="familia-chip-grid">
          <div className="familia-chip">
            <span className="familia-chip-label">DNI</span>
            <span className="familia-chip-value">{hijo.dni && hijo.dni !== '—' ? formatDNI(hijo.dni) : '—'}</span>
          </div>
          <div className="familia-chip">
            <span className="familia-chip-label">Fecha de nacimiento</span>
            <span className="familia-chip-value">{alumno?.fecha_nacimiento || '—'}</span>
          </div>
          <div className="familia-chip">
            <span className="familia-chip-label">Curso</span>
            <span className="familia-chip-value">{cursoConOrientacion(hijo.curso)}</span>
          </div>
          <div className="familia-chip">
            <span className="familia-chip-label">Ciclo lectivo</span>
            <span className="familia-chip-value">{cursoObj?.ciclo_anio || '—'}</span>
          </div>
          <div className="familia-chip">
            <span className="familia-chip-label">Turno</span>
            <span className="familia-chip-value">{turno}</span>
          </div>
          <div className="familia-chip">
            <span className="familia-chip-label">Preceptor</span>
            <span className="familia-chip-value">{preceptor}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Resumen;