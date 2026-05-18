// ==========================================================================
// SIMULACIÓN DE DATA CORE (ESTADO DE LA APLICACIÓN)
// ==========================================================================
const dataAlumnos = [
    { dni: "44.123.456", nombre: "Agustín", apellido: "Hoffer", curso: "5to", division: "A", nacimiento: "15/08/2008", n1: 9, n2: 8, n3: 10, asistencia: "Presente" },
    { dni: "45.987.654", nombre: "Sofía", apellido: "Martínez", curso: "5to", division: "A", nacimiento: "22/11/2009", n1: 7, n2: 6, n3: 8, asistencia: "Ausente" },
    { dni: "43.555.222", nombre: "Lucas", apellido: "Gómez", curso: "4to", division: "B", nacimiento: "03/02/2008", n1: 4, n2: 5, n3: 5, asistencia: "Tarde" }
];

const dataDocentes = [
    { nombre: "Carlos", apellido: "Rodríguez", materia: "Matemáticas Avanzadas", tel: "11-5555-1234", email: "carlos.rod@escuela.edu.ar" },
    { nombre: "María", apellido: "Fernández", materia: "Historia Universal", tel: "11-4444-9876", email: "maria.fer@escuela.edu.ar" }
];

let currentUser = null;

// ==========================================================================
// CONTROLADORES DE EVENTOS Y MANEJO DE LOGIN
// ==========================================================================
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const roleInput = document.getElementById('userRole').value;
    const usernameInput = document.getElementById('username').value;

    // Guardar usuario en sesión simulada
    currentUser = {
        username: usernameInput.toUpperCase(),
        role: roleInput
    };

    // Cambiar visualización de secciones
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardLayout').style.display = 'flex';

    // Setear información del encabezado del perfil
    document.getElementById('userProfileName').innerText = currentUser.username;
    document.getElementById('userProfileRole').innerText = currentUser.role.toUpperCase();
    document.getElementById('avatarBox').innerText = currentUser.username.charAt(0);

    // CONTROL DE ACCESO BASADO EN ROL (RBAC)
    const adminElements = document.querySelectorAll('.admin-only');
    if (currentUser.role === 'docente') {
        adminElements.forEach(el => el.style.display = 'none');
        switchView('alumnos'); // Redirección por defecto
    } else {
        adminElements.forEach(el => el.style.display = 'block');
        switchView('alumnos');
    }

    renderAllTables();
});

document.getElementById('btnLogout').addEventListener('click', function(e) {
    e.preventDefault();
    currentUser = null;
    document.getElementById('dashboardLayout').style.display = 'none';
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('loginForm').reset();
});

// ==========================================================================
// CONMUTADOR DE VISTAS (Navegación SPA sin recarga)
// ==========================================================================
function switchView(viewId) {
    // Apagar secciones y remover marcas activas del menú
    document.querySelectorAll('.view-section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));

    // Encender secciones correspondientes
    document.getElementById(`view-${viewId}`).classList.add('active');
    document.getElementById(`nav-${viewId}`).classList.add('active');
}

// Vincular los clics de la barra lateral dinámicamente
document.querySelectorAll('.sidebar-menu li a[data-view]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetView = this.getAttribute('data-view');
        switchView(targetView);
    });
});

// ==========================================================================
// INYECCIÓN Y RENDERIZADO DINÁMICO DE DATOS (CRUD RELLENO)
// ==========================================================================
function renderAllTables() {
    
    // 1. Renderizar Listado de Alumnos
    const alumnosBody = document.getElementById('alumnosTableBody');
    alumnosBody.innerHTML = '';
    dataAlumnos.forEach((alumno, index) => {
        alumnosBody.innerHTML += `
            <tr>
                <td><b>${alumno.dni}</b></td>
                <td>${alumno.apellido}, ${alumno.nombre}</td>
                <td>${alumno.curso} Año "${alumno.division}"</td>
                <td>${alumno.nacimiento}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="alert('Modificar índice: ${index}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="alert('Eliminar estudiante: ${alumno.apellido}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });

    // 2. Renderizar Listado de Docentes (Modo Admin)
    const docentesBody = document.getElementById('docentesTableBody');
    docentesBody.innerHTML = '';
    dataDocentes.forEach((docente) => {
        docentesBody.innerHTML += `
            <tr>
                <td><b>${docente.apellido}, ${docente.nombre}</b></td>
                <td><span style="background:#e3fafc; color:#0c8599; padding:4px 8px; border-radius:4px; font-size:0.85rem;">${docente.materia}</span></td>
                <td>${docente.tel}</td>
                <td>${docente.email}</td>
                <td>
                    <button class="btn btn-primary btn-sm"><i class="fa-solid fa-pen"></i></button>
                </td>
            </tr>
        `;
    });

    // 3. Renderizar Módulo Asistencias
    const asistenciaBody = document.getElementById('asistenciaTableBody');
    asistenciaBody.innerHTML = '';
    dataAlumnos.forEach((alumno) => {
        let badgeClass = alumno.asistencia === 'Presente' ? 'badge-presente' : (alumno.asistencia === 'Ausente' ? 'badge-ausente' : 'badge-tarde');
        asistenciaBody.innerHTML += `
            <tr>
                <td>${alumno.apellido}, ${alumno.nombre}</td>
                <td><span class="badge ${badgeClass}">${alumno.asistencia}</span></td>
                <td>
                    <select style="padding:5px; border-radius:4px;" onchange="alert('Asistencia actualizada en el registro de la división')">
                        <option ${alumno.asistencia === 'Presente' ? 'selected' : ''}>Presente</option>
                        <option ${alumno.asistencia === 'Ausente' ? 'selected' : ''}>Ausente</option>
                        <option ${alumno.asistencia === 'Tarde' ? 'selected' : ''}>Tarde</option>
                    </select>
                </td>
            </tr>
        `;
    });

    // 4. Carga de Notas y Promedio Automático Proporcional
    const notasBody = document.getElementById('notasTableBody');
    notasBody.innerHTML = '';
    dataAlumnos.forEach((alumno) => {
        const promedio = ((alumno.n1 + alumno.n2 + alumno.n3) / 3).toFixed(2);
        const colorPromedio = promedio >= 6 ? '#28a745' : '#dc3545';
        
        notasBody.innerHTML += `
            <tr>
                <td>${alumno.apellido}, ${alumno.nombre}</td>
                <td><input type="number" class="nota-input" value="${alumno.n1}" min="1" max="10" style="width:55px; padding:4px; text-align:center;"></td>
                <td><input type="number" class="nota-input" value="${alumno.n2}" min="1" max="10" style="width:55px; padding:4px; text-align:center;"></td>
                <td><input type="number" class="nota-input" value="${alumno.n3}" min="1" max="10" style="width:55px; padding:4px; text-align:center;"></td>
                <td><b style="color: ${colorPromedio}; font-size:1.05rem;">${promedio}</b></td>
                <td><button class="btn btn-success btn-sm" onclick="alert('Calificaciones grabadas en libreta digital')"><i class="fa-solid fa-check"></i></button></td>
            </tr>
        `;
    });
}