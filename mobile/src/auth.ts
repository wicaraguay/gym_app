import * as SecureStore from 'expo-secure-store';

// Guardamos el token de sesion de forma segura en el celular.
export const saveToken = (token: string) =>
  SecureStore.setItemAsync('token', token);

export const getToken = () => SecureStore.getItemAsync('token');

export const clearToken = () => SecureStore.deleteItemAsync('token');
