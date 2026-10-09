export const API_URL = 'http://localhost:8000/api';

export function getToken() {
    return localStorage.getItem('token');
}

export function setToken(token) {
    localStorage.setItem('token', token);
}

export function clearToken() {
    localStorage.removeItem('token');
}

export async function apiFetch(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    const token = getToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (response.status === 401) {
        clearToken();
        window.location.reload();   // renvoie vers l'écran de login
    }

    return response;
}

export async function login(username, password) {
    // OAuth2PasswordRequestForm attend du form-urlencoded
    const body = new URLSearchParams({ username, password });

    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Connexion impossible');
    }

    const data = await response.json();
    setToken(data.access_token);
    return data;
}

export async function register(username, password) {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Inscription impossible');
    }

    return response.json();
}