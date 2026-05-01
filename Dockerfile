FROM node:20-alpine AS builder

WORKDIR /app

# Install client dependencies and build
COPY client/package*.json ./client/
RUN cd client && npm install

COPY client/ ./client/
RUN cd client && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm install --omit=dev

COPY server/ ./
COPY --from=builder /app/server/public ./public

EXPOSE 3001

CMD ["node", "index.js"]
