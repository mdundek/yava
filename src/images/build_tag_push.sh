#!/bin/bash

args=("$@")

if [ ${#args[@]} -eq 0 ]; then
    echo "Usage: YAVA_VERSION=x.x.x ./build_tag_push.sh nlp-spacy-arm nlp-light-arm nlp-mosquitto-arm capture-speech-arm hotword-porcupine-arm hotword-snowboy-arm orchestrator-arm stt-google-arm stt-pocketsphinx-arm stt-wit-arm tts-mimic-arm"
    exit 0
fi

if [[ -z "${YAVA_VERSION}" ]]; then
  YAVA_VERSION="0.9.1"
fi

BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $BASE_DIR

YAVA_VERSION=$YAVA_VERSION ./build_tag.sh $@

for i in "${args[@]}"
do
    # ------------------------- NLP SPACY -----------------------
    if [ "$i" == "nlp-spacy-arm" ]; then
        # cd nlu-spacy
        # docker build --build-arg BUILDTIME_LANGUAGE=en --build-arg BUILDTIME_SPACY_MODEL=en_core_web_md -t yava-nlu-spacy-arm-md .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # docker build --build-arg BUILDTIME_LANGUAGE=en --build-arg BUILDTIME_SPACY_MODEL=en_core_web_sm -t yava-nlu-spacy-arm-sm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..

        # ID_yava_nlu_spacy_arm_md="$( docker images | grep 'yava-nlu-spacy-arm-md' | awk '{print $3}' )"
        # ID_yava_nlu_spacy_arm_sm="$( docker images | grep 'yava-nlu-spacy-arm-sm' | awk '{print $3}' )"

        # docker tag $ID_yava_nlu_spacy_arm_md md76/yava-nlu-spacy:$YAVA_VERSION-en-md-arm
        # docker tag $ID_yava_nlu_spacy_arm_sm md76/yava-nlu-spacy:$YAVA_VERSION-en-sm-arm

        docker push md76/yava-nlu-spacy:$YAVA_VERSION-en-md-arm
        docker push md76/yava-nlu-spacy:$YAVA_VERSION-en-sm-arm
    fi

    if [ "$i" == "nlp-spacy-amd64" ]; then
        # cd nlu-spacy
        # docker build --build-arg BUILDTIME_LANGUAGE=en --build-arg BUILDTIME_SPACY_MODEL=en_core_web_md -f ./DockerfileNoARM.txt -t yava-nlu-spacy-md .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # docker build --build-arg BUILDTIME_LANGUAGE=en --build-arg BUILDTIME_SPACY_MODEL=en_core_web_sm -f ./DockerfileNoARM.txt -t yava-nlu-spacy-sm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..

        # ID_yava_nlu_spacy_md="$( docker images | grep 'yava-nlu-spacy-md' | awk '{print $3}' )"
        # ID_yava_nlu_spacy_sm="$( docker images | grep 'yava-nlu-spacy-sm' | awk '{print $3}' )"

        # docker tag $ID_yava_nlu_spacy_md md76/yava-nlu-spacy:$YAVA_VERSION-en-md
        # docker tag $ID_yava_nlu_spacy_sm md76/yava-nlu-spacy:$YAVA_VERSION-en-sm

        docker push md76/yava-nlu-spacy:$YAVA_VERSION-en-md
        docker push md76/yava-nlu-spacy:$YAVA_VERSION-en-sm
    fi

    # ------------------------- NLP LIGHT -----------------------
    if [ "$i" == "nlp-light-arm" ]; then
        # cd nlu-light
        # docker build -t yava-nlu-light-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_nlu_light_arm="$( docker images | grep 'yava-nlu-light-arm' | awk '{print $3}' )"
        # docker tag $ID_yava_nlu_light_arm md76/yava-nlu-light:$YAVA_VERSION-arm
        docker push md76/yava-nlu-light:$YAVA_VERSION-arm
    fi

    if [ "$i" == "nlp-light-amd64" ]; then
        # cd nlu-light
        # docker build -t yava-nlu-light .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_nlu_light="$( docker images | grep 'yava-nlu-light' | awk '{print $3}' )"
        # docker tag $ID_yava_nlu_light md76/yava-nlu-light:$YAVA_VERSION
        docker push md76/yava-nlu-light:$YAVA_VERSION
    fi

    # ------------------------- MOSQUITTO -----------------------
    if [ "$i" == "nlp-mosquitto-arm" ]; then
        # cd mosquitto
        # docker build -t yava-mosquitto-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_mosquitto_arm="$( docker images | grep 'yava-mosquitto-arm' | awk '{print $3}' )"
        # docker tag $ID_yava_mosquitto_arm md76/yava-mosquitto:$YAVA_VERSION-arm
        docker push md76/yava-mosquitto:$YAVA_VERSION-arm
    fi

    if [ "$i" == "nlp-mosquitto-amd64" ]; then
        # cd mosquitto
        # docker build -t yava-mosquitto-amd64 .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_mosquitto="$( docker images | grep 'yava-mosquitto-amd64' | awk '{print $3}' )"
        # docker tag $ID_yava_mosquitto md76/yava-mosquitto:$YAVA_VERSION
        docker push md76/yava-mosquitto:$YAVA_VERSION
    fi

    # ------------------------- CAPTURE SPEECH -----------------------
    if [ "$i" == "capture-speech-arm" ]; then
        # cd capture-speech
        # docker build -t yava-capture-speech-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_capture_speech_arm="$( docker images | grep 'yava-capture-speech-arm' | awk '{print $3}' )"
        # docker tag $ID_yava_capture_speech_arm md76/yava-capture-speech:$YAVA_VERSION-arm
        docker push md76/yava-capture-speech:$YAVA_VERSION-arm
    fi

    if [ "$i" == "capture-speech-amd64" ]; then
        # cd capture-speech
        # docker build -t yava-capture-speech .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_capture_speech="$( docker images | grep 'yava-capture-speech' | awk '{print $3}' )"
        # docker tag $ID_yava_capture_speech md76/yava-capture-speech:$YAVA_VERSION
        docker push md76/yava-capture-speech:$YAVA_VERSION
    fi

    # ------------------------- HOTWORD PORCUPINE -----------------------
    if [ "$i" == "hotword-porcupine-arm" ]; then
        # cd hotword-porcupine
        # docker build -t yava-hotword-porcupine-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_hotword_porcupine_arm="$( docker images | grep 'yava-hotword-porcupine-arm' | awk '{print $3}' )"
        # docker tag $ID_yava_hotword_porcupine_arm md76/yava-hotword-porcupine:$YAVA_VERSION-arm
        docker push md76/yava-hotword-porcupine:$YAVA_VERSION-arm
    fi

    if [ "$i" == "hotword-porcupine-amd64" ]; then
        # cd hotword-porcupine
        # docker build -t yava-hotword-porcupine .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_hotword_porcupine="$( docker images | grep 'yava-hotword-porcupine' | awk '{print $3}' )"
        # docker tag $ID_yava_hotword_porcupine md76/yava-hotword-porcupine:$YAVA_VERSION
        docker push md76/yava-hotword-porcupine:$YAVA_VERSION
    fi

    # ------------------------- HOTWORD SNOWBOY -----------------------
    if [ "$i" == "hotword-snowboy-arm" ]; then
        # cd hotword-snowboy
        # docker build -t yava-hotword-snowboy-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_hotword_snowboy_arm="$( docker images | grep 'yava-hotword-snowboy-arm' | awk '{print $3}' )"
        # docker tag $ID_yava_hotword_snowboy_arm md76/yava-hotword-snowboy:$YAVA_VERSION-arm
        docker push md76/yava-hotword-snowboy:$YAVA_VERSION-arm
    fi

    if [ "$i" == "hotword-snowboy-amd64" ]; then
        # cd hotword-snowboy
        # docker build -t yava-hotword-snowboy .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_hotword_snowboy="$( docker images | grep 'yava-hotword-snowboy' | awk '{print $3}' )"
        # docker tag $ID_yava_hotword_snowboy md76/yava-hotword-snowboy:$YAVA_VERSION
        docker push md76/yava-hotword-snowboy:$YAVA_VERSION
    fi

    # ------------------------- ORCHESTRATOR -----------------------
    if [ "$i" == "orchestrator-arm" ]; then
        # cd orchestrator
        # docker build -t yava-orchestrator-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_orchestrator_arm="$( docker images | grep 'yava-orchestrator-arm' | awk '{print $3}' )"
        # docker tag $ID_yava_orchestrator_arm md76/yava-orchestrator:$YAVA_VERSION-arm
        docker push md76/yava-orchestrator:$YAVA_VERSION-arm
    fi

    if [ "$i" == "orchestrator-amd64" ]; then
        # cd orchestrator
        # docker build -t yava-orchestrator .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_orchestrator="$( docker images | grep 'yava-orchestrator' | awk '{print $3}' )"
        # docker tag $ID_yava_orchestrator md76/yava-orchestrator:$YAVA_VERSION
        docker push md76/yava-orchestrator:$YAVA_VERSION
    fi

    # ------------------------- STT GOOGLE -----------------------
    if [ "$i" == "stt-google-arm" ]; then
        # cd stt-google
        # docker build -t yava-stt-google-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_stt_google_arm="$( docker images | grep 'yava-stt-google-arm' | awk '{print $3}' )"
        # docker tag $ID_yava_stt_google_arm md76/yava-stt-google:$YAVA_VERSION-arm
        docker push md76/yava-stt-google:$YAVA_VERSION-arm
    fi

    if [ "$i" == "stt-google-amd64" ]; then
        # cd stt-google
        # docker build -t yava-stt-google .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_stt_google="$( docker images | grep 'yava-stt-google' | awk '{print $3}' )"
        # docker tag $ID_yava_stt_google md76/yava-stt-google:$YAVA_VERSION
        docker push md76/yava-stt-google:$YAVA_VERSION
    fi

    # ------------------------- STT POCKETSPHINX -----------------------
    if [ "$i" == "stt-pocketsphinx-arm" ]; then
        # cd stt-pocketsphinx
        # docker build -t yava-stt-pocketsphinx-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_stt_pocketsphinx_arm="$( docker images | grep 'yava-stt-pocketsphinx-arm' | awk '{print $3}' )"
        # docker tag $ID_yava_stt_pocketsphinx_arm md76/yava-stt-pocketsphinx:$YAVA_VERSION-arm
        docker push md76/yava-stt-pocketsphinx:$YAVA_VERSION-arm
    fi

    if [ "$i" == "stt-pocketsphinx-amd64" ]; then
        # cd stt-pocketsphinx
        # docker build -t yava-stt-pocketsphinx .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_stt_pocketsphinx="$( docker images | grep 'yava-stt-pocketsphinx' | awk '{print $3}' )"
        # docker tag $ID_yava_stt_pocketsphinx md76/yava-stt-pocketsphinx:$YAVA_VERSION
        docker push md76/yava-stt-pocketsphinx:$YAVA_VERSION
    fi

    # ------------------------- STT WIT -----------------------
    if [ "$i" == "stt-wit-arm" ]; then
        # cd stt-wit
        # docker build -t yava-stt-wit-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_stt_wit_arm="$( docker images | grep 'yava-stt-wit-arm' | awk '{print $3}' )"
        # docker tag $ID_yava_stt_wit_arm md76/yava-stt-wit:$YAVA_VERSION-arm
        docker push md76/yava-stt-wit:$YAVA_VERSION-arm
    fi

    if [ "$i" == "stt-wit-amd64" ]; then
        # cd stt-wit
        # docker build -t yava-stt-wit .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_stt_wit="$( docker images | grep 'yava-stt-wit' | awk '{print $3}' )"
        # docker tag $ID_yava_stt_wit md76/yava-stt-wit:$YAVA_VERSION
        docker push md76/yava-stt-wit:$YAVA_VERSION
    fi

    # ------------------------- TTS MIMIC -----------------------
    if [ "$i" == "tts-mimic-arm" ]; then
        # cd tts-mimic
        # docker build -t yava-tts-mimic-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_tts_mimic_arm="$( docker images | grep 'yava-tts-mimic-arm' | awk '{print $3}' )"
        # docker tag $ID_yava_tts_mimic_arm md76/yava-tts-mimic:$YAVA_VERSION-arm
        docker push md76/yava-tts-mimic:$YAVA_VERSION-arm
    fi

    if [ "$i" == "tts-mimic-amd64" ]; then
        # cd tts-mimic
        # docker build -t yava-tts-mimic .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_yava_tts_mimic="$( docker images | grep 'yava-tts-mimic' | awk '{print $3}' )"
        # docker tag $ID_yava_tts_mimic md76/yava-tts-mimic:$YAVA_VERSION
        docker push md76/yava-tts-mimic:$YAVA_VERSION
    fi
done
