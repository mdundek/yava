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
            switch(assistantSession.data.intent){
                case "send_email":
                    
                    // Make sure you got the entity representing the recipient along side with the intent, 
                    // otherwise you have to ask the user for it first
                    // ...

                    // Speak out to the user
                    await assistantSession.speekOut("What would you like the email to say");

                    let totalMessage = "";
                    while(true){
                        // Get the user command as transcribed text rather than having the NLU engine process it first
                        let emailMessagePart = await assistantSession.listenAndTranscribe(); 
                        if(emailMessage == "done"){
                            // you could also use the method 'listenAndMatchIntent()' for a more robust approach, 
                            // if you trained your NLU model to recognize the "I am done" type of intent
                            break;
                        } else{
                            totalMessage += "\n" + emailMessage
                            await assistantSession.speekOut("Anything else you wanna say? Say done when you are finished");
                        }
                    }

                    console.log("Message is: ", totalMessage);

                    // Now send out your email...
                    break;
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
Yava.connect("192.168.1.42");