FROM python:3.7.4-slim

WORKDIR /usr/src/app

RUN apt-get -q update \
    && apt-get -qy install \
    build-essential \
    python3-all-dev git \
    libpulse-dev \
    libasound2-dev \
    wget \
    bison \
    libasound2-dev \
    swig && rm -rf /var/lib/apt/lists/*

RUN pip install paho-mqtt pocketsphinx SpeechRecognition

VOLUME /usr/src/app/model
ENV PSX_LANGUAGE_PATH="model/en-us"
ENV PSX_HMM_PATH="model/en-us/en-us"
ENV PSX_LM_FILE="model/en-us/en-us.lm.bin"
ENV PSX_DICT_FILE="model/en-us/cmudict-en-us.dict"

ENV STT_ALT="0"

COPY ./start.py .

RUN ls -l

CMD [ "python", "./start.py" ]