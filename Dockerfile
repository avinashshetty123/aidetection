FROM node:20-slim

WORKDIR /app

# Install Python and pip
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

# Node dependencies and build
COPY package*.json ./
RUN npm install
COPY src/ ./src/
COPY index.html ./
COPY vite.config.ts ./
RUN npm run build

# Copy backend
COPY server/ ./server/

# Python venv and dependencies
RUN python3 -m venv /app/venv && \
    . /app/venv/bin/activate && \
    pip install --upgrade pip && \
    pip install -r server/requirements.txt

ENV NODE_ENV=production
ENV PATH="/app/venv/bin:$PATH"

EXPOSE 3001

CMD ["node", "server/index.js"]