# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (needed for possible build steps or native modules)
RUN npm ci

# ============================================
# Stage 2: Final Image
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set to production
ENV NODE_ENV=production

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 4000

# Start the application
CMD ["node", "src/index.js"]
