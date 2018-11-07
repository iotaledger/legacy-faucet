FROM node:alpine

COPY . /faucet
WORKDIR /faucet

RUN apk add --no-cache libc6-compat
RUN npm install
RUN npm install grpc
RUN npm rebuild

CMD node index.js
