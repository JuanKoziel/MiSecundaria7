import { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import FiltrosAnioCurso from '../Shared/FiltrosAnioCurso';
import PanelEstudiantes from '../Profesores/PanelEstudiantes';

function Notas() {
  const { cursosObj, cursoMateria, getMateriasByCurso } = useData();

  const [curso, setCurso] = useState('1°1');
  const materiasCurso = useMemo(() => getMateriasByCurso(curso), [curso, getMateriasByCurso]);
  const [materia, setMateria] = useState('');

  const cursoObj = useMemo(
    () => (cursosObj || []).find((c) => c.nombre_curso === curso) || null,
    [cursosObj, curso],
  );
  const cursoId = cursoObj?.id_curso || null;

  const cursoMateriaEntry = useMemo(
    () =>
      (cursoMateria || []).find(
        (cm) => cm.curso_nombre === curso && cm.materia_nombre === materia,
      ) || null,
    [cursoMateria, curso, materia],
  );

  const handleCursoChange = (nuevoCurso) => {
    setCurso(nuevoCurso);
    const materias = getMateriasByCurso(nuevoCurso);
    setMateria(materias[0] ?? '');
  };

  return (
    <div>
      <div className="card">
        <div className="card-header-flex">
          <h3><i className="fas fa-graduation-cap" aria-hidden="true" /> Calificaciones — {curso} › {materia || '…'}</h3>
          <span className="badge role-badge-display">Solo lectura</span>
        </div>

        <FiltrosAnioCurso
          cursosObj={cursosObj}
          defaultToFirst
          onCursoChange={(nuevoCurso) => handleCursoChange(nuevoCurso)}
        />
        <div className="filter-row">
          <div className="form-group-filter">
            <label htmlFor="materia-notas">Materia</label>
            <select
              id="materia-notas"
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
            >
              {materiasCurso.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {cursoObj && cursoMateriaEntry ? (
        <>
          <div
            style={{
              background: '#eef2ff',
              borderLeft: '4px solid #4f46e5',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '0.9rem',
              color: '#3730a3',
              lineHeight: '1.6',
              marginBottom: '16px',
            }}
          >
            <i className="fas fa-lock" style={{ marginRight: '8px' }} aria-hidden="true" />
            Vista de solo lectura: se muestran las calificaciones, intensificaciones y previas cargadas por el docente.
          </div>
          <PanelEstudiantes
            cursoMateriaId={cursoMateriaEntry.id}
            cursoId={Number(cursoId)}
            cursoNombre={curso}
            materiaNombre={materia}
            docenteId={null}
            puedeEditar={false}
            mostrarBannerSuplencia={false}
          />
        </>
      ) : (
        <div className="card empty-state-card">
          <p className="empty-state-message">
            Seleccione un curso y una materia para ver la planilla de calificaciones.
          </p>
        </div>
      )}
    </div>
  );
}

export default Notas;