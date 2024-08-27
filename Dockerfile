FROM node:18-bullseye as bot
WORKDIR /app
COPY package*.json ./
RUN npm i
COPY . .
ARG RAILWAY_STATIC_URL
ARG PUBLIC_URL
ARG PORT
CMD ["npm", "start"]

# Construir la imagen Docker
#sudo docker build -t chatbotsuitex .

# Ejecutar el contenedor Docker
#sudo docker run -e RAILWAY_STATIC_URL=http://localhost -e PUBLIC_URL=http://localhost -e PORT=3003 -p 3003:3003 --name chatbot-suitex chatbotsuitex

