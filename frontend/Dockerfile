# Use official Node.js image
FROM node:20-bullseye AS builder

WORKDIR /app

# Copy only package manifests first (better cache)
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy rest of project
COPY . .

# Build the Next.js app
RUN npm run build

# ---

# Production image
FROM node:20-bullseye AS runner

WORKDIR /app

# Copy only production deps
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy built files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose Next.js default port
EXPOSE 3000

# Start Next.js in production
CMD ["npm", "start"]
