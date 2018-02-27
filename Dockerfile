FROM node:8.9.3
COPY ./bundle /bundle
WORKDIR /bundle/programs/server
RUN npm install

WORKDIR /bundle
ENV PORT=80
ENV ROOT_URL=https://www.cryptometry.io
CMD ["node", "main.js"]
