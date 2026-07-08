FROM node:20-alpine AS base
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3003

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3003"]

