FROM python:3.7.4-alpine

WORKDIR /usr/src/app

RUN pip install paho-mqtt pyyaml requests

# Install NodeJS
RUN apk add --update nodejs npm

# NodeJS NLU server, install dependencies
RUN mkdir -p /usr/src/app/nlu-js-server
COPY ./nlu-js-server/package.json /usr/src/app/nlu-js-server
RUN cd nlu-js-server && npm i

RUN apk add --no-cache --upgrade bash

ENV LANGUAGE en

VOLUME /usr/src/app/models
VOLUME /usr/src/app/training_data/

COPY ./nlu-js-server/index.js /usr/src/app/nlu-js-server
COPY ./src .

CMD [ "python", "./start.py" ]