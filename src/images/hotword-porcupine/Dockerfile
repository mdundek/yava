FROM python:3.7.5-slim

WORKDIR /usr/src/app

RUN apt-get -q update \
    && apt-get -qy install \
    libatlas-base-dev \
    portaudio19-dev \
    python-all-dev \
    python3-all-dev \
    build-essential \
    libffi-dev && rm -rf /var/lib/apt/lists/*

RUN pip install pyaudio paho-mqtt pvporcupine

VOLUME /usr/src/app/models

# americano, blueberry, bumblebee, grapefruit, grasshopper, hey pico, picovoice, porcupine, terminator
ENV SYSTEM_HOTWORDS "bumblebee,hey pico"

COPY . .

CMD [ "python", "./start.py" ]