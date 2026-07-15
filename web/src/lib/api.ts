import axios from 'axios';

// En dev sin variable -> apunta al backend local (http://localhost:3000).
// En produccion la web va detras de nginx, que rutea /api al backend:
// VITE_API_URL se define vacia y se usa ruta RELATIVA (mismo origen), asi
// funciona igual en http://ip:8080 hoy o en https://tudominio.com manana,
// sin rebuildear.
const rawApiUrl = import.meta.env.VITE_API_URL;
const apiBase = rawApiUrl === undefined ? 'http://localhost:3000' : rawApiUrl;

export const api = axios.create({
  baseURL: `${apiBase}/api`,
});

// Adjunta el token JWT en cada peticion
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
