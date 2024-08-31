FROM node:18-bullseye as bot
WORKDIR /app
COPY package*.json ./
RUN npm i --legacy-peer-deps
COPY . .
ARG RAILWAY_STATIC_URL
ARG PUBLIC_URL
ARG PORT
CMD ["npm", "start"]

# Construir la imagen Docker
#sudo docker build -t chatbot-dolce-helados .

# Ejecutar el contenedor Docker
#sudo docker run -e RAILWAY_STATIC_URL=http://localhost -e PUBLIC_URL=http://localhost -e PORT=3002 -p 3002:3002 --name chat-dolce-helados chatbot-dolce-helados

