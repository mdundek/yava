FROM python:3.7.4-slim

WORKDIR /usr/src/app

RUN apt-get -q update \
    && apt-get -qy install \
    build-essential && rm -rf /var/lib/apt/lists/*

RUN pip install paho-mqtt google-cloud-speech

ENV GOOGLE_APPLICATION_CREDENTIALS="/usr/src/app/credentials.json"

ENV STT_ALT="0"

COPY . .

CMD [ "python", "./start.py" ]