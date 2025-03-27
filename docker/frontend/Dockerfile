# Use a multi-platform base image that's ARM64 compatible
FROM --platform=linux/arm64 node:20-alpine

# Install dependencies first
RUN apk update && \
    apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl \
    openssl-dev \
    libc6-compat \
    # Additional dependencies for Playwright
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps flag
# Add more memory for node during install
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm install --legacy-peer-deps

# Install Playwright
RUN npx playwright install chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_BROWSERS_PATH=/usr/bin

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Start the application with a production server
CMD ["npm", "start"]