let Yava = require("../../src/libraries/NodeJS/yava/index");

/**
 * When client connects successfully to the YAVA instance
 */
Yava.onConnect(() => {
    console.log("=> Connected");
});

/**
 * When client is disconnected from the YAVA instance
 */
Yava.onDisconnect(() => {
    console.log("=> Disconnected");
});

/**
 * Callback triggered when YAVA NLU recognizes an intent.
 * 
 * Parameter "assistantSession": The assistant session object 
 * that can be used to interact with YAVA
 */
Yava.onInitialIntent((assistantSession) => {
    (async() => {
        try{
            // Some intent got triggered...

            // Speak out to the user
            await assistantSession.speekOut("I will transcribe some text using the alternative speech to text engine now. Please say something.");

            // Listen and transcribe user command, but using the alternative STT engine
            // This requires configuring the second STT engine first in your docker-compose yml file
            let transcribedText = await assistantSession.listenAndTranscribe({
                "stt_alt": true
            }); 
            console.log("User said: ", transcribedText);

            // Speak out to the user
            await assistantSession.speekOut("This also works to match the text against the NLU engine. Please say something.");

            // Listen and transcribe user command, but using the alternative STT engine
            // This requires configuring the second STT engine first in your docker-compose yml file
            let intentEntityMatch = await assistantSession.listenAndMatchIntent({
                "stt_alt": true
            }); 
            console.log("Intent and entities are: ", intentEntityMatch);
      } catch(err){
          console.log("ERROR => ", err);            
      } finally{
          // Release the assistant session
          assistantSession.done();
      }
    })();
});

// Now connect
Yava.connect("<YAVA HOST IP>");