FROM node:18-alpine

# Install Python and dependencies
RUN apk add --no-cache python3 py3-pip python3-dev build-base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/requirements.txt ./server/

# Install Node.js dependencies
RUN npm install

# Install Python dependencies
RUN pip3 install -r server/requirements.txt

# Copy application code
COPY . .

# Build frontend
RUN npm run build

# Create data directory
RUN mkdir -p data temp

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start the application
CMD [\"npm\", \"start\"]