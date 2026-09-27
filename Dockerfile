# Plumos — build the web app, then serve it with the zero-dependency Node server.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=80 PLUMOS_STORAGE_PATH=/data
COPY --from=build /app/dist ./dist
COPY server ./server
COPY package.json ./
EXPOSE 80
CMD ["node", "server/index.mjs"]
