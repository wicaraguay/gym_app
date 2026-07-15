import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ─────────────────────────────────────────────────────────────────────────
// IMPORTANTE: el celular NO puede usar "localhost" — eso apuntaria al propio
// celular. Tiene que apuntar a la IP de TU PC en la red WiFi.
// IP actual de la PC: 192.168.1.86
// Si tu IP cambia (reiniciaste el router, te conectaste a otra red), corre
// `ipconfig` en la PC, busca "Direccion IPv4" y actualiza este valor.
// ─────────────────────────────────────────────────────────────────────────
export const API_URL = 'http://192.168.1.86:3000/api';

export const api = axios.create({ baseURL: API_URL, timeout: 10000 });

// Adjunta el token JWT en cada peticion (igual que hace la web).
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
