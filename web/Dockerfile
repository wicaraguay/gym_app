# === Base ===
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# === Desarrollo (Vite hot-reload) ===
FROM base AS development
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# === Build de produccion ===
FROM base AS build
RUN npm install
COPY . .
RUN npm run build

# === Produccion (Nginx sirve estaticos) ===
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
