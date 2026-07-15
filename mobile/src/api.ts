import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ─────────────────────────────────────────────────────────────────────────
// URL del backend.
// PRODUCCION (para el APK que usa el dueno): pasa por Vercel con HTTPS real,
// asi la app funciona desde cualquier lado (datos moviles, otra red, etc.).
// Para desarrollo local con Expo Go podes apuntar a la IP de tu PC en la
// WiFi, por ejemplo:  http://192.168.1.86:3000/api
// ─────────────────────────────────────────────────────────────────────────
export const API_URL = 'https://trainingloja.vercel.app/api';

export const api = axios.create({ baseURL: API_URL, timeout: 10000 });

// Adjunta el token JWT en cada peticion (igual que hace la web).
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
