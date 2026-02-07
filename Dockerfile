FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev) to run postinstall scripts
RUN npm ci

# Copy application code
COPY . .

# Build server
RUN npm run server:build

# Remove dev dependencies after build
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "run", "server:prod"]
