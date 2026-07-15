# App nativa (Expo / React Native) — Panel del dueño

Esta es la app móvil, **hermana de la web**. Las dos hablan con el MISMO backend
(la API en `../api`). No se conectan entre ellas: cada una le pide los datos al
backend por su cuenta. Misma fuente de verdad, distinto diseño.

Por ahora hace lo mínimo para PROBAR que todo conecta: **login + una pantalla que
muestra tu nombre y el total de clientes real**. Desde acá se crece pantalla por
pantalla.

---

## 1. Requisito: la app "Expo Go" en tu celular

- Android: buscá **Expo Go** en Google Play e instalala.
- iPhone: **Expo Go** en la App Store.

Es la app que te deja ver ESTA app corriendo en tu teléfono mientras la
programás (sin tener que publicarla en ninguna tienda todavía).

## 2. Prender el backend

La app necesita que el backend esté corriendo. En la carpeta del proyecto:

```
docker compose up -d
```

## 3. Configurar la IP de tu PC (importante)

El celular NO puede usar `localhost` (eso sería el propio celu). Tiene que
apuntar a la IP de tu PC en la WiFi. Ya la dejé puesta en [src/api.ts](src/api.ts):

```
export const API_URL = 'http://192.168.0.101:3000/api';
```

Si tu IP cambió (reiniciaste el router, otra red), buscá la nueva con `ipconfig`
en la PC (la línea "IPv4", algo como `192.168.x.x`) y actualizá ese valor.

> **El celular y la PC tienen que estar en la MISMA red WiFi.**

## 4. Correr la app

```
cd mobile
npx expo start
```

Aparece un **código QR** en la terminal. Abrí **Expo Go** en el celu y escanealo
(Android: desde la propia app; iPhone: con la cámara). En segundos vas a ver el
login en tu teléfono.

## 5. Entrar

Usá el **mismo correo y contraseña de la web** (el del dueño). Si entra y ves tu
nombre y el número de clientes → **¡funcionó!** Probaste que toda la arquitectura
anda: la app pega a tu API, se autentica y lee datos reales.

---

## Si algo no conecta (lo más común)

1. **"No se pudo conectar"** → casi siempre es la IP o el firewall:
   - ¿La IP en `src/api.ts` es la de tu PC ahora? (`ipconfig`)
   - ¿El celu y la PC están en la misma WiFi?
   - **Windows Firewall** puede bloquear el puerto 3000. Si nada funciona,
     probá permitir el puerto 3000 en el firewall (o desactivarlo un momento
     para descartar).
2. **El backend no está prendido** → `docker compose up -d`.

---

## Qué sigue (cuando quieras crecer la app)

- Una pantalla de **lista de clientes** (llama `GET /members`, igual que la web).
- Tocar un cliente → ver su estado (`GET /members/:id`).
- Registrar un pago rápido (`POST /payments`).

La regla: **elegí solo los módulos que quieras en la app.** La administración
completa vive en la web; la app toma lo que te sirva en el celular.

## Estructura

```
mobile/
  App.tsx              → raíz: muestra login o home según sesión
  src/
    api.ts             → conexión a tu backend (acá está la IP)
    auth.ts            → guardar/leer el token en el celular
    screens/
      LoginScreen.tsx  → inicia sesión contra POST /auth/login
      HomeScreen.tsx   → muestra tu perfil + total de clientes
```
