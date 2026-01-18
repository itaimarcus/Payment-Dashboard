# Frontend Dockerfile for Development
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (no Tailwind)
RUN npm install

# Copy source code and config files
COPY . .

# Remove any postcss.config.js or tailwind.config.js directory or file if it exists
RUN rm -rf postcss.config.js tailwind.config.js 2>/dev/null || true

# Expose port
EXPOSE 5173

# Start Vite dev server with host exposure for Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
