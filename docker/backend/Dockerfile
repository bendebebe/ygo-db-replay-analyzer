FROM node:20-slim

# Install additional dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    libxss1 \
    libxtst6 \
    libgtk-3-0 \
    libgconf-2-4 \
    libnss3 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxrandr2 \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_BROWSER_DOWNLOAD=1

# Add a non-root user
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy TypeScript config
COPY tsconfig.json .

# Copy source code
COPY src ./src

# Give necessary permissions
RUN chown -R pptruser:pptruser /app

# Run everything after as non-privileged user
USER pptruser

# Expose port
EXPOSE 4000

# Run in development mode
CMD ["npm", "run", "dev"]
