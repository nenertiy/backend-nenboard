# Stage 1: Install dependencies
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci

# Stage 2: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN npx prisma generate
RUN npm run build

# Stage 3: Run the application
FROM node:22-alpine AS runner

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

CMD ["npm", "run", "start:prod"]