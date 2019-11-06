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
                  // Ask user to who this email should be send to
                  await assistantSession.speekOut("To whom would you like to send this email to exactly");

                  // Get user response, without having NLU determine an intent
                  let targetPersonResponse = await assistantSession.listenAndTranscribe();

                  // Do whatever you need to do with the user response text, 
                  // in this case probably look up the user email address
                  let contact = "michael"

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
                      console.log(totalMessage);
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
PrivateVoiceAssistant.connect("192.168.1.42");