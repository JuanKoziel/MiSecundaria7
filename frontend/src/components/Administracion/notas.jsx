import { useMemo, useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import FiltrosAnioCurso from '../Shared/FiltrosAnioCurso';
import { getIntensificacionesAcademicas } from '../../services/api';
import BoletinExtras from '../BoletinExtras';

function califFinal(m) {
  const n1 = parseFloat(m.nota1);
  const n2 = parseFloat(m.nota2);
  const nums = [n1, n2].filter((n) => !Number.isNaN(n));
  return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : '—';
}

function celdaPrenota(p) {
  if (!p || p === '—' || p === 'Sin calificaciones') return '—';
  return <span className="badge badge-cualitativa">{p}</span>;
}

function celdaNota(n) {
  if (n === '' || n === null || n === undefined || n === '—') return '—';
  return n;
}

function Notas() {
  const {
    alumnos,
    cursosObj,
    getMateriasByCurso,
    nombreCorto,
    notasDocenteAdmin,
    cursoMateria,
  } = useData();

  const [curso, setCurso] = useState('1°1');
  const materiasCurso = useMemo(() => getMateriasByCurso(curso), [curso, getMateriasByCurso]);
  const [materia, setMateria] = useState('Matemática');
  const [intensificaciones, setIntensificaciones] = useState({});

  const handleCursoChange = (nuevoCurso) => {
    setCurso(nuevoCurso);
    const materias = getMateriasByCurso(nuevoCurso);
    setMateria(materias[0] ?? '');
  };

  // Fetch intensificaciones for selected curso/materia
  useEffect(() => {
    if (!curso || !materia) return;
    const cursoMateriaEntry = cursoMateria.find(
      (cm) => cm.curso_nombre === curso && cm.materia_nombre === materia
    );
    if (!cursoMateriaEntry) return;

    getIntensificacionesAcademicas()
      .then((data) => {
        const lista = Array.isArray(data) ? data : data.results || [];
        const intensifMateria = lista.filter(
          (i) => i.id_curso_materia === cursoMateriaEntry.id
        );
        const map = {};
        intensifMateria.forEach((i) => {
          if (!map[i.id_alumno]) map[i.id_alumno] = { '1C': '', diciembre: '', febrero: '' };
          const peri = (i.periodo_intensificacion || '').toLowerCase();
          if (peri.includes('primer') || peri.includes('1°') || peri.includes('1º')) {
            map[i.id_alumno]['1C'] = i.nota ?? '';
          } else if (peri.includes('diciembre')) {
            map[i.id_alumno].diciembre = i.nota ?? '';
          } else if (peri.includes('febrero')) {
            map[i.id_alumno].febrero = i.nota ?? '';
          }
        });
        setIntensificaciones(map);
      })
      .catch(() => setIntensificaciones({}));
  }, [curso, materia, cursoMateria]);

  const planilla = useMemo(() => {
    const alumnosCurso = alumnos.filter((a) => a.curso === curso);
    return alumnosCurso.map((alumno) => {
      const nota = notasDocenteAdmin.find(
        (n) => n.curso === curso && n.materia === materia && n.alumnoId === alumno.id
      );
      const inten = intensificaciones[alumno.id] || { '1C': '', diciembre: '', febrero: '' };
      return {
        alumnoId: alumno.id,
        nombre: nombreCorto(alumno),
        prenota1: nota?.prenota1 ?? '—',
        nota1: nota?.nota1 ?? '—',
        prenota2: nota?.prenota2 ?? '—',
        nota2: nota?.nota2 ?? '—',
        intensif_1c: inten['1C'],
        diciembre: inten.diciembre,
        febrero: inten.febrero,
        diagnostico: nota?.diagnostico ?? 'Sin carga del docente',
      };
    });
  }, [curso, materia, alumnos, notasDocenteAdmin, nombreCorto, intensificaciones]);

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Calificaciones — {curso} {' > '} {materia}</h3>
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

      <div className="table-responsive">
        <table className="boletin-table boletin-tabla-principal">
          <colgroup>
            <col style={{ width: '18%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2}>Estudiante</th>
              <th colSpan={2}>1.º Cuatrimestre</th>
              <th colSpan={3}>2.º Cuatrimestre</th>
              <th colSpan={2}>Intensificaciones</th>
              <th rowSpan={2}>Calificación final</th>
              <th rowSpan={2}>Observaciones</th>
            </tr>
            <tr>
              <th>1.ª Valoración Preliminar</th>
              <th>Calificación</th>
              <th>2.ª Valoración Preliminar</th>
              <th>Calificación</th>
              <th>Intensificación 1.º C</th>
              <th>Diciembre</th>
              <th>Febrero</th>
            </tr>
          </thead>
          <tbody>
            {planilla.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty-state-message">
                  No hay estudiantes en este curso.
                </td>
              </tr>
            ) : (
              planilla.map((fila) => (
                <tr key={fila.alumnoId}>
                  <td className="table-cell-strong">{fila.nombre}</td>
                  <td>{celdaPrenota(fila.prenota1)}</td>
                  <td>{celdaNota(fila.nota1)}</td>
                  <td>{celdaPrenota(fila.prenota2)}</td>
                  <td>{celdaNota(fila.nota2)}</td>
                  <td>{celdaNota(fila.intensif_1c)}</td>
                  <td>{celdaNota(fila.diciembre)}</td>
                  <td>{celdaNota(fila.febrero)}</td>
                  <td>{califFinal(fila)}</td>
                  <td className="cell-obs">{fila.diagnostico}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="boletin-firma-sello">
        <span>Firma y sello</span>
      </div>

      <BoletinExtras
        recursadas={[]}
        previas={[]}
        intensificaciones_posteriores={[]}
        loading={false}
      />
    </div>
  );
}

export default Notas;
