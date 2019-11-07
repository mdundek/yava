# Use the platform<a name="usage"></a>

## Table of contents

* [Train your NLU model](#train) 
  * [Prepare your training data](#confignlu)  
  * [Train model for NLU Light](#nlulighttrain)  
  * [Train model for NLU Spacy](#nluspacytrain)  
* [Start the voice assistant](#startassistant)  
* [Use the client libraries](#clientlib)  
  * [NodeJS](#libnode)  
  * [Python](#libpy)  


## Train your NLU model<a name="train"></a>

### Prepare your training data<a name="confignlu"></a>

First, you need to create your NLU training data. There is a sample training data file that you can get inspiration from here: `resources/nlu/training_data/training_example.yaml`.

Example `training.yaml` file:

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

__placeholders__: Can be used to generate training sets with placeholders. Rather than creating one example utterance for each variant of a sentance sub section, list those variants in a named placeholder node and reference it in your training utterance. Placeholders are injected by using `{...}` syntax.

__entities__: Just like placeholders, but for Entities you would like to detect in your text. Entities are injected by using `[...]` syntax.

__intents__: List your intents here, and provide samples utterances that a user might ask. Tag the Entities in those utterances to train the engine so that it can recognize them.

---

To train your model, you will have to use the appropriate docker image. Please read on for more details.

### Train model for NLU Light<a name="nlulighttrain"></a>

Once you have finished your training set definitions, run the following command from the root of this repository:  

```shell
docker run --rm \
  -v $PWD/resources/nlu/models:/usr/src/app/models \
  -v $PWD/resources/nlu/training_data/<YOUR TRAINING YAML FILE>:/usr/src/app/training_data/train.yaml \
  md76/pva-nlu-light:0.9-arm \
  python train.py
```

Replace the `<YOUR TRAINING YAML FILE>` part with the name of your training yaml file.
Once the training is done, you will see a new file in the folder `resources/nlu/models/intents/model.nlp`.


### Train model for NLU Spacy<a name="nluspacytrain"></a>

Once you have finished your training set definitions, run the following command from the root of this repository:  

```shell
docker run --rm \
  -v $PWD/resources/nlu/models:/usr/src/app/models \
  -v $PWD/resources/nlu/training_data/<YOUR TRAINING YAML FILE>:/usr/src/app/training_data/train.yaml \
  md76/pva-nlu-spacy:0.9-en-sm-arm \
  python train.py
```

Replace the `<YOUR TRAINING YAML FILE>` part with the name of your training yaml file.
Once the training is done, you will see a new files in the folder `resources/nlu/models/intents/`, as well as spacy entity models in the folder `resources/nlu/models/entities/`.

> WARNING: Spacy takes a long time to train your model, especially on a Raspberry Pi 2/3. This might be a bit better on a Raspberry Pi 4 (again, to be tested).
> You can also use a more powerfull machine to train your model, and then move the model over to your Raspberry Pi in the folders `resources/nlu/models/intents/` and `resources/nlu/models/entities/` accordingly.  
> To do so, use the docker image tag `0.9-en-sm` rather than `0.9-en-sm-arm`.


## Start the voice assistant<a name="startassistant"></a>

> IMPORTANT: Make sure you configured the various components according to the above section, and train your NLU model before you start the solution.

To run the voice assistant, simply execute the following command from the repository root directory:

```shell
COMPOSE_HTTP_TIMEOUT=300 PVA_VERSION=0.9.1 docker-compose -f <YOUR DOCKER COMPOSE YML FILE> up -d
```

> If you run the assistant for the first time, then docker will have to download all required images first. Be patient, this might take a while depending on your connection speed (Raspberries tend to be slower, except for the RPi 4 due to it's revised bus architecture). 

This will also restart the assistant automatically on reboot, untill you explicitly did a `docker-compose down`

To see the broker logs once started (ex. for debugging):

```shell
PVA_VERSION=0.9.1 docker-compose -f <YOUR DOCKER COMPOSE YML FILE> logs -f
```

To stop the assistant:

```shell
PVA_VERSION=0.9.1 docker-compose -f <YOUR DOCKER COMPOSE YML FILE> down
```

## Use the client libraries<a name="clientlib"></a>

### NodeJS<a name="libnode"></a>

For now, the client library is not available on NPM. this will change soon wonce I get the time to do so.  
In the meanwhile, simply copy the folder `src/libraries/NodeJS/pva` to your NodeJS project.  

Require the client library and connect to the PVA host:

```node
let PrivateVoiceAssistant = require("./pva/index");
```

Register to PVA events:

```node
/**
 * When client connects successfully to the PVA instance
 */
PrivateVoiceAssistant.onConnect(() => {

});

/**
 * When client is disconnected from the PVA instance
 */
PrivateVoiceAssistant.onDisconnect(() => {
    
});

/**
 * Callback triggered when PVA NLU recognizes an intent.
 * 
 * Parameter "assistantSession": The assistant session object 
 * that can be used to interact with PVA
 */
PrivateVoiceAssistant.onInitialIntent((assistantSession) => {
    (async() => {
      try{
          switch(assistantSession.data.intent){
              case "send_email":
                  // Ask user to who this email should be send to
                  await assistantSession.speekOut("To whom would you like to send this email to exactly");

                  // Get user response, without having NLU determine an intent
                  let targetPersonResponse = await assistantSession.listenAndTranscribe();

                  // Do whatever you need to do with the user response text, 
                  // in this case probably look up the user email address
                  let contact = ...

                  if(!contact){
                      await assistantSession.speekOut("I don't know that person, sorry");
                  } 
                  else {
                      await assistantSession.speekOut("What do you want your message to say");

                      // Itterate and ask user to dictate what he would like to say, 
                      // until the user says the word "done"
                      let totalMessage = "";
                      while(true){
                          let emailMessage = await assistantSession.listenAndTranscribe();
                          if(emailMessage == "done"){
                              break;
                          } else{
                              totalMessage += "\n" + emailMessage
                              await assistantSession.speekOut("Anything else you wanna say? Say done when you are finished");
                          }
                      }

                      // Now send the email to the target user...
                  }
                  break
          }
      } catch(err){
          console.log("ERROR => ", err);            
      } finally{
          // Release the assistant session
          assistantSession.done();
      }
    })();
});

// Now connect
PrivateVoiceAssistant.connect("<IP OF HOST THAT RUNS PVA>");
```

Other methods for the __assistantSession__ object:

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

If you want to initiate a new assistant session manually, you can do so using the `hijackSession` function of the `voiceAssistant` instance:

```node

if(PrivateVoiceAssistant.connected){
    try{
        let assistantSession = await PrivateVoiceAssistant.hijackSession();
        
        await assistantSession.speekOut("I just started a session on my own");
        
        // Do whatever you want here with this session object...

        // Dont forget to release the session when done
        assistantSession.done();
    } catch(err){
        console.log("ERROR => ", err);            
    }
}
```

> IMPORTANT: PVA is not designed to be a multi tenant voice assistant. Use the library syncroniously, one session at a time.


### Python<a name="libpy"></a>


docker run --rm \
  -v $PWD/resources/nlu/models:/usr/src/app/models \
  -v $PWD/resources/nlu/training_data/train.yaml:/usr/src/app/training_data/train.yaml \
  md76/pva-nlu-light:0.9-arm \
  python train.py
