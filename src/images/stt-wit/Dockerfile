FROM python:3.7.4-slim

WORKDIR /usr/src/app

RUN apt-get -q update \
    && apt-get -qy install \
    build-essential \
    portaudio19-dev && rm -rf /var/lib/apt/lists/*

RUN pip install pyaudio pyusb SpeechRecognition paho-mqtt

ENV STT_ALT="0"

COPY . .

CMD [ "python", "./start.py" ]