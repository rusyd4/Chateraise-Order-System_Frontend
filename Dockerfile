# Use official Node.js 18 image as the base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Build the Next.js app
RUN npm run build

# Production image, copy all the files and dependencies from builder
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production --legacy-peer-deps

# Copy built files and public folder from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./ 

# Expose port 3000
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "start"]
