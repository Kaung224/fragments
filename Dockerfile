# Dockerfile for the FragmentService
# This Dockerfile defines all instruction needed for Docker Engine to build an image of the FragmentService. It is based on the Node.js image, which provides a lightweight and efficient environment for running Node.js applications.

# Use a specific version of Node.js
FROM node:22.22.0

# Image metadata
LABEL maintainer="Kaung Khant San <kaungkhantsan.mr@gmail.com>"
LABEL description="Fragments node.js microservice"

# Environment variables
# We default to use port 8080 in our service
ENV PORT=8080

# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable color when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false

# Use /app as our working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./

# Install node dependencies defined in package-lock.json
RUN npm install

# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# Start the container by running our server
CMD ["npm", "start"]

# We run our service on port 8080
EXPOSE 8080