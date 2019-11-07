#!/bin/bash

args=("$@")

if [ ${#args[@]} -eq 0 ]; then
    echo "Usage: PVA_VERSION=x.x.x ./build_tag_push.sh nlp-spacy-arm nlp-light-arm nlp-mosquitto-arm capture-speech-arm hotword-porcupine-arm hotword-snowboy-arm orchestrator-arm stt-google-arm stt-pocketsphinx-arm stt-wit-arm tts-mimic-arm"
    exit 0
fi

if [[ -z "${PVA_VERSION}" ]]; then
  PVA_VERSION="0.9.1"
fi

BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $BASE_DIR

PVA_VERSION=$PVA_VERSION ./build_tag.sh $@

for i in "${args[@]}"
do
    # ------------------------- NLP SPACY -----------------------
    if [ "$i" == "nlp-spacy-arm" ]; then
        # cd nlu-spacy
        # docker build --build-arg BUILDTIME_LANGUAGE=en --build-arg BUILDTIME_SPACY_MODEL=en_core_web_md -t pva-nlu-spacy-arm-md .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # docker build --build-arg BUILDTIME_LANGUAGE=en --build-arg BUILDTIME_SPACY_MODEL=en_core_web_sm -t pva-nlu-spacy-arm-sm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..

        # ID_pva_nlu_spacy_arm_md="$( docker images | grep 'pva-nlu-spacy-arm-md' | awk '{print $3}' )"
        # ID_pva_nlu_spacy_arm_sm="$( docker images | grep 'pva-nlu-spacy-arm-sm' | awk '{print $3}' )"

        # docker tag $ID_pva_nlu_spacy_arm_md md76/pva-nlu-spacy:$PVA_VERSION-en-md-arm
        # docker tag $ID_pva_nlu_spacy_arm_sm md76/pva-nlu-spacy:$PVA_VERSION-en-sm-arm

        docker push md76/pva-nlu-spacy:$PVA_VERSION-en-md-arm
        docker push md76/pva-nlu-spacy:$PVA_VERSION-en-sm-arm
    fi

    if [ "$i" == "nlp-spacy-amd64" ]; then
        # cd nlu-spacy
        # docker build --build-arg BUILDTIME_LANGUAGE=en --build-arg BUILDTIME_SPACY_MODEL=en_core_web_md -f ./DockerfileNoARM.txt -t pva-nlu-spacy-md .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # docker build --build-arg BUILDTIME_LANGUAGE=en --build-arg BUILDTIME_SPACY_MODEL=en_core_web_sm -f ./DockerfileNoARM.txt -t pva-nlu-spacy-sm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..

        # ID_pva_nlu_spacy_md="$( docker images | grep 'pva-nlu-spacy-md' | awk '{print $3}' )"
        # ID_pva_nlu_spacy_sm="$( docker images | grep 'pva-nlu-spacy-sm' | awk '{print $3}' )"

        # docker tag $ID_pva_nlu_spacy_md md76/pva-nlu-spacy:$PVA_VERSION-en-md
        # docker tag $ID_pva_nlu_spacy_sm md76/pva-nlu-spacy:$PVA_VERSION-en-sm

        docker push md76/pva-nlu-spacy:$PVA_VERSION-en-md
        docker push md76/pva-nlu-spacy:$PVA_VERSION-en-sm
    fi

    # ------------------------- NLP LIGHT -----------------------
    if [ "$i" == "nlp-light-arm" ]; then
        # cd nlu-light
        # docker build -t pva-nlu-light-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_nlu_light_arm="$( docker images | grep 'pva-nlu-light-arm' | awk '{print $3}' )"
        # docker tag $ID_pva_nlu_light_arm md76/pva-nlu-light:$PVA_VERSION-arm
        docker push md76/pva-nlu-light:$PVA_VERSION-arm
    fi

    if [ "$i" == "nlp-light-amd64" ]; then
        # cd nlu-light
        # docker build -t pva-nlu-light .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_nlu_light="$( docker images | grep 'pva-nlu-light' | awk '{print $3}' )"
        # docker tag $ID_pva_nlu_light md76/pva-nlu-light:$PVA_VERSION
        docker push md76/pva-nlu-light:$PVA_VERSION
    fi

    # ------------------------- MOSQUITTO -----------------------
    if [ "$i" == "nlp-mosquitto-arm" ]; then
        # cd mosquitto
        # docker build -t pva-mosquitto-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_mosquitto_arm="$( docker images | grep 'pva-mosquitto-arm' | awk '{print $3}' )"
        # docker tag $ID_pva_mosquitto_arm md76/pva-mosquitto:$PVA_VERSION-arm
        docker push md76/pva-mosquitto:$PVA_VERSION-arm
    fi

    if [ "$i" == "nlp-mosquitto-amd64" ]; then
        # cd mosquitto
        # docker build -t pva-mosquitto-amd64 .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_mosquitto="$( docker images | grep 'pva-mosquitto-amd64' | awk '{print $3}' )"
        # docker tag $ID_pva_mosquitto md76/pva-mosquitto:$PVA_VERSION
        docker push md76/pva-mosquitto:$PVA_VERSION
    fi

    # ------------------------- CAPTURE SPEECH -----------------------
    if [ "$i" == "capture-speech-arm" ]; then
        # cd capture-speech
        # docker build -t pva-capture-speech-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_capture_speech_arm="$( docker images | grep 'pva-capture-speech-arm' | awk '{print $3}' )"
        # docker tag $ID_pva_capture_speech_arm md76/pva-capture-speech:$PVA_VERSION-arm
        docker push md76/pva-capture-speech:$PVA_VERSION-arm
    fi

    if [ "$i" == "capture-speech-amd64" ]; then
        # cd capture-speech
        # docker build -t pva-capture-speech .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_capture_speech="$( docker images | grep 'pva-capture-speech' | awk '{print $3}' )"
        # docker tag $ID_pva_capture_speech md76/pva-capture-speech:$PVA_VERSION
        docker push md76/pva-capture-speech:$PVA_VERSION
    fi

    # ------------------------- HOTWORD PORCUPINE -----------------------
    if [ "$i" == "hotword-porcupine-arm" ]; then
        # cd hotword-porcupine
        # docker build -t pva-hotword-porcupine-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_hotword_porcupine_arm="$( docker images | grep 'pva-hotword-porcupine-arm' | awk '{print $3}' )"
        # docker tag $ID_pva_hotword_porcupine_arm md76/pva-hotword-porcupine:$PVA_VERSION-arm
        docker push md76/pva-hotword-porcupine:$PVA_VERSION-arm
    fi

    if [ "$i" == "hotword-porcupine-amd64" ]; then
        # cd hotword-porcupine
        # docker build -t pva-hotword-porcupine .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_hotword_porcupine="$( docker images | grep 'pva-hotword-porcupine' | awk '{print $3}' )"
        # docker tag $ID_pva_hotword_porcupine md76/pva-hotword-porcupine:$PVA_VERSION
        docker push md76/pva-hotword-porcupine:$PVA_VERSION
    fi

    # ------------------------- HOTWORD SNOWBOY -----------------------
    if [ "$i" == "hotword-snowboy-arm" ]; then
        # cd hotword-snowboy
        # docker build -t pva-hotword-snowboy-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_hotword_snowboy_arm="$( docker images | grep 'pva-hotword-snowboy-arm' | awk '{print $3}' )"
        # docker tag $ID_pva_hotword_snowboy_arm md76/pva-hotword-snowboy:$PVA_VERSION-arm
        docker push md76/pva-hotword-snowboy:$PVA_VERSION-arm
    fi

    if [ "$i" == "hotword-snowboy-amd64" ]; then
        # cd hotword-snowboy
        # docker build -t pva-hotword-snowboy .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_hotword_snowboy="$( docker images | grep 'pva-hotword-snowboy' | awk '{print $3}' )"
        # docker tag $ID_pva_hotword_snowboy md76/pva-hotword-snowboy:$PVA_VERSION
        docker push md76/pva-hotword-snowboy:$PVA_VERSION
    fi

    # ------------------------- ORCHESTRATOR -----------------------
    if [ "$i" == "orchestrator-arm" ]; then
        # cd orchestrator
        # docker build -t pva-orchestrator-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_orchestrator_arm="$( docker images | grep 'pva-orchestrator-arm' | awk '{print $3}' )"
        # docker tag $ID_pva_orchestrator_arm md76/pva-orchestrator:$PVA_VERSION-arm
        docker push md76/pva-orchestrator:$PVA_VERSION-arm
    fi

    if [ "$i" == "orchestrator-amd64" ]; then
        # cd orchestrator
        # docker build -t pva-orchestrator .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_orchestrator="$( docker images | grep 'pva-orchestrator' | awk '{print $3}' )"
        # docker tag $ID_pva_orchestrator md76/pva-orchestrator:$PVA_VERSION
        docker push md76/pva-orchestrator:$PVA_VERSION
    fi

    # ------------------------- STT GOOGLE -----------------------
    if [ "$i" == "stt-google-arm" ]; then
        # cd stt-google
        # docker build -t pva-stt-google-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_stt_google_arm="$( docker images | grep 'pva-stt-google-arm' | awk '{print $3}' )"
        # docker tag $ID_pva_stt_google_arm md76/pva-stt-google:$PVA_VERSION-arm
        docker push md76/pva-stt-google:$PVA_VERSION-arm
    fi

    if [ "$i" == "stt-google-amd64" ]; then
        # cd stt-google
        # docker build -t pva-stt-google .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_stt_google="$( docker images | grep 'pva-stt-google' | awk '{print $3}' )"
        # docker tag $ID_pva_stt_google md76/pva-stt-google:$PVA_VERSION
        docker push md76/pva-stt-google:$PVA_VERSION
    fi

    # ------------------------- STT POCKETSPHINX -----------------------
    if [ "$i" == "stt-pocketsphinx-arm" ]; then
        # cd stt-pocketsphinx
        # docker build -t pva-stt-pocketsphinx-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_stt_pocketsphinx_arm="$( docker images | grep 'pva-stt-pocketsphinx-arm' | awk '{print $3}' )"
        # docker tag $ID_pva_stt_pocketsphinx_arm md76/pva-stt-pocketsphinx:$PVA_VERSION-arm
        docker push md76/pva-stt-pocketsphinx:$PVA_VERSION-arm
    fi

    if [ "$i" == "stt-pocketsphinx-amd64" ]; then
        # cd stt-pocketsphinx
        # docker build -t pva-stt-pocketsphinx .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_stt_pocketsphinx="$( docker images | grep 'pva-stt-pocketsphinx' | awk '{print $3}' )"
        # docker tag $ID_pva_stt_pocketsphinx md76/pva-stt-pocketsphinx:$PVA_VERSION
        docker push md76/pva-stt-pocketsphinx:$PVA_VERSION
    fi

    # ------------------------- STT WIT -----------------------
    if [ "$i" == "stt-wit-arm" ]; then
        # cd stt-wit
        # docker build -t pva-stt-wit-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_stt_wit_arm="$( docker images | grep 'pva-stt-wit-arm' | awk '{print $3}' )"
        # docker tag $ID_pva_stt_wit_arm md76/pva-stt-wit:$PVA_VERSION-arm
        docker push md76/pva-stt-wit:$PVA_VERSION-arm
    fi

    if [ "$i" == "stt-wit-amd64" ]; then
        # cd stt-wit
        # docker build -t pva-stt-wit .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_stt_wit="$( docker images | grep 'pva-stt-wit' | awk '{print $3}' )"
        # docker tag $ID_pva_stt_wit md76/pva-stt-wit:$PVA_VERSION
        docker push md76/pva-stt-wit:$PVA_VERSION
    fi

    # ------------------------- TTS MIMIC -----------------------
    if [ "$i" == "tts-mimic-arm" ]; then
        # cd tts-mimic
        # docker build -t pva-tts-mimic-arm .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_tts_mimic_arm="$( docker images | grep 'pva-tts-mimic-arm' | awk '{print $3}' )"
        # docker tag $ID_pva_tts_mimic_arm md76/pva-tts-mimic:$PVA_VERSION-arm
        docker push md76/pva-tts-mimic:$PVA_VERSION-arm
    fi

    if [ "$i" == "tts-mimic-amd64" ]; then
        # cd tts-mimic
        # docker build -t pva-tts-mimic .
        # if [ $? -eq 0 ]; then
        #     echo "===> Build OK"
        # else
        #     exit 1
        # fi
        # cd ..
        # ID_pva_tts_mimic="$( docker images | grep 'pva-tts-mimic' | awk '{print $3}' )"
        # docker tag $ID_pva_tts_mimic md76/pva-tts-mimic:$PVA_VERSION
        docker push md76/pva-tts-mimic:$PVA_VERSION
    fi
done
