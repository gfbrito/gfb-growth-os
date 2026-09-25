# ==============================================================================
# GFB Growth OS - Production Backend Dockerfile
# Multi-stage build for minimal image size and maximum security
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências de compilação necessárias
RUN apk add --no-cache python3 make g++

# Copia manifestos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instala todas as dependências (incluindo dev para compilar TypeScript)
RUN npm ci

# Copia código-fonte
COPY . .

# Gera Prisma Client e compila TypeScript
RUN npx prisma generate
RUN npm run build

# ==============================================================================
# Runner Stage
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Cria usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY package*.json ./
COPY prisma ./prisma/

# Instala apenas dependências de produção
RUN npm ci --only=production && \
    npx prisma generate

# Copia arquivos compilados do estágio builder
COPY --from=builder /app/dist ./dist

# Garante permissões corretas
RUN mkdir -p /app/data/uploads && \
    chown -R appuser:nodejs /app

USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/server.js"]
