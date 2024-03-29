let Yava = require("../../src/libraries/NodeJS/yava/index");

/**
 * When client connects successfully to the YAVA instance
 */
Yava.onConnect(() => {
    console.log("=> Connected");
    
    (async() => {
        let assistantSession = await Yava.hijackSession();

        // Now use the assistantSession object to interact with YAVA...
        await assistantSession.speekOut("I just hijacked this session");

        // Release the assistant session
        assistantSession.done();
    })();
    
});

/**
 * When client is disconnected from the YAVA instance
 */
Yava.onDisconnect(() => {
    console.log("=> Disconnected");
});

// Now connect
Yava.connect("<YAVA HOST IP>");