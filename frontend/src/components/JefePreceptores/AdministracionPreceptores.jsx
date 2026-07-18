import { useState } from 'react';
import AdminPreceptores from './AdminPreceptores';
import AsignacionCursos from './AsignacionCursos';
import SupervisionPreceptores from './SupervisionPreceptores';

const TABS = [
  { id: 'admin', label: 'Administrar Preceptores', icon: 'fa-user-tie' },
  { id: 'asignacion', label: 'Asignación de Cursos', icon: 'fa-calendar-check' },
  { id: 'supervision', label: 'Supervisión', icon: 'fa-eye' },
];

function AdministracionPreceptores() {
  const [activeTab, setActiveTab] = useState('admin');

  const renderContent = () => {
    switch (activeTab) {
      case 'admin':
        return <AdminPreceptores />;
      case 'asignacion':
        return <AsignacionCursos />;
      case 'supervision':
        return <SupervisionPreceptores />;
      default:
        return <AdminPreceptores />;
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header-flex card-header-flex--compact">
          <h3>Administración de Preceptores</h3>
        </div>

        <div className="asist-tipo-selector">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={`fas ${tab.icon}`} aria-hidden="true" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {renderContent()}
    </div>
  );
}

export default AdministracionPreceptores;
