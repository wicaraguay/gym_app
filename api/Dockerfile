# === Base ===
FROM node:20-alpine AS base
# Prisma necesita OpenSSL para su motor binario (Alpine no lo trae)
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma

# === Desarrollo (hot-reload) ===
FROM base AS development
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# === Build de produccion ===
FROM base AS build
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# === Produccion (imagen liviana) ===
FROM node:20-alpine AS production
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev
RUN npx prisma generate
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
