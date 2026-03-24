# Dockerfile for the FragmentService
# This Dockerfile defines all instruction needed for Docker Engine to build an image of the FragmentService. It is based on the Node.js image, which provides a lightweight and efficient environment for running Node.js applications.

# Use a specific version of Node.js
# Stage 1 : Build Dependencies
FROM node:22.22.0 AS dependencies
WORKDIR /app
COPY package*.json ./
ENV NODE_ENV=production
RUN npm ci --only=production

# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# Image metadata
LABEL maintainer="Kaung Khant San <kaungkhantsan.mr@gmail.com>"
LABEL description="Fragments node.js microservice"

# Stage 2 : Production
FROM node:22.22.0-alpine AS production
WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules

# Copy the entire project first
COPY --chown=node:node . /app

# THEN copy .htpasswd so it doesn't get overwritten
COPY tests/.htpasswd /app/tests/.htpasswd

USER node

EXPOSE 8080

HEALTHCHECK --interval=3m --timeout=30s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["npm", "start"]
