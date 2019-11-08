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
PrivateVoiceAssistant.connect("<PVA HOST IP>");