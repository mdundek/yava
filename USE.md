# Use the platform<a name="usage"></a>

## Table of contents

* [Train your NLU model](#train) 
  * [Prepare your training data](#confignlu)  
  * [Train model for NLU Light](#nlulighttrain)  
  * [Train model for NLU Spacy](#nluspacytrain)  
* [Start the voice assistant](#startassistant)  
* [Get the message bus logs](#logsassistant)  
* [Stop the voice assistant](#stopassistant)  
* [Use the client libraries](#clientlib)  
  * [NodeJS library](#libnode)  
  * [Python library](#libpy)
  * [Java library](#libjava)  


## Train your NLU model<a name="train"></a>

### Prepare your training data<a name="confignlu"></a>

First, you need to create your NLU training data. There is a sample training data file that you can get inspiration from here: `resources/nlu/training_data/training_example.yaml`.

For your specific use case, create a new training file in that same directory and call is something like `my_training_example.yaml` file.  

As an example, have a look at the following training configuration:

```yaml
training:

  placeholders:
    SEND_PREFIX:
      - Send
      - Can you send
      - Please send

  entities:
    CONTACT:
      - Michael
      - Becky
      - Mom
      - Pascal

  intents:

    send_email:
      - "{SEND_PREFIX} an email to [CONTACT]"
      - "{SEND_PREFIX} [CONTACT] an email"

    send_sms:
      - "{SEND_PREFIX} a text message to [CONTACT]"
      - "{SEND_PREFIX} a sms to [CONTACT]"
      - "{SEND_PREFIX} [CONTACT] a message"
```

__Some explanations:__  

__placeholders__: Can be used to generate training sets using placeholders. When being trained later on, the NLU component will expand those examples and generate training sets with all possible permutations. List those variants in a named `placeholder` node and reference it in your training utterance. Placeholders are specified by using the `{...}` syntax.

__entities__: Just like placeholders, but for Entities you would like to detect in your text. Entities are specified by using the `[...]` syntax. By default, the NER engine will also extract common entities such as `dates`, `numbers`, `currencies` etc . You do not need to ask for those explicitely.

__intents__: List your intents here, and provide samples utterances that a user might ask. Tag the Entities in those utterances to train the engine so that it can recognize them.



### Train model for NLU Light<a name="nlulighttrain"></a>

To train your model, you will have to use the appropriate docker image. In this case, the image would be `md76/yava-nlu-light:0.9.1-arm` if training on a Raspberry Pi, or the image `md76/yava-nlu-light:0.9.1` if training on a AMD64 based machine. NLU light is fast enougth to train on the Raspberry Pi directly, so I would just stick to the first variant for simplicity. 

Once you have finished your training set definitions, run the following command from the root of this repository to train your model:  

```shell
docker run --rm \
  -v $PWD/resources/nlu/models:/usr/src/app/models \
  -v $PWD/resources/nlu/training_data/<YOUR TRAINING YAML FILE>:/usr/src/app/training_data/train.yaml \
  md76/yava-nlu-light:0.9-arm \
  python train.py
```

Adjust the image tag name if you are not on a Raspberry Pi, and replace `<YOUR TRAINING YAML FILE>` with the name of your training yaml file.  

Once the training is done, you will see a new file in the folder `resources/nlu/models/intents/model.nlp`.


### Train model for NLU Spacy<a name="nluspacytrain"></a>

To train your model, you will have to use the appropriate docker image. In this case, the image would be `md76/yava-nlu-spacy:0.9.1-en-sm-arm` or `md76/yava-nlu-spacy:0.9.1-en-md-arm` if training on a Raspberry Pi (be aware that this will take a long time), or the image `md76/yava-nlu-spacy:0.9.1-en-sm` or `md76/yava-nlu-spacy:0.9.1-en-md` if training on a AMD64 based machine. The last two options are recommended if you want to have an acceptable training duration.  

Once you have finished your training set definitions, run the following command from the root of this repository:  

```shell
docker run --rm \
  -v $PWD/resources/nlu/models:/usr/src/app/models \
  -v $PWD/resources/nlu/training_data/<YOUR TRAINING YAML FILE>:/usr/src/app/training_data/train.yaml \
  md76/yava-nlu-spacy:0.9-en-sm-arm \
  python train.py
```

Adjust the image tag name if you are not on a Raspberry Pi and according to the base model you wish to use, and replace the `<YOUR TRAINING YAML FILE>` part with the name of your training yaml file.  

Once the training is done, you will see a new files in the folder `resources/nlu/models/intents/`, as well as spacy entity models in the folder `resources/nlu/models/entities/`.

> INFO: If you trained your model on a different machine than the one running YAVA, then remember to move the model over to your Raspberry Pi, respectively in the folders `resources/nlu/models/intents/` and `resources/nlu/models/entities/`. For this, I use the `scp` command from my Mac, that looks like this:
>
>```shell
>scp -r files/nlu/models/entities/* <SSH USER OF TARGET HOST>@<IP OF THE TARGET HOST>:/home/pi/workspaces/yava/files/nlu/models/entities
>```
>_

## Start the voice assistant<a name="startassistant"></a>

> IMPORTANT: Make sure you configured the various components, and train your NLU model before you proceed.

To run the voice assistant, simply execute the following command from the root of this repository:

```shell
COMPOSE_HTTP_TIMEOUT=300 YAVA_VERSION=0.9.1 docker-compose -f <YOUR DOCKER COMPOSE YML FILE> up -d
```

> If you run the assistant for the first time, then docker will have to download all required images first. Be patient, this might take a while depending on your connection speed (Rasberries tend to be slower, except for the RPi 4 due to it's revised bus architecture). 

This will also restart the assistant automatically on reboot, untill you explicitly did a `docker-compose down`

## Get the message bus logs<a name="logsassistant"></a>

To see the broker logs once started (ex. for debugging), run the following command:

```shell
YAVA_VERSION=0.9.1 docker-compose -f <YOUR DOCKER COMPOSE YML FILE> logs -f
```

## Stop the voice assistant<a name="stopassistant"></a>

```shell
YAVA_VERSION=0.9.1 docker-compose -f <YOUR DOCKER COMPOSE YML FILE> down
```

## Use the client libraries<a name="clientlib"></a>

Dont hesitate to check out some code samples in the folder `examples/`.

### NodeJS library<a name="libnode"></a>

> For now, the client library is not available through NPM. This will change soon once I get the time to make it available.  
In the meanwhile, simply copy the folder `src/libraries/NodeJS/yava` to your NodeJS project.  

Require the client library and connect to the YAVA host:

```node
let Yava = require("./yava/index");
```

Register to YAVA events:

```node
/**
 * When client connects successfully to the YAVA instance
 */
Yava.onConnect(() => {

});

/**
 * When client is disconnected from the YAVA instance
 */
Yava.onDisconnect(() => {
    
});

/**
 * Callback triggered when YAVA NLU recognizes an intent.
 * 
 * Parameter "assistantSession": The assistant session object 
 * that can be used to interact with YAVA
 */
Yava.onInitialIntent((assistantSession) => {
    
});

// Now connect
Yava.connect("<IP OF HOST THAT RUNS YAVA>");
```

Methods available on the __assistantSession__ object:

```node
// Listen to the user, and run NLU intent & entity recognition on the command
let intentAndEntities = await assistantSession.listenAndMatchIntent(opt)
// opt is optional, use it if you want to use the secondary TTS engine rather than the default one:
// ex. {"stt_alt": true}

// Listen to the user, and return the transcribed text as is without going through the NLU engine
let text = await assistantSession.listenAndTranscribe(opt)
// opt is optional, use it if you want to use the secondary TTS engine rather than the default one:
// ex. {"stt_alt": true}

// Speak out the desired text
assistantSession.speekOut(text)
```

If you want to initiate a new assistant session manually, you can do so using the `hijackSession` function of the `Yava` object:

```node
if(Yava.connected){
    try{
        let assistantSession = await Yava.hijackSession();
        
        await assistantSession.speekOut("I just started a session on my own");
        
        // Do whatever you want here with this session object...

        // Dont forget to release the session when done
        assistantSession.done();
    } catch(err){
        console.log("ERROR => ", err);            
    }
}
```

> IMPORTANT: YAVA is not designed to be a multi-tenant voice assistant. Use the library syncroniously, one session at a time.


### Python library<a name="libpy"></a>

Under construction

### Java library<a name="libjava"></a>

Under construction
