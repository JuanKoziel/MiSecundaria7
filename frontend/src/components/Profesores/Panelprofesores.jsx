import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import PanelAlumnos from './PanelAlumnos';
import PanelInfo from './PanelInfo';
import PanelPlanif from './PanelPlanif';
import PanelAsistencia from './PanelAsistencia';

function App() {
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [materiaSeleccionada, setMateriaSeleccionada] = useState('');
  const [seccionActiva, setSeccionActiva] = useState('alumnos');

  const handleCursoChange = (nuevoCurso) => {
    setCursoSeleccionado(nuevoCurso);
    setMateriaSeleccionada(''); // Reinicia la materia al cambiar de curso
  };

  const reiniciarPantalla = () => {
    setCursoSeleccionado('');
    setMateriaSeleccionada('');
    setSeccionActiva('alumnos');
  };

  return (
    <div className="dashboard-layout" style={{ display: 'block' }}> 
      <Sidebar 
        seccionActiva={seccionActiva} 
        onCambiarSeccion={setSeccionActiva} 
        onReiniciar={reiniciarPantalla}
      />

      <main className="main-content">
        <TopHeader 
          cursoSeleccionado={cursoSeleccionado} 
          materiaSeleccionada={materiaSeleccionada} 
        />

        {/* Filtros de Selección Superior */}
        <div className="card">
          <div className="filter-row">
            
            <div className="form-group-filter">
              <label>Curso Activo</label>
              <select 
                value={cursoSeleccionado} 
                onChange={(e) => handleCursoChange(e.target.value)}
              >
                <option value="" disabled hidden>Seleccione un curso...</option>
                <option value="1°1">1°1</option>
                <option value="1°2">1°2</option>
                <option value="1°3">1°3</option>
                <option value="2°1">2°1</option>
                <option value="2°2">2°2</option>
                <option value="2°3">2°3</option>
                <option value="3°1">3°1</option>
                <option value="3°2">3°2</option>
                <option value="3°3">3°3</option>
                <option value="4°1">4°1</option>
                <option value="4°2">4°2</option>
                <option value="4°3">4°3</option>
                <option value="5°1">5°1</option>
                <option value="5°2">5°2</option>
                <option value="5°3">5°3</option>
                <option value="6°1">6°1</option>
                <option value="6°2">6°2</option>
                <option value="6°3">6°3</option>
              </select>
            </div>

            <div className="form-group-filter">
              <label>Materia</label>
              <select 
                value={materiaSeleccionada} 
                onChange={(e) => setMateriaSeleccionada(e.target.value)}
                disabled={!cursoSeleccionado}
              >
                <option value="" disabled hidden>Seleccione una materia...</option>
                <option value="Matemática">Matemática</option>
                <option value="Lengua y Lit.">Lengua y Lit.</option>
                <option value="Física">Física</option>
                <option value="Química">Química</option>
              </select>
            </div>

          </div>
        </div>

        {/* Vistas condicionales de las planillas */}
        {cursoSeleccionado && materiaSeleccionada ? (
          <>
            <div className={`view-section ${seccionActiva === 'alumnos' ? 'active' : ''}`}>
              {seccionActiva === 'alumnos' && <PanelAlumnos />}
            </div>
            <div className={`view-section ${seccionActiva === 'info' ? 'active' : ''}`}>
              {seccionActiva === 'info' && <PanelInfo />}
            </div>
            <div className={`view-section ${seccionActiva === 'planif' ? 'active' : ''}`}>
              {seccionActiva === 'planif' && <PanelPlanif />}
            </div>
            <div className={`view-section ${seccionActiva === 'asistencia' ? 'active' : ''}`}>
              {seccionActiva === 'asistencia' && <PanelAsistencia />}
            </div>
          </>
        ) : (
          <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
            <p style={{ color: '#666', fontSize: '1rem' }}>
              {!cursoSeleccionado 
                ? 'Por favor, seleccione un curso en el Panel de Control superior.' 
                : 'Por favor, seleccione una materia para desplegar las planillas de trabajo.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;