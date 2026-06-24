# --------------------------------------------------------------
# 1️⃣  Build stage – compile the React front‑end
# --------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Backend deps (needed for the server that will run later)
COPY backend/package*.json backend/
RUN cd backend && npm ci

# Front‑end deps & build
COPY frontend/package*.json frontend/
RUN cd frontend && npm ci
COPY . .
RUN cd frontend && npm run build   # creates ./frontend/dist

# --------------------------------------------------------------
# 2️⃣  Production stage – run the Express API and serve static files
# --------------------------------------------------------------
FROM node:20-alpine

WORKDIR /app

# Copy only the runtime pieces
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY backend/server.js ./backend/
COPY package*.json ./
RUN npm ci --only=production

# Expose the port the server listens on (default 5000)
EXPOSE 5000

# Ensure we run in production mode
ENV NODE_ENV=production

# Start the app
CMD ["node", "backend/server.js"]
