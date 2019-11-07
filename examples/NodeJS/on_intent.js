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
			console.log(JSON.stringify(assistantSession.data, null, 4))
			switch(assistantSession.data.intent.intent){
				case "send_email":
					// Do whatever you need to...
					break
				case "send_message":
					// Do whatever you need to...
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
PrivateVoiceAssistant.connect("192.168.1.42");