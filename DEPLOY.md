# Desplegar trainingloja en el VPS (Contabo)

Corre trainingloja en **el mismo VPS que la picanteria**, sin tocarla.
La web queda en el puerto **8080** (la picanteria sigue en el 3000).
La api y la base de datos NO se exponen a internet.

## 0. Requisitos
- Docker + Docker Compose ya instalados (la picanteria ya los usa).
- Conectado por SSH al VPS (root o con sudo).

## 1. Traer el codigo
```bash
cd /opt
git clone https://github.com/wicaraguay/gym_app.git app2
cd app2
```

## 2. Crear la red compartida (para el futuro Caddy)
Se crea UNA sola vez. Si ya existe, no molesta.
```bash
docker network create shared_web 2>/dev/null || true
```

## 3. Configurar los secretos
```bash
cp env.production.example .env
nano .env          # pone claves FUERTES (lee las notas dentro del archivo)
```
Genera un `JWT_SECRET` fuerte con:
```bash
openssl rand -base64 48
```
> El `.env` NO se sube a git. Vive solo en el VPS.

## 4. Verificar que el puerto 8080 este libre
```bash
docker ps          # no debe haber nada publicado en :8080
```

## 5. Levantar trainingloja
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
Construye las imagenes de produccion, crea la base, **sincroniza el esquema
solo** (prisma db push) y arranca todo.

Ver que arranco bien:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api      # Ctrl+C para salir
```

## 6. Crear el usuario administrador (una sola vez)
La base arranca vacia. Crea el admin (cambia el email y la clave):
```bash
docker compose -f docker-compose.prod.yml exec api node -e '
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
(async () => {
  const p = new PrismaClient();
  const email = "admin@trainingloja.com";      // <-- cambialo
  const clave = "PONE_UNA_CLAVE_FUERTE";        // <-- cambiala
  const passwordHash = await bcrypt.hash(clave, 10);
  await p.user.upsert({ where: { email }, update: {},
    create: { email, name: "Administrador", passwordHash, role: "ADMIN" } });
  await p.settings.upsert({ where: { id: "singleton" }, update: {},
    create: { id: "singleton", businessName: "TRAINING LOJA" } });
  console.log("Admin creado:", email);
  await p.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
'
```

## 7. Abrir el puerto en el firewall (si usas ufw)
```bash
ufw status                 # ver si esta activo
ufw allow 8080/tcp         # solo si ufw esta activo
```

## 8. Probar
```bash
curl -I http://localhost:8080          # deberia responder 200
```
En el navegador: `http://TU_IP_DEL_VPS:8080` -> carga el login.
Entra con el admin del paso 6.

---

## Actualizar despues (cuando hagas git push de cambios)
```bash
cd /opt/app2
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Comandos utiles
```bash
# Logs
docker compose -f docker-compose.prod.yml logs -f

# Parar (sin borrar datos)
docker compose -f docker-compose.prod.yml down

# Parar y BORRAR la base (cuidado!)
docker compose -f docker-compose.prod.yml down -v

# Backup de la base
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U trainingloja trainingloja > backup_$(date +%F).sql
```

## Mas adelante: dominio + HTTPS
Este setup ya deja lista la red `shared_web`. Cuando quieras HTTPS, se agrega
un contenedor Caddy que toma 80/443 y rutea tu dominio a `trainingloja_web`
(y de paso a la picanteria). No hay que rehacer nada de esto.
