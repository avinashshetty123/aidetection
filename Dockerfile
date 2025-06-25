# Use an official Node.js image as the base
FROM node:20-slim as build

# Set working directory
WORKDIR /app

# Install Python and pip
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

# Copy package files and install Node dependencies
COPY package*.json ./
RUN npm install

# Copy frontend source and build it
COPY src/ ./src/
COPY index.html ./
COPY vite.config.ts ./
RUN npm run build

# Copy server code
COPY server/ ./server/

# Set up Python virtual environment and install dependencies
RUN python3 -m venv /app/venv && \
    . /app/venv/bin/activate && \
    pip install --upgrade pip && \
    pip install -r server/requirements.txt

# Set environment variables for production
ENV NODE_ENV=production
ENV PATH="/app/venv/bin:$PATH"

# Expose the port your app runs on
EXPOSE 3001

# Start the Node.js backend
CMD ["node", "server/index.js"] 