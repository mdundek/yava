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
Yava.connect("<YAVA HOST IP>");