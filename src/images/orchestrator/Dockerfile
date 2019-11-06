FROM node:11-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

COPY . .

CMD [ "node", "index.js" ]