let PrivateVoiceAssistant = require("../../src/libraries/NodeJS/pva/index");

/**
 * When client connects successfully to the PVA instance
 */
PrivateVoiceAssistant.onConnect(() => {
    console.log("=> Connected");
});

/**
 * When client is disconnected from the PVA instance
 */
PrivateVoiceAssistant.onDisconnect(() => {
    console.log("=> Disconnected");
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
                    // Speak out to the user
                    await assistantSession.speekOut("Are you sure you wish to send an email");

                    // Get the user command and try to match it against one of your intents
                    let response = await assistantSession.listenAndMatchIntent();

                    console.log("Intent and entities are: ", response);

                    // response contains the same data structure as the 'assistantSession.data' object, 
                    // but evaluated according to the last user command
                       
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
PrivateVoiceAssistant.connect("192.168.1.42");