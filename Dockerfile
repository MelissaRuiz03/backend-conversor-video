FROM node:20

WORKDIR /app

COPY package*.json ./
COPY scripts ./scripts
RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
