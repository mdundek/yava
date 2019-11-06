FROM python:3.7.4-slim

WORKDIR /usr/src/app

RUN apt-get -q update \
    && apt-get -qy install \
    git \
    curl \
    wget \
    python-dev \
    libatlas-base-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN CFLAGS=-std=c11 pip install numpy
RUN pip install paho-mqtt pyzmq pyyaml requests
RUN BLIS_ARCH="generic" pip install spacy --no-binary blis

# Install NodeJS
RUN curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt-get -qy install nodejs

ARG BUILDTIME_LANGUAGE=en
ARG BUILDTIME_SPACY_MODEL=en_core_web_sm

ENV LANGUAGE $BUILDTIME_LANGUAGE
ENV SPACY_MODEL $BUILDTIME_SPACY_MODEL

RUN python -m spacy download $SPACY_MODEL

# NodeJS NLU server, install dependencies
RUN mkdir -p /usr/src/app/nlu-js-server
COPY ./nlu-js-server/package.json /usr/src/app/nlu-js-server
RUN cd nlu-js-server && npm i

VOLUME /usr/src/app/models
VOLUME /usr/src/app/training_data/

ENV TRAIN_ENTITIES_ITERATIONS 40

COPY ./nlu-js-server/index.js /usr/src/app/nlu-js-server
COPY ./src .

CMD [ "python", "./start.py" ]