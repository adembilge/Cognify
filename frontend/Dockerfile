# Frontend Dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build step (optional for dev)
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
