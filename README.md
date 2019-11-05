# Private Voice Assistant

The __Private Voice Assistant__ (aka. __PVA__) is designed to run on a Raspberry Pi 2/3. I have not tested it on a Raspberry Pi 4 or Zero, so if you do test it on those platforms, please let me know how it goes. 

## Why another voice assistant?

There are plenty of voice assistants out there, even a couple of completely open source once. The work they have done is great and some of them where a source of inspiration for this project.  

Nevertheless, sometimes you need more out of your assistant than the usual __hotword__ => __command capture__ => __intent matching__ => __action__ kind of workflow. Maybe you would like to skip the `hotword` detection part, and use the assistant on specific components of the overall architecture only.  

Let's say you are building a robot that for some reason decides to interact with you (ex. on environemental sensor trigger, or simply because of a custom event you defined), rather than you asking him to listen to you command when you need him with a hotword. Or let's say you want to capture the transcribed text from your speech without it going through the NLU component for intent and entity matching. Or even better, you want to use two speech to text engines in your solution, one to run offline on the device for privacy, and one for accurate transcription on the cloud for specific commands within your application flow.  

You see, there are alot of situations where you need flexibility of the solution in order to achieve certain goals, and that's what this project is focusing on.    

## Some of the key features

- Plug & play composable architecture, flexible and extensible
- More control over the voice assistant toolset workflow
- NodeJS & Python client libraries, ready to use
- Possibility to transcribe text without NLU matching on demand
- Possibility to hyjack and control the assistant from your application, rather than from a hotword
- Possibility to use 2 separate speech to text engines for customized workflows

## Install

### Prerequisit

Start from a clean Raspbian stretch light installation, enable SSH and connect the device to the internet. This part is out of scope for this README, please refer to the Raspberry Pi website for more details. 

#### Install GIT

To clone this repo, you will need GIT. you can install it with the following command:

```shell
sudo apt-get update
sudo apt-get install git
```

#### Microphone setup

You will need a decent microphone for this. I am using the ReSpeeker Microphon Array with the firmware updated to it's latest version (the default firmware did not work out of the box), with pritty good results.  

First, we need to configure the microphone & speaker on your Raspberry Pi. To do so, create / edit the file `.asoundrc` in your home folder, and enter the following content:

```
pcm.!default {
  type asym
   playback.pcm {
     type plug
     slave.pcm "hw:0,0"
   }
   capture.pcm {
     type plug
     slave.pcm "hw:1,0"
   }
}
```

> This will use the USB microphone array as the default recording device, and the 3.5 jack output on the Raspberry Pi as the default audio output. If your setup is different from mine, you wight have to adjust those settings. If you are not sure about the audio devices available on your device, You can list them using the command `aplay -l`.

If your audio volume seems too low, then you probably need to adjust it. You can do this using the command `alsamixer`.

#### Install Docker

Simply run the following command to install Docker:

```shell
curl -fsSL get.docker.com -o get-docker.sh && sh get-docker.sh
```

Finally, add your user to the docker user group:

```shell
sudo usermod -aG docker pi
```

#### Install Docker Compose

For docker-compose, we will use `pip` to install it on our Raspberry Pi. Therefore we need to install it first, and then install docker-compose:

```shell
sudo apt-get -y install python-setuptools && sudo easy_install pip && sudo pip install docker-compose
```

### Install the Private Voice Assistant

Clone the repository to your Raspberry Pi:

```shell
git clone https://github.com/mdundek/private-voice-assistant.git
```

## Setup

<!-- Start by applying permissions to all shared folders and files used by docker compose

```shell
find ./files -type d -exec sudo chmod 755 {} \;
find ./files -type f -exec sudo chmod 755 {} \;
``` -->

### PVA components

The assistant uses docker-compose, and requires the following containers to function:

- __1. Hotword detector__: Trigger on hotword detected by the user
- __2. Speech capture__: Capture the spocken voice command from the user over the microphone
- __3. Speech to text__: Transcribe the spocken voice into machine readable text
- __4. NLU__: Naturtal Language Understanding for intent classification and named entity extraction
- __5. Text to speech__: Convert text into voice and play it back over the speaker
- __6. Ortchestrator__: The heart of the solution, that orchestrates all other components
- __7. MQTT broker__: The Mosquitto message bus used for component communication


Before you can go ahead and start up the assistant, you will have to prepare and set up some configuration files first. 

### Prepare your configuration files

All configuration files are to be placed under the `resources`folder of this repository, according to the specific container.  

In some cases, you will also have to configure the `docker-compose` __yaml__ file, I will document those parts for each docker image available for the solution.  
This file is called `docker-compose.yml`, and is situated at the root of this repository.

#### 1. Hotword detector

At the moment, I created two different hotword detector images:

- __Snowboy__: Well known hotword detector framework
- __Porcupine__: A more recent hotword detector that shows promise

Choose one of the two that you would like to use in your project, and configure it.

##### Configure Snowboy

Grab a model if you don't want to use the default one (Hey Alice). To do so, download a public hotword from the Snowboy website, or generate your own private hotword on their website. Download the hotword file to the folder `resources/snowboy/models`. By default, there is a model file in this folder called `Hotword.pmdl`, that is trained for the trigger phrase `Hey Alice`.  
Attention, only one hotword file is allowed the `resources/snowboy/models` folder. So if you download your own hotword file, please delete the default hotword file first.

> IMPORTANT: If you are planning to commercialize your solution, you will need to get a license from the Snowboy team.

In the `docker-compose.yml` config file, locate and uncomment the block that is used for __Snowboy__:  

```yaml
  pva-hotword:
    image: md76/pva-hotword-snowboy:0.9-arm
    restart: always
    container_name: pva-hotword
    devices:
      - /dev/snd:/dev/snd
    networks:
      - pva-network
    volumes:
      - ./resources/snowboy/models/<YOUR HOTWORD MODEL FILE>:/usr/src/app/models/Hotword.pmdl
    depends_on:
      - pva-mosquitto
```

Replace the `<YOUR HOTWORD MODEL FILE>` section with the actual file you downloaded from the Snowboy website, otherwise set it as `Hotword.pmdl`for the default `Hey Alice`hotword.


##### Configure Porcupine

By default, Porcupine comes with the following available hotwords out of the box:  

`americano`, `blueberry`, `bumblebee`, `grapefruit`, `grasshopper`, `hey pico`, `picovoice`, `porcupine`, `terminator`

In the `docker-compose.yml` config file, locate and uncomment the block that is used for __porcupine__:  

```yaml
  pva-hotword:
    image: md76/pva-hotword-porcupine:0.9-arm
    restart: always
    container_name: pva-hotword
    environment:
      - SYSTEM_HOTWORDS=hey pico,grapefruit,grasshopper
    devices:
      - /dev/snd:/dev/snd
    networks:
      - pva-network
    depends_on:
      - pva-mosquitto
```

Update the environement variable `SYSTEM_HOTWORDS` according to your needs, based on the available public hotwords listed above.   

> At the time being, custom hotwords with Porcupine are not possible. If someone has purchased a custom hotword from them, and would like to use it, please contact me and I will update the image and documentation accordingly 

### 2. Speech capture

You do not need to configure this one, it should work as intended out of the box


### 3. Speech to text

At the moment, I created three different speech to text images:

- __Pocketsphinx__: A fully offline based STT engine, running on small footprint devices such as the Raspberry Pi. Medium accuracy, but good enougth for simple intent classification. You can also use custom models if you like, in case you trained your own custom domain model, or if you wish to use different languages than English
- __WIT__: A free, cloud based STT engine, good accuracy
- __Google Cloud__: The best accuracy, you get 60 minutes free every month, past that the service will cost you 

Choose one of the three as your main TTS engine, and configure it. Optionally, you can set up a second STT engine that can be used on demand using the APIs.

##### Configure Pocketsphinx STT

By default, I added an English US model that requires no configuration to be used.  
In the `docker-compose.yml` config file, locate and uncomment the block that is used for __Pocketsphinx STT__:


```yaml
  pva-stt:
    image: pva-stt-pocketsphinx:0.9-arm
    restart: always
    container_name: pva-stt
    environment:
      - PSX_LANGUAGE_PATH=model/en-us
      - PSX_HMM_PATH=model/en-us/en-us
      - PSX_LM_FILE=model/en-us/en-us.lm.bin
      - PSX_DICT_FILE=model/en-us/cmudict-en-us.dict
    volumes:
      - ./resources/pocketsphinx/model:/usr/src/app/model
    networks:
      - pva-network
    depends_on:
      - pva-mosquitto
```

To use a different language model, place it under the `resources/pocketsphinx/model` folder, and update the compose configuration block accordingly.


##### Configure WIT STT

WIT is a free, cloud based voice assistant solution that also has STT APIs. This is a good compromise if you don't care about privacy, and would like something that is completely free no matter how much you use it (there are of course common sence limits imposed by WIT). The response time is not as good as what Google has to offer, but then again, it's free!  

You have to create an account on the WIT website first, and generate an API key. You can set your language in your WIT web console, under your WIT application directly. This language will be bound to your API key.  
Once you have your API key, paste it in a file named `key.txt`, in the folder `resources/wit/`

In the `docker-compose.yml` config file, locate and uncomment the block that is used for __WIT STT__:

```yaml
  pva-stt:
    image: pva-stt-wit:0.9-arm
    restart: always
    container_name: pva-stt
    volumes:
      - ./resources/wit/key.txt:/usr/src/app/key.txt
    networks:
      - pva-network
    depends_on:
      - pva-mosquitto
```

##### Configure Google STT

Google has the best performance and accuracy of the three solutions, but it is not free to use once you passed the 60 min / month barrier.  
You will first have to create a Google Cloud Service Account Key, and download the json file. For more information, please refer to the google documentation [here](https://cloud.google.com/speech-to-text/docs/reference/libraries). Also, donrt forget to enable the Google Cloud Speech API in your GCP console.  
Once you have the JSON key file, place it under the folder `resources/google/`, and rename it `credentials.json`.

In the `docker-compose.yml` config file, locate and uncomment the block that is used for __Google STT__:

```yaml
pva-stt:
    image: pva-stt-google:0.9-arm
    restart: always
    container_name: pva-stt
    volumes:
      - ./resources/google/credentials.json:/usr/src/app/credentials.json
    networks:
      - pva-network
    depends_on:
      - pva-mosquitto
```

#### OPTIONAL: Configure a second STT container

If you want to use two speech to text engines in your solution, one to run offline on the device for privacy for example, and one for accurate transcription on the cloud for specific commands within your application flow, then read on.  

In the `docker-compose.yml` config file, locate and uncomment the block that you want to use for your secondary __*** STT__ engine, and modify it like in the example below:

```yaml
pvi-stt-alt:
    image: pvi-stt-google:0.9-arm
    restart: always
    container_name: pvi-stt-alt
    environment:
      - STT_ALT=1
    volumes:
      - ./resources/google/credentials.json:/usr/src/app/credentials.json
    networks:
      - pvi-network
    depends_on:
      - pvi-mosquitto
```

Note the `-alt` part appended to the block name as well as to the container name, and the extra environement variable set as `STT_ALT=1`. Those modifications apply to any of the three STT engines available.  

To see how you can use the secondary STT engine, refer to the section How to use the PVA client API.

### 4. NLU

At the moment, I created two different NLU processing images:

- __NLU light__: this is a lightweight NLU engine that I based on a NPM module called node-nlp. It uses the levenshtein distance algorythms to determine intent classification, which is the best option when you do not have huge amounts of training data. It also has a small CPU / memory footprint and is ideal for devices such as the Raspberry Pi. Named Entity Resolution (NER) is the more difficult part of NLP, and requires alot of available memory if you wish to do this using Deep Learning based aproaches. node-nlp uses the __enumeration__ based Named Entities configuration, which is not capable of identifying entities that are not part of the training set.
- __NLU Spacy__: This NLP¨engine is similar to the one above, but uses Spacy for Named Entity Resolution. This will hardly run on a Raspberry Pi 2/3, but it might be a good option for a Raspberry Pi 4 with at least 2GB of memory (to be tested). The advantage here is that Spacy, once trained, can recognize entities that did not necessarily apear in your training data, making it a more resilient solution for broader use cases.

Choose one of the two as your main NLP engine, and configure it. 

##### Configure NLU (Light & Spacy)

First, you need to create your NLU training data. There is a sample training data file that you can get inspiration from here: `resources/nlu/training_data/training_example.yaml`.

__placeholders__: Can be used to generate training sets with placeholders. Rather than creating one example utterance for each variant of a sentance sub section, list those variants in a named placeholder node and reference it in your training utterance. 

__entities__: Just like placeholders, but for Entities you would like to detect in your text.

__intents__: List your intents here, and provide samples utterances that a user might ask. Tag the Entities in those utterances to train the engine so that it can recognize them.

---

To train your model, you will have to use a the appropriate docker image. Please read on for more details.

##### Train model for NLU Light

Once you have finished your training set definitions, run the following command from the root of this repository:  

```
docker run --rm -v $PWD/resources/nlu/models:/usr/src/app/models -v $PWD/resources/nlu/training_data/<YOUR TRAINING YAML FILE>:/usr/src/app/training_data/train.yaml md76/pva-nlu-light:0.9-arm python train.py
```

Replace the `<YOUR TRAINING YAML FILE>` part fith the name of your training yaml file.
Once the training is done, you will see a new file in the folder `resources/nlu/models/intents/model.nlp`.


##### Train model for NLU Spacy

Once you have finished your training set definitions, run the following command from the root of this repository:  

```
docker run --rm -v $PWD/resources/nlu/models:/usr/src/app/models -v $PWD/resources/nlu/training_data/<YOUR TRAINING YAML FILE>:/usr/src/app/training_data/train.yaml md76/pva-nlu-spacy:0.9-arm python train.py
```

Replace the `<YOUR TRAINING YAML FILE>` part fith the name of your training yaml file.
Once the training is done, you will see a new files in the folder `resources/nlu/models/intents/`, as well as spacy entity models in the folder `resources/nlu/models/entities/`.

> WARNING: Spacy takes a long time to train your model, especially on a Raspberry Pi 2/3. This might be a bit better on a Raspberry Pi 4 (again, to be tested).
> You can also use a more powerfull machine to train your model, and move the model over to your Raspberry Pi in the folders `resources/nlu/models/intents/` and `resources/nlu/models/entities/`.  
> Do do so, use the docker image tag `0.9` rather than `0.9-arm`.

<!-- ## Usage

### WIT speech to text

You can set your language in your WIT application directly. This language will be bound to your API key


### NLU

First, configure your NLU training data located at `files/nlu/training_data/train.yaml`. This consists of specifying your sample utterances for intent recognition and entity definitions.  
Depending on your needs, you can use the `nlu-light` docker image if running on a low powered device such as the raspberry pi, or the `nlu-spacy` docker image for more ambitious NLU needs. The main difference is that `nlu-spacy` will be able to recognize entities that you have not trained for specifically, making it a more robust and flexible solution.  

`nlu-spacy` requires at least 2GB of memory, and a fast CPU is recommended for training. You can train your model on a more powerfull machine, transfer the model over to the target device and use it there if you like.

__Here is an example of a training set:__

```yaml
training:

  placeholders:
    health_states:
      - healthy
      - unhealthy
      - good for me
      - bad for me
      - good for you
      - bad for you
    question_sets:
      - Do you have
      - Are there
      - I am looking for

  entities:
    FOOD:
      - bread
      - candy
      - olive oil
      - potatos
    FOOD(S):
      - apples
      - eggs
      - snacks
      - nutella sticks
      - chocolat chip muffins

  intents:

    health:
      - "Are those [FOOD(S)] {health_states}"
      - "Is [FOOD] {health_states}"
      - "Are [FOOD(S)] {health_states}"
      - "Can you tell me if [FOOD(S)] are {health_states}"
      - "Is it {health_states} to eat [FOOD(S)]"
      - "Would you say that [FOOD] are {health_states}"
      - "Would you recommend [FOOD(S)]"

    availability:
      - "{question_sets} [FOOD(S)]"
      - "{question_sets} [FOOD(S)] available"
      - "{question_sets} some [FOOD(S)] available"
      - "{question_sets} [FOOD(S)] in stock"
      - "{question_sets} some [FOOD(S)] in stock"
      - "{question_sets} any [FOOD(S)] in stock"
      - "{question_sets} any more [FOOD(S)] to sell"
      - "{question_sets} [FOOD(S)], would you by any chance have some available"
```

#### Training your model

Use docker to train your model, here is how.

Execute the following command from the root of this repository:

```
docker run --rm \
    -v $PWD/files/nlu/models:/usr/src/app/models \
    -v $PWD/files/nlu/training_data/train.yaml:/usr/src/app/training_data/train.yaml \
    pvi-nlu-light \
    python train.py
``` -->









<!-- sudo docker tag cfcac9d99a05 md76/pva-orchestrator:0.9-arm
sudo docker tag d308ea75362b md76/pva-tts-mimic:0.9-arm
sudo docker tag e56239fe689f md76/pva-nlu-light:0.9-arm
sudo docker tag de0f5549d4d3 md76/pva-stt-google:0.9-arm
sudo docker tag 54746b8ee8b4 md76/pva-stt-wit:0.9-arm
sudo docker tag 8dd81d03acb6 md76/pva-stt-pocketsphinx:0.9-arm
sudo docker tag e33e199deca0 md76/pva-capture-speech:0.9-arm
sudo docker tag 3b75324b0016 md76/pva-hotword-snowboy:0.9-arm
sudo docker tag 345ff0fcc3d7 md76/pva-hotword-porcupine:0.9-arm

sudo docker push md76/pva-orchestrator:0.9-arm
sudo docker push md76/pva-tts-mimic:0.9-arm
sudo docker push md76/pva-nlu-light:0.9-arm
sudo docker push md76/pva-stt-google:0.9-arm
sudo docker push md76/pva-stt-wit:0.9-arm
sudo docker push md76/pva-stt-pocketsphinx:0.9-arm
sudo docker push md76/pva-capture-speech:0.9-arm
sudo docker push md76/pva-hotword-snowboy:0.9-arm
sudo docker push md76/pva-hotword-porcupine:0.9-arm -->



<!-- sudo docker tag e56239fe689f md76/pva-nlu-spacy:0.9-en-md -->
<!-- sudo docker push md76/pva-nlu-spacy:0.9-en-md -->

<!-- sudo docker tag e56239fe689f md76/pva-nlu-spacy:0.9-en-sm-arm -->
<!-- sudo docker push md76/pva-nlu-spacy:0.9-en-sm-arm -->