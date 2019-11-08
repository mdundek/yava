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
	// Intent & entities are available from 'assistantSession.data'. Ex:
	//
	// {
	// 	  "intent": "send_email",
	// 	  "confidence": 1,
	// 	  "entities": [
	// 		  {
	// 		  	  "start": 17,
	// 			  "end": 21,
	// 			  "len": 5,
	// 			  "levenshtein": 0,
	// 			  "accuracy": 1,
	// 			  "option": "becky",
	// 			  "sourceText": "Becky",
	// 			  "entity": "CONTACT",
	// 			  "utteranceText": "becky"
	// 		  }
	// 	  ],
	// 	  "utterance": "send an email to becky"
	// }
});

// Now connect
Yava.connect("<YAVA HOST IP>");