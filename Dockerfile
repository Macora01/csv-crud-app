# Multi-stage build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json files
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN cd server && npm install
RUN cd client && npm install

# Copy source code
COPY server/ ./server/
COPY client/ ./client/

# Build client
WORKDIR /app/client
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy server dependencies
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/package*.json ./

# Copy server source code
COPY --from=builder /app/server/ ./

# Copy built client
COPY --from=builder /app/client/build ./public

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5005

# Start the application
CMD ["node", "index.js"]