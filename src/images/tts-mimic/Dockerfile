FROM python:3.7.4-slim

WORKDIR /usr/src/app

RUN apt-get -q update \
    && apt-get -qy install \
    git \
    wget \
    unzip \
    gcc \
    make \
    pkg-config \
    automake \
    libtool \
    libasound2-dev && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/MycroftAI/mimic1.git
WORKDIR /usr/src/app/mimic1
RUN sed -i "s@ftp://ftp.csx.cam.ac.uk/pub/software/programming/pcre/pcre2-10.23.zip@ftp://ftp.pcre.org/pub/pcre/pcre2-10.23.zip@g" ./dependencies.sh
RUN ./dependencies.sh --prefix="/usr/local"
RUN ./autogen.sh
RUN ./configure --prefix="/usr/local"
RUN make
RUN make check

RUN pip install paho-mqtt

WORKDIR /usr/src/app

COPY . .

CMD [ "python", "./start.py" ]