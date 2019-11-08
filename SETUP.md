# Configuration & Setup<a name="configure"></a>

## Table of contents

* [Prepare your configuration files](#prepare)
* [Hotword detector](#hotword)  
  * [Configure Snowboy](#snowboy)  
  * [Configure Porcupine](#porcupine)  	
* [Speech capture](#speechcapture)  	
* [Speech to text](#stt)  	
  * [Configure Pocketsphinx STT](#pocketsphinx)  
  * [Configure WIT STT](#wit)  	
  * [Configure Google STT](#googlestt)  
  * [Configure a second STT container (optional)](#secondarystt)  
* [NLU](#nlu)  
  * [Configure NLU Light](#nlulight)  
  * [Configure NLU Spacy](#nluspacy)  
* [Text to speech](#tts)  
* [Ortchestrator](#orchestrator)  
* [MQTT broker](#mqtt)  


The assistant uses `docker-compose` to orchestrate and manage the various containers.  
The following containers represent the mandatory elements required for the solution to function:

- __1. Hotword detector__: Trigger assistant when a hotword is detected
- __2. Speech capture__: Capture the spoken voice command from the user over the microphone
- __3. Speech to text__: Transcribe the spoken voice command into human readable text
- __4. NLU__: Naturtal Language Understanding for intent classification and named entity extraction
- __5. Text to speech__: Convert text into voice and play it back over the speaker
- __6. Ortchestrator__: The heart of the solution, that orchestrates all other components
- __7. MQTT broker__: The Mosquitto message bus used for internal communications  


Before you can go ahead and start up the assistant, you will have to prepare and set up some configuration files first. 

## Prepare your configuration files<a name="prepare"></a>

There are two places where you will have to set things up:  

1. Configuring components and select which once to use (which TTS engine, which NLU implementation...) is done directly in the `docker-compose.yml` file. I would recommend duplicating the template `docker-compose.yml` file and name it to something like `my-docker-compose.yml`. When you start the solution later non, you will simply have to point docker-compose to your specific file rather than using the default one (more on this [here](./USE.md#startassistant)).
  
2. To set up files required by the various components, such as API keys, certificates, language models... is done in the `resources` folder at the root of this repository

I will document how to set things up for each docker image below.

## 1. Hotword detector<a name="hotword"></a>

At the moment, I created two different hotword detector images:

- __Snowboy__: Well known hotword detector framework
- __Porcupine__: A more recent hotword detector that shows promise

Choose one of the two that you would like to use in your project, and configure it.

### Configure Snowboy<a name="snowboy"></a>

Grab a hotword model if you don't want to use the default one (Hey Alice). To do so, download a public hotword from [Snowboy](https://snowboy.kitt.ai/), or generate your own private hotword on their website. Download the hotword file to the folder `resources/snowboy/models`. By default, there is a model file in this folder called `Hotword.pmdl`, that is trained for the trigger phrase `Hey Alice`.  
Attention, only one hotword file can be used at a given time. So if you download your own hotword file, please make sure to reference it in the `(my-)docker-compose.yml` file under the component `yava-hotword`, that is specific to Snowboy.

> IMPORTANT: If you are planning to commercialize your solution, you will need to get a license from the Snowboy team.

In the `(my-)docker-compose.yml` config file, locate and uncomment the block that is used for __Snowboy__:  

```yaml
  yava-hotword:
    image: md76/yava-hotword-snowboy:0.9.1-arm
    restart: always
    container_name: yava-hotword
    devices:
      - /dev/snd:/dev/snd
    networks:
      - yava-network
    volumes:
      - ./resources/snowboy/models/<YOUR HOTWORD MODEL FILE>:/usr/src/app/models/Hotword.pmdl
    depends_on:
      - yava-orchestrator
```

Replace the `<YOUR HOTWORD MODEL FILE>` section with the actual file you downloaded from the Snowboy website, otherwise set it as `Hotword.pmdl`for the default `Hey Alice` hotword.


### Configure Porcupine<a name="porcupine"></a>

By default, Porcupine comes with the following available hotwords out of the box:  

- `americano`  
- `blueberry`  
- `bumblebee`  
- `grapefruit`  
- `grasshopper`  
- `hey pico`  
- `picovoice`  
- `porcupine`  
- `terminator`

In the `(my-)docker-compose.yml` config file, locate and uncomment the block that is used for __porcupine__:  

```yaml
  yava-hotword:
    image: md76/yava-hotword-porcupine:0.9.1-arm
    restart: always
    container_name: yava-hotword
    environment:
      - SYSTEM_HOTWORDS=hey pico,grapefruit,grasshopper
    devices:
      - /dev/snd:/dev/snd
    networks:
      - yava-network
    depends_on:
      - yava-orchestrator
```

Update the environement variable `SYSTEM_HOTWORDS` according to your needs, based on the available public hotwords listed above.   

> At the time being, custom hotwords with Porcupine are not implemented. If someone has purchased a custom hotword from them, and would like to use it, please contact me and I will update the image and documentation accordingly. 

## 2. Speech capture<a name="speechcapture"></a>

You do not need to configure this one, it should work as intended out of the box.  

That said, there is one environement variable you can set in the `(my-)docker-compose.yml` file called `MAX_PHRASE_LIMIT_SEC`. This represents the maximum length in seconds that a spoken sentance can be recorded for (default is 20 seconds). You can always change this value if necessary.

## 3. Speech to text<a name="stt"></a>

At the moment, there are three different speech to text images available:

- __`Pocketsphinx`__: A fully offline based STT engine, running on small footprint devices such as the Raspberry Pi. Medium accuracy, but good enougth for simple intent classification. You can also use custom models if you like, in case you trained your own custom domain model, or if you wish to use different languages than English  
  
- __`WIT`__: A free, cloud based STT engine with good accuracy  
  
- __`Google Cloud`__: The best accuracy, you get 60 minutes free every month, past that Google will bill you for it

Choose one of the three as your main TTS engine, and configure it. Optionally, you can set up a second STT engine that can be used on demand using the client APIs (for more information on this, check [here](#secondarystt)).

### Configure Pocketsphinx STT<a name="pocketsphinx"></a>

By default, I added an English US model that requires no configuration to be used. I did not package the smallest available model, since it's performance is too poor in my opignion. The downside is that this model takes some extra time to perform the STT on a small footprint device such as the Raspberry Pi. If you need something faster, you can always provide your own model files.  

In the `(my-)docker-compose.yml` config file, locate and uncomment the block that is used for __Pocketsphinx STT__:


```yaml
  yava-stt:
    image: md76/yava-stt-pocketsphinx:0.9.1-arm
    restart: always
    container_name: yava-stt
    environment:
      - PSX_LANGUAGE_PATH=model/en-us
      - PSX_HMM_PATH=model/en-us/en-us
      - PSX_LM_FILE=model/en-us/en-us.lm.bin
      - PSX_DICT_FILE=model/en-us/cmudict-en-us.dict
    volumes:
      - ./resources/pocketsphinx/model:/usr/src/app/model
    networks:
      - yava-network
    depends_on:
      - yava-orchestrator
```

To use a different language model, place it under the `resources/pocketsphinx/model` folder, and update the `(my-)docker-compose.yml` configuration block accordingly.


### Configure WIT STT<a name="wit"></a>

WIT is a free, cloud based voice assistant solution that also has a STT API. This is a good compromise if you don't care about privacy, and would like something that is completely free no matter how much you use it (there are of course common sence limits imposed by WIT). The response time is not as good as what Google has to offer, but it's good enougth and hey, it's free!  

You have to create an account on the [WIT](https://wit.ai/) website first, and generate an API key. You can set your language in your WIT web console, under your WIT application directly. This language will be bound to your API key.  
Once you have your API key, paste it in a file named `key.txt`, under the folder `resources/wit`  

In the `(my-)docker-compose.yml` config file, locate and uncomment the block that is used for __WIT STT__:

```yaml
  yava-stt:
    image: md76/yava-stt-wit:0.9.1-arm
    restart: always
    container_name: yava-stt
    volumes:
      - ./resources/wit/key.txt:/usr/src/app/key.txt
    networks:
      - yava-network
    depends_on:
      - yava-orchestrator
```

### Configure Google STT<a name="googlestt"></a>

Google has the best performance and accuracy of the three solutions, but it is not free to use once you passed the 60 min / month threshold.  
You will first have to create a Google Cloud Service Account Key, and download the json file. For more information, please refer to the google documentation [here](https://cloud.google.com/speech-to-text/docs/reference/libraries). Also, dont forget to enable the Google Cloud Speech API in your GCP console.  

Once you have the JSON key file, place it under the folder `resources/google/`, and rename it `credentials.json`.

In the `(my-)docker-compose.yml` config file, locate and uncomment the block that is used for __Google STT__:

```yaml
yava-stt:
    image: md76/yava-stt-google:0.9.1-arm
    restart: always
    container_name: yava-stt
    volumes:
      - ./resources/google/credentials.json:/usr/src/app/credentials.json
    networks:
      - yava-network
    depends_on:
      - yava-orchestrator
```

### Configure a second STT container (optional)<a name="secondarystt"></a>

If you want to use two speech to text engines in your solution, one to run offline on the device for privacy for example, and one for accurate transcriptions on the cloud for specific commands within your application flow, then read on.  

In the `(my-)docker-compose.yml` config file, locate and uncomment the block that you want to use for your secondary speech to text engine, and modify it like in the example below:

```yaml
yava-stt-alt:
    image: yava-stt-<XYZ>:0.9.1-arm
    restart: always
    container_name: yava-stt-alt
    environment:
      - STT_ALT=1
    ...
```

Note the `-alt` part appended to the block name as well as to the container name, and the extra environement variable set as `STT_ALT=1`. Those modifications apply to any of the three STT engines available. Make sur you replace the `<XYZ>` part with the actual STT engine of your choice. 

To see how you can use the secondary STT engine, refer to the section [How to use the YAVA client APIs](./USE.md#clientlib).

## 4. NLU<a name="nlu"></a>

At the moment, there are two different NLU processing images:

- __`NLU light`__: this is a lightweight NLU engine that I based on a NPM module called node-nlp. It uses the levenshtein distance algorythms to determine intent classification, which is the best option when you do not have huge amounts of training data. It also has a small CPU / memory footprint and is ideal for devices such as the Raspberry Pi. Named Entity Resolution (NER) is the more difficult part when it comes to NLU, and requires alot of available memory and CPU if you wish to do this using Deep Learning based aproaches. node-nlp uses an __enumeration__ based Named Entities configuration and matching, which is not capable of identifying entities that are not part of the training set. This will work just fine for domain specific use cases (ex. identify engine part names), but not so well if you need to capture a person name that you did not train for. In that case, you can always revert back to asking the user for the specific entity value, and use the client library to capture the response without going through the NLU engine. For more information on this, refer to the section [How to use the YAVA client APIs](./USE.md#clientlib).  
  
- __`NLU Spacy`__: This NLU engine is similar to the one above, but uses Spacy for `Named Entity Resolution` (aka. `NER`). This will hardly run on a Raspberry Pi 2/3, but it might be a good option for a Raspberry Pi 4 with at least 2GB of memory (to be tested). The advantage here is that Spacy, once trained, can recognize entities that did not necessarily apear in your training data, making it a more resilient solution for broader use cases.

Choose __one of the two__ as your main NLU engine, and configure it. 

### Configure NLU Light<a name="nlulight"></a>

In the `(my-)docker-compose.yml` config file, locate and uncomment the block that is used for __NLU Light__:

```yaml
  yava-nlu:
    image: md76/yava-nlu-light:0.9.1-arm
    restart: always
    container_name: yava-nlu
    networks:
      - yava-network
    volumes:
      - ./resources/nlu/models:/usr/src/app/models
      - ./resources/nlu/training_data/<YOUR TRAINING YAML FILE>:/usr/src/app/training_data/train.yaml
    environment:
      - LANGUAGE=en
    depends_on:
      - yava-orchestrator
```

Replace `<YOUR TRAINING YAML FILE>` with the actual name of your training yaml file. To read about how to write your NLU training file and train it before using the assistant, please refer to the section [Train your NLU model](./USE.md#train). 


### Configure NLU Spacy<a name="nluspacy"></a>

In the `(my-)docker-compose.yml` config file, locate and uncomment the block that is used for __NLU Spacy__:

```yaml
  yava-nlu:
    image: md76/yava-nlu-spacy:0.9.1-en-sm-arm
    restart: always
    container_name: yava-nlu
    networks:
      - yava-network
    volumes:
      - ./resources/nlu/models:/usr/src/app/models
    depends_on:
      - yava-orchestrator
```

> If you pay attention to the image tag used here, you will notice that we are using the tag `x.x.x-en-sm-arm`. This tag means that this image was build with the Spacy English model called `en_core_web_sm`, based on the ARM architecture. I also made other images available with larger base models such as `en_core_web_md` for better entity recognition, as well as some images build for AMD64 based architecture so that you can train your Spacy models on a different machine that the Raspberry Pi.  
>
> Here are the available tags for the Spacy based image:
>
>- `x.x.x-en-sm-arm` (Will run on a Raspberry Pi 2/3, but limited entity recognition)
>- `x.x.x-en-md-arm` (Ideal for Raspberry Pi 4 with 2GB of memory or more)
>- `x.x.x-en-md` (Usefull to train your models on a AMD64 based architecture)
>- `x.x.x-en-sm` (Usefull to train your models on a AMD64 based architecture)

## 5. Text to speech<a name="tts"></a>

At the moment, I only implemented one TTS engine that is based on Microft Mimic1 engine. It is the best open source TTS engine I have seen that works offline on a Raspberry Pi, but unfortunately it only supports English.   

You do not need to configure this one, it should work as intended out of the box

> INFO: I will implement two more TTS engines in the comming weeks, one based on `ESpeak` for multi-language offline support, and one based on `Google Cloud TTS` for high quality voice. 

## 6. Ortchestrator<a name="orchestrator"></a>

You do not need to configure this one, it should work as intended out of the box


## 7. MQTT broker<a name="mqtt"></a>

You do not need to configure this one, it should work as intended out of the box