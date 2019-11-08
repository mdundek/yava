let PrivateVoiceAssistant = require("../../src/libraries/NodeJS/pva/index");

/**
 * When client connects successfully to the PVA instance
 */
PrivateVoiceAssistant.onConnect(() => {
    console.log("=> Connected");
    
    (async() => {
        let assistantSession = await PrivateVoiceAssistant.hijackSession();

        // Now use the assistantSession object to interact with PVA...

        // Release the assistant session
        assistantSession.done();
    })();
    
});

/**
 * When client is disconnected from the PVA instance
 */
PrivateVoiceAssistant.onDisconnect(() => {
    console.log("=> Disconnected");
});

// Now connect
PrivateVoiceAssistant.connect("192.168.1.42");