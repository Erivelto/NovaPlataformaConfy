# ============================================
# Stage 1: Build da aplicação Angular
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copia dependências primeiro (cache de camadas)
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Copia código-fonte e faz o build de produção
COPY . .
RUN npx ng build --configuration production

# ============================================
# Stage 2: Servir com Nginx
# ============================================
FROM nginx:1.27-alpine

# Remove config padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia config customizada
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos do build Angular
# Angular 19 com builder "application" gera output em dist/<project>/browser
COPY --from=build /app/dist/novoangularbackv2/browser /usr/share/nginx/html

# Expõe porta 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
