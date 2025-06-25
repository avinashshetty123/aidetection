# ---- Build Stage ----
FROM node:20-slim AS build

WORKDIR /app

# Install Python and pip for build (needed for venv and pip install)
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

# Install Node dependencies and build frontend
COPY package*.json ./
RUN npm install
COPY src/ ./src/
COPY index.html ./
COPY vite.config.ts ./
RUN npm run build

# Copy backend code
COPY server/ ./server/

# ---- Production Stage ----
FROM node:20-slim

WORKDIR /app

# Install Python and pip for runtime
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

# Copy only built frontend and backend code
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server

# Set up Python venv and install only runtime dependencies
RUN python3 -m venv /app/venv && \
    . /app/venv/bin/activate && \
    pip install --upgrade pip && \
    pip install -r server/requirements.txt && \
    find /app/venv -name '*.pyc' -delete

ENV NODE_ENV=production
ENV PATH="/app/venv/bin:$PATH"

EXPOSE 3001

CMD ["node", "server/index.js"]