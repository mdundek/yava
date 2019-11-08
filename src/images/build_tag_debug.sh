#!/bin/bash

# ONE LINER => git pull https://"mdundek":"R3b3cc8!"@github.com/mdundek/private-voice-assistant.git && ./build_tag_debug.sh capture-speech-arm

args=("$@")

if [ ${#args[@]} -eq 0 ]; then
    echo "Usage: YAVA_VERSION=x.x.x ./build_tag_debug.sh nlp-spacy-arm nlp-light-arm nlp-mosquitto-arm capture-speech-arm hotword-porcupine-arm hotword-snowboy-arm orchestrator-arm stt-google-arm stt-pocketsphinx-arm stt-wit-arm tts-mimic-arm"
    exit 0
fi

if [[ -z "${YAVA_VERSION}" ]]; then
  YAVA_VERSION="0.9.1"
fi

BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $BASE_DIR

YAVA_VERSION=$YAVA_VERSION ./build_tag.sh $@

COMPOSE_HTTP_TIMEOUT=300; YAVA_VERSION=$YAVA_VERSION docker-compose -f ../../docker-compose-prod.yml up -d
COMPOSE_HTTP_TIMEOUT=300; YAVA_VERSION=$YAVA_VERSION docker-compose -f ../../docker-compose-prod.yml logs -f
COMPOSE_HTTP_TIMEOUT=300; YAVA_VERSION=$YAVA_VERSION docker-compose -f ../../docker-compose-prod.yml down


# docker rm $(docker ps --all -q)

# docker rmi md76/yava-mosquitto:0.9.1-arm
# docker rmi md76/yava-nlu-light:0.9.1-arm
# docker rmi md76/yava-hotword-porcupine:0.9.1-arm
# docker rmi md76/yava-capture-speech:0.9.1-arm
# docker rmi md76/yava-stt-pocketsphinx:0.9.1-arm
# docker rmi md76/yava-stt-wit:0.9.1-arm
# docker rmi md76/yava-tts-mimic:0.9.1-arm
# docker rmi md76/yava-orchestrator:0.9.1-arm

# docker pull md76/yava-mosquitto:0.9.1-arm
# docker pull md76/yava-nlu-light:0.9.1-arm
# docker pull md76/yava-hotword-porcupine:0.9.1-arm
# docker pull md76/yava-capture-speech:0.9.1-arm
# docker pull md76/yava-stt-pocketsphinx:0.9.1-arm
# docker pull md76/yava-stt-wit:0.9.1-arm
# docker pull md76/yava-tts-mimic:0.9.1-arm
# docker pull md76/yava-orchestrator:0.9.1-arm
