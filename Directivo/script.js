// --- BASE DE DATOS MOCK DE SIMULACIÓN (Mock Data) ---
const dataAlumnos = [
    { dni: "44.123.456", nombre: "Agustín", apellido: "Hoffer", curso: "5to", division: "A", nacimiento: "15/08/2008", n1: 9, n2: 8, n3: 10, asistencia: "Presente" },
    { dni: "45.987.654", nombre: "Sofía", apellido: "Martínez", curso: "5to", division: "A", nacimiento: "22/11/2009", n1: 7, n2: 6, n3: 8, asistencia: "Ausente" },
    { dni: "43.555.222", nombre: "Lucas", apellido: "Gómez", curso: "4to", division: "B", nacimiento: "03/02/2008", n1: 4, n2: 5, n3: 7, asistencia: "Tarde" }
];

const dataDocentes = [
    { nombre: "Carlos", apellido: "Rodríguez", materia: "Matemáticas Avanzadas", tel: "11-5555-1234", email: "carlos.rod@escuela.edu.ar" },
    { nombre: "María", apellido: "Fernández", materia: "Historia Universal", tel: "11-4444-9876", email: "maria.fer@escuela.edu.ar" }
];

let currentUser = null;

// --- INICIALIZACIÓN DE ESCUCHADORES DE EVENTOS ---
document.addEventListener('DOMContentLoaded', () => {
    // Intercepción del Formulario de Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Escuchadores del Menú de Navegación Lateral (SPA)
    setupNavigationElement('btn-view-alumnos', 'alumnos');
    setupNavigationElement('btn-view-docentes', 'docentes');
    setupNavigationElement('btn-view-asistencias', 'asistencias');
    setupNavigationElement('btn-view-notas', 'notas');
    setupNavigationElement('btn-view-actas', 'actas');
    setupNavigationElement('btn-view-inasistencias-doc', 'inasistencias-doc');

    // Escuchador de Cierre de Sesión
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }

    // Botón de prueba para registro de alumno
    const btnRegistrar = document.getElementById('btn-registrar-alumno');
    if (btnRegistrar) {
        btnRegistrar.addEventListener('click', () => {
            alert('Funcionalidad de inserción modular en base de datos habilitada en backend (CRUD interactivo estructurado).');
        });
    }
});

// Asistente para mapear clics del menú a vistas de secciones
function setupNavigationElement(elementId, viewName) {
    const el = document.getElementById(elementId);
    if (el) {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(viewName);
        });
    }
}

// --- SISTEMA DE CONTROL DE ACCESO (LOGIN / LOGOUT) ---
function handleLogin(event) {
    event.preventDefault();
    const role = document.getElementById('userRole').value;
    const usernameInput = document.getElementById('username').value;

    // Si entra como administrador, mapeamos los datos reales del directivo a la UI
    if (role === 'admin') {
        currentUser = {
            username: "FACUNDO NAHUEL TERENZANO",
            role: "DIRECTOR GENERAL"
        };
    } else {
        currentUser = {
            username: usernameInput.toUpperCase(),
            role: "CUERPO DOCENTE"
        };
    }

    // Ocultar login, mostrar layout principal
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardLayout').style.display = 'flex';

    // Configurar el perfil visual en la barra superior
    document.getElementById('userProfileName').innerText = currentUser.username;
    document.getElementById('userProfileRole').innerText = currentUser.role;
    document.getElementById('avatarBox').innerText = currentUser.username.charAt(0);

    // Filtrar visibilidad en barra lateral según privilegios de rol
    const adminElements = document.querySelectorAll('.admin-only');
    if (role === 'docente') {
        adminElements.forEach(el => el.style.display = 'none');
    } else {
        adminElements.forEach(el => el.style.display = 'block');
    }

    // Forzar renderizado inicial por defecto
    switchView('alumnos');
    renderAllTables();
}

function handleLogout() {
    currentUser = null;
    document.getElementById('dashboardLayout').style.display = 'none';
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('loginForm').reset();
}

// --- MANEJADOR DE CAMBIO DE VISTAS (SPA - Single Page Application) ---
function switchView(viewId) {
    // Desactivar secciones e ítems activos anteriores
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.sidebar-menu li').forEach(li => {
        li.classList.remove('active');
    });

    // Activar la vista e ítem seleccionados
    const targetSection = document.getElementById(`view-${viewId}`);
    const targetNav = document.getElementById(`nav-${viewId}`);
    
    if (targetSection) targetSection.classList.add('active');
    if (targetNav) targetNav.classList.add('active');
}

// --- GENERACIÓN DINÁMICA DE ELEMENTOS EN TABLAS (UI) ---
function renderAllTables() {
    // 1. Renderizar Alumnos
    const alumnosBody = document.getElementById('alumnosTableBody');
    if (alumnosBody) {
        alumnosBody.innerHTML = '';
        dataAlumnos.forEach((a, index) => {
            alumnosBody.innerHTML += `
                <tr>
                    <td><b>${a.dni}</b></td>
                    <td>${a.apellido}, ${a.nombre}</td>
                    <td>${a.curso} Año "${a.division}"</td>
                    <td>${a.nacimiento}</td>
                    <td>
                        <button class="btn btn-primary" style="padding:5px 8px;" onclick="alert('Editar ID: ${index}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-danger" style="padding:5px 8px;" onclick="alert('Eliminar ID: ${index}')"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }

    // 2. Renderizar Docentes
    const docentesBody = document.getElementById('docentesTableBody');
    if (docentesBody) {
        docentesBody.innerHTML = '';
        dataDocentes.forEach((d) => {
            docentesBody.innerHTML += `
                <tr>
                    <td><b>${d.apellido}, ${d.nombre}</b></td>
                    <td><span style="background:#e3fafc; color:#0c8599; padding:4px 8px; border-radius:4px; font-size:0.85rem;">${d.materia}</span></td>
                    <td>${d.tel}</td>
                    <td>${d.email}</td>
                    <td>
                        <button class="btn btn-primary" style="padding:5px 8px;"><i class="fa-solid fa-pen"></i></button>
                    </td>
                </tr>
            `;
        });
    }

    // 3. Renderizar Asistencias
    const asistenciaBody = document.getElementById('asistenciaTableBody');
    if (asistenciaBody) {
        asistenciaBody.innerHTML = '';
        dataAlumnos.forEach((a) => {
            let badgeClass = a.asistencia === 'Presente' ? 'badge-presente' : (a.asistencia === 'Ausente' ? 'badge-ausente' : 'badge-tarde');
            asistenciaBody.innerHTML += `
                <tr>
                    <td>${a.apellido}, ${a.nombre}</td>
                    <td><span class="badge ${badgeClass}">${a.asistencia}</span></td>
                    <td>
                        <select style="padding:5px; border-radius:4px;" onchange="alert('Estado cambiado')">
                            <option ${a.asistencia==='Presente'?'selected':''}>Presente</option>
                            <option ${a.asistencia==='Ausente'?'selected':''}>Ausente</option>
                            <option ${a.asistencia==='Tarde'?'selected':''}>Tarde</option>
                        </select>
                    </td>
                </tr>
            `;
        });
    }

    // 4. Renderizar Calificaciones con cálculo matemático de promedios
    const notasBody = document.getElementById('notasTableBody');
    if (notasBody) {
        notasBody.innerHTML = '';
        dataAlumnos.forEach((a) => {
            const promedio = ((a.n1 + a.n2 + a.n3) / 3).toFixed(2);
            const colorPromedio = promedio >= 6 ? '#28a745' : '#dc3545';
            notasBody.innerHTML += `
                <tr>
                    <td>${a.apellido}, ${a.nombre}</td>
                    <td><input type="number" value="${a.n1}" style="width:50px; text-align:center; padding:4px;"></td>
                    <td><input type="number" value="${a.n2}" style="width:50px; text-align:center; padding:4px;"></td>
                    <td><input type="number" value="${a.n3}" style="width:50px; text-align:center; padding:4px;"></td>
                    <td><b style="color: ${colorPromedio}; font-size:1.05rem;">${promedio}</b></td>
                    <td><button class="btn btn-success" style="padding:4px 10px; font-size:0.8rem;"><i class="fa-solid fa-check"></i> Fix</button></td>
                </tr>
            `;
        });
    }
}