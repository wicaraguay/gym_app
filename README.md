# CrossFit · Sistema de Gestion

Aplicacion de gestion para un box de CrossFit: registro de clientes, planes con precio
editable, pagos por abonos y facturacion electronica SRI (Ecuador). Monolito modular.

## Stack

- **Frontend:** React + Vite + TypeScript + TailwindCSS (tema oscuro neon)
- **Backend:** NestJS (Node + TypeScript) organizado por modulos
- **ORM:** Prisma · **Base de datos:** PostgreSQL
- **Todo dockerizado:** un solo comando levanta el entorno completo

## Arquitectura (modulos)

```
auth       -> login + roles (ADMIN, RECEPCIONISTA)
members    -> clientes                     [Fase 1]
plans      -> planes y precios             [Fase 1]
memberships-> periodos mensuales           [Fase 1]
payments   -> abonos (pagos parciales)     [Fase 1]
billing    -> factura electronica SRI      [Fase 2]
settings   -> config del local             [Fase 3]
```

## Requisitos

Solo necesitas **Docker Desktop** instalado. Nada de Node ni Postgres locales.

## Puesta en marcha

### 1. Crear el archivo `.env` en la raiz

Por seguridad, el `.env` no viene incluido. Crealo con este contenido:

```env
# Base de datos (Postgres)
POSTGRES_USER=crossfit
POSTGRES_PASSWORD=crossfit
POSTGRES_DB=crossfit

# Backend (NestJS)
DATABASE_URL=postgresql://crossfit:crossfit@db:5432/crossfit?schema=public
JWT_SECRET=cambia_este_secreto_en_produccion
JWT_EXPIRES=1d

# Frontend (React)
VITE_API_URL=http://localhost:3000
```

En PowerShell podes crearlo rapido:

```powershell
@"
POSTGRES_USER=crossfit
POSTGRES_PASSWORD=crossfit
POSTGRES_DB=crossfit
DATABASE_URL=postgresql://crossfit:crossfit@db:5432/crossfit?schema=public
JWT_SECRET=cambia_este_secreto_en_produccion
JWT_EXPIRES=1d
VITE_API_URL=http://localhost:3000
"@ | Out-File -FilePath .env -Encoding utf8
```

### 2. Levantar todo

```bash
docker compose up --build
```

Esto arranca: base de datos, backend (crea las tablas y siembra datos) y frontend.

### 3. Abrir la app

| Servicio        | URL                         |
| --------------- | --------------------------- |
| Frontend        | http://localhost:5173       |
| API             | http://localhost:3000/api   |
| Health check    | http://localhost:3000/api/health |
| Adminer (BD)    | http://localhost:8080       |

### Usuario por defecto

```
Email:    admin@crossfit.local
Password: admin123
```

## Comandos utiles

```bash
docker compose up --build     # levantar (reconstruyendo imagenes)
docker compose up             # levantar
docker compose down           # apagar
docker compose down -v        # apagar y BORRAR la base de datos
docker compose logs -f api    # ver logs del backend
docker compose exec api npm run seed   # re-sembrar datos
```

## Roadmap por fases

- [x] **Fase 0** — Esqueleto: Docker, auth + roles, design system neon
- [ ] **Fase 1** — Clientes, Planes, Membresias, Abonos (nucleo operativo)
- [ ] **Fase 2** — Facturacion electronica SRI (firma, envio, autorizacion, RIDE)
- [ ] **Fase 3** — Configuracion del local + reportes
