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
      <div className="card-header-flex" style={{ marginBottom: '20px' }}>
        <h3>Perfil del Preceptor</h3>
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
            {miPreceptor.apellido}, {miPreceptor.nombre}
          </p>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
            Documento (DNI)
          </label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{formatDNI(miPreceptor.dni)}</p>
        </div>
        {miPreceptor.correo && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
              Correo Electrónico
            </label>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px', color: 'var(--primary-color)', wordBreak: 'break-all' }}>
              {miPreceptor.correo}
            </p>
          </div>
        )}
        {miPreceptor.telefono && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
              Teléfono de Contacto
            </label>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{miPreceptor.telefono}</p>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
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
        Responsable del seguimiento diario de los estudiantes, asistencia, comunicación institucional y acompañamiento escolar.
      </div>

      <div className="card-header-flex">
        <h4>Cursos Asignados</h4>
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
            {misCursos.length === 0 ? (
              <tr>
                <td colSpan={2} className="empty-state-message">
                  No hay cursos asignados.
                </td>
              </tr>
            ) : (
              misCursos.map((item) => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'left', paddingLeft: '15px', fontWeight: '600' }}>
                    <i className="fas fa-users" style={{ color: '#888', marginRight: '8px' }} aria-hidden="true" />
                    {item.curso}
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

export default PanelPreceptor;
