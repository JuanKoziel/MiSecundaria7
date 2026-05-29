/**
 * API Client Configuration
 * Maneja todas las llamadas HTTP a la API de Django
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  /**
   * Establece los tokens después de login
   */
  setTokens(accessToken, refreshToken) {
    this.token = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  /**
   * Limpia los tokens (logout)
   */
  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  /**
   * Obtiene los headers necesarios para las requests
   */
  getHeaders(contentType = 'application/json') {
    const headers = {
      'Content-Type': contentType,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Realiza una request HTTP genérica
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(options.contentType || 'application/json'),
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Si el token expiró, intentar refrescarlo
      if (response.status === 401 && this.refreshToken) {
        await this.refreshAccessToken();
        config.headers['Authorization'] = `Bearer ${this.token}`;
        return fetch(url, config);
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          statusText: response.statusText,
          data: error,
        };
      }

      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Refresca el access token usando el refresh token
   */
  async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: this.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.token = data.access;
      localStorage.setItem('access_token', data.access);
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokens();
      window.location.href = '/login';
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    const response = await this.request(url, { method: 'GET' });
    return response.json();
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data = {}) {
    const response = await this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    const response = await this.request(endpoint, { method: 'DELETE' });

    // DELETE puede no retornar contenido
    if (response.status === 204) {
      return { success: true };
    }

    return response.json();
  }

  // ========================================
  // MÉTODOS DE AUTENTICACIÓN
  // ========================================

  /**
   * Login con usuario y contraseña
   */
  async login(usuario, contrasena) {
    const data = await this.post('/auth/login/', { usuario, contrasena });

    if (data.access && data.refresh) {
      this.setTokens(data.access, data.refresh);
    }

    return data;
  }

  /**
   * Logout
   */
  async logout() {
    try {
      await this.post('/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Obtener datos del usuario autenticado
   */
  async getCurrentUser() {
    return this.get('/usuarios/me/');
  }

  // ========================================
  // MÉTODOS DE USUARIOS
  // ========================================

  async getUsers(params = {}) {
    return this.get('/usuarios/', params);
  }

  async getUser(id) {
    return this.get(`/usuarios/${id}/`);
  }

  async createUser(userData) {
    return this.post('/usuarios/', userData);
  }

  async updateUser(id, userData) {
    return this.put(`/usuarios/${id}/`, userData);
  }

  // ========================================
  // MÉTODOS DE DOCENTES
  // ========================================

  async getDocentes(params = {}) {
    return this.get('/docentes/', params);
  }

  async getDocente(id) {
    return this.get(`/docentes/${id}/`);
  }

  async getDocentePerfil() {
    return this.get('/docentes/me/');
  }

  async createDocente(data) {
    return this.post('/docentes/', data);
  }

  // ========================================
  // MÉTODOS DE ALUMNOS
  // ========================================

  async getAlumnos(params = {}) {
    return this.get('/alumnos/', params);
  }

  async getAlumno(id) {
    return this.get(`/alumnos/${id}/`);
  }

  async getAlumnoPerfil() {
    return this.get('/alumnos/me/');
  }

  async createAlumno(data) {
    return this.post('/alumnos/', data);
  }

  async updateAlumno(id, data) {
    return this.put(`/alumnos/${id}/`, data);
  }

  // ========================================
  // MÉTODOS DE PADRES/TUTORES
  // ========================================

  async getPadres(params = {}) {
    return this.get('/padres/', params);
  }

  async getPadre(id) {
    return this.get(`/padres/${id}/`);
  }

  async getPadrePerfil() {
    return this.get('/padres/me/');
  }

  // ========================================
  // MÉTODOS DE CURSOS Y MATERIAS
  // ========================================

  async getCursos(params = {}) {
    return this.get('/cursos/', params);
  }

  async getCurso(id) {
    return this.get(`/cursos/${id}/`);
  }

  async getMaterias(params = {}) {
    return this.get('/materias/', params);
  }

  async getMateria(id) {
    return this.get(`/materias/${id}/`);
  }

  async getCursoMaterias(params = {}) {
    return this.get('/curso-materia/', params);
  }

  async getCiclosLectivos() {
    return this.get('/ciclos-lectivos/');
  }
}

// Exportar instancia única
export default new APIClient();
