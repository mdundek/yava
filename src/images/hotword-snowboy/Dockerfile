FROM python:2-slim

WORKDIR /usr/src/app

RUN apt-get -q update \
    && apt-get -qy install \
    build-essential \
    libatlas-base-dev \
    portaudio19-dev && rm -rf /var/lib/apt/lists/*

RUN pip install pyaudio paho-mqtt

VOLUME /usr/src/app/models

COPY . .

RUN mv /usr/src/app/files/snowboy /usr/src/app

CMD python ./start.py