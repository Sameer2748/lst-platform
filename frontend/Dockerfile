# Use official Node.js image
FROM node:20-bullseye
# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your code and .env
COPY . .
COPY .env .env

# Build the Next.js app
RUN npm run build

# Expose Next.js default port
EXPOSE 3000

# Start the Next.js app in production mode
CMD ["npm", "start"]
