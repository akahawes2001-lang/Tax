# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts ./
COPY index.html ./
COPY public/ ./public/
COPY src/ ./src/
COPY types/ ./types/
COPY app/ ./app/

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# nginx.conf должен быть скопирован из корня проекта при сборке docker-compose
# (см. volumes в docker-compose.yml)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]