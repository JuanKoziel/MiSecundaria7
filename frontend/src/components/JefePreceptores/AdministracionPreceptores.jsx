import { useState } from 'react';
import AdminPreceptores from './AdminPreceptores';

function AdministracionPreceptores() {
  return (
    <div>
      <div className="card">
        <div className="card-header-flex card-header-flex--compact">
          <h3><i className="fas fa-user-cog" aria-hidden="true" /> Administración de Preceptores</h3>
        </div>
        <AdminPreceptores />
      </div>
    </div>
  );
}

export default AdministracionPreceptores;
