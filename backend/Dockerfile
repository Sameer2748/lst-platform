# Use official Node.js LTS image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Build TypeScript
RUN npx tsc -b

# Expose port
EXPOSE 3003

# Start the app
CMD ["node", "dist/index.js"]
