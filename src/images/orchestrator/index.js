const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://pva-mosquitto');
const shortid = require('shortid');

let SESSIONS = {};
let _BORROWED = false;

client.on('connect', function () {
    console.log("INFO:ORCHESTRATOR=>:MQTT Orchestrator connected");
    client.subscribe('PASSIST/#');

});

client.on('message', function (topic, message) {
    console.log("INFO=>:", topic);

    if (topic.indexOf("PASSIST/API/ONLINE/") == 0) {
        let apiId = topic.split("/").pop();
        
    }
    else if (topic.indexOf("PASSIST/HOTWORD_DETECTOR/EVENT/") == 0) {
        let sessionId = topic.split("/").pop();
        hotwordDetected(sessionId);
    }
    else if (topic.indexOf("PASSIST/RECORD_SPEECH/CAPTURED/") == 0) {
        let sessionId = topic.split("/").pop();
        speechCaptureDone(sessionId, message);
    }
    else if (topic.indexOf("PASSIST/STT/PROCESS_DONE/") == 0 || topic.indexOf("PASSIST/STT_ALT/PROCESS_DONE/") == 0) {
        let sessionId = topic.split("/").pop();
        speechToTextDone(sessionId, message.toString("UTF-8"));
    }
    else if (topic.indexOf("PASSIST/NLP/MATCH_DONE/") == 0) {
        let sessionId = topic.split("/").pop();
        onNlpDone(sessionId, JSON.parse(message.toString("UTF-8")));
    }
    else if (topic.indexOf("PASSIST/TTS/SAY_DONE/") == 0) {
        let sessionId = topic.split("/").pop();
        textToSpeechDone(sessionId);
    }
    else if (topic.indexOf("PASSIST/API/BORROW_SESSION/") == 0) {
        let sessionId = topic.split("/").pop();
        if(_BORROWED){
            client.publish("PASSIST/ERROR/" + sessionId, JSON.stringify({ "reason": "SES_BUS", "ts": new Date().getTime() }));
        } else {
            _BORROWED = true;
            SESSIONS[sessionId].owner = "API";
            _extendSessionTimeout(sessionId);
        }
    }
    else if (topic == "PASSIST/API/HIJACK_SESSION") {
        let sessionId = shortid.generate() + "_SID";
        if(_BORROWED){
            client.publish("PASSIST/ERROR/NULL", JSON.stringify({ "reason": "SES_BUS", "ts": new Date().getTime() }));
        } else {
            _BORROWED = true;
            SESSIONS[sessionId] = {
                owner: "API"
            };
            client.publish("PASSIST/HOTWORD_DETECTOR/STOP", JSON.stringify({ ts: new Date().getTime() }));

            // Reset failsafe to 1 minute, in case the client library never finishes closing this session
            SESSIONS[sessionId].inactiveTimeout = setTimeout(function (_sessionId){ 
                onSessionExpiration(_sessionId)
            }.bind(this, sessionId), 60000);

            setTimeout(() => {
                client.publish("PASSIST/API/HIJACK_SESSION_READY/" + sessionId, JSON.stringify({ ts: new Date().getTime() }));
            }, 1000)
        }
    }
    else if (topic.indexOf("PASSIST/API/RELEASE_SESSION/") == 0) {
        let sessionId = topic.split("/").pop();
        if(SESSIONS[sessionId]){
           if(SESSIONS[sessionId].inactiveTimeout){
                clearTimeout(SESSIONS[sessionId].inactiveTimeout);
            }
            delete SESSIONS[sessionId];
        }
        _BORROWED = false;
        client.publish("PASSIST/HOTWORD_DETECTOR/START", JSON.stringify({ ts: new Date().getTime() }));
    }
    else if (topic.indexOf("PASSIST/ERROR/") == 0) {
        let sessionId = topic.split("/").pop();
        onSessionError(sessionId, JSON.parse(message.toString("UTF-8")));
    }
});

/**
 * _extendSessionTimeout
 */
_extendSessionTimeout = (sessionId) => {
    if(sessionId == "NULL")
        return;

    if(SESSIONS[sessionId].inactiveTimeout){
        clearTimeout(SESSIONS[sessionId].inactiveTimeout);
    }
    // Reset failsafe to 1 minute, in case the client library never finishes closing this session
    SESSIONS[sessionId].inactiveTimeout = setTimeout(function (_sessionId){ 
        onSessionExpiration(_sessionId)
    }.bind(this, sessionId), 60000);
}

/**
 * hotwordDetected
 */
hotwordDetected = (sessionId) => {
    SESSIONS[sessionId] = {
        owner: "HOTWORD"
    };

    client.publish("PASSIST/RECORD_SPEECH/START/" + sessionId, JSON.stringify({
        ts: new Date().getTime()
    }));
}

/**
 * speechCaptureDone
 */
speechCaptureDone = (sessionId, payload) => {
    if(SESSIONS[sessionId].owner == "HOTWORD"){
        client.publish("PASSIST/STT/PROCESS/" + sessionId, payload);
    } else {
        _extendSessionTimeout(sessionId);
    }
}

/**
 * speechToTextDone
 */
speechToTextDone = (sessionId, payload) => {
    if(SESSIONS[sessionId].owner == "HOTWORD"){
        client.publish("PASSIST/NLP/MATCH/" + sessionId, JSON.stringify({ text: payload, ts: new Date().getTime() }));
    } else {
        _extendSessionTimeout(sessionId);
    }
}

/**
 * onNlpDone
 */
onNlpDone = (sessionId, payload) => {
    if(SESSIONS[sessionId].owner == "HOTWORD"){
        console.log(JSON.stringify(payload, null, 4))
        if(payload.intent.length == 0){
            client.publish("PASSIST/TTS/SAY/" + sessionId, JSON.stringify({ text: "Sorry, but I did not understand you.", ts: new Date().getTime() }));
        } else {
            client.publish("PASSIST/API/BRODCAST_INTENT/" + sessionId, JSON.stringify(payload));
            // Start the timer, if nothing happened within the next 10 seconds, 
            // reset the session and start hotword detection
            SESSIONS[sessionId].inactiveTimeout = setTimeout(function (_sessionId){ 
                onSessionExpiration(_sessionId)
            }.bind(this, sessionId), 10000);
        }
    } else {
        _extendSessionTimeout(sessionId);
    }
}

/**
 * textToSpeechDone
 */
textToSpeechDone = (sessionId) => {
    if(SESSIONS[sessionId].owner == "HOTWORD"){
        delete SESSIONS[sessionId];
        client.publish("PASSIST/HOTWORD_DETECTOR/START", JSON.stringify({ ts: new Date().getTime() }));
    } else {
        _extendSessionTimeout(sessionId);
    }
}

/**
 * onSessionError
 */
onSessionError = (sessionId, payload) => {
    if(sessionId != "NULL" && SESSIONS[sessionId].owner == "HOTWORD"){

        let errMessage;
        switch(payload.reason) {
            case "AUD_MAX":
                errMessage = "There was a problem, your sentance is too long.";
                break;
            case "AUD_ERR":
                errMessage = "There was a problem with the microphone.";
                break;
            case "AUD_TMO":
                errMessage = "Could not understand the user speech imput.";
                break;
            case "STT_AUD":
                errMessage = "I could not understand you, please speek louder next time.";
                break;
            case "STT_ERR":
                errMessage = "There was a problem with the speech to text engine.";
                break;
            default:
                errMessage = "There was an error, please try again.";
        }

        client.publish("PASSIST/TTS/SAY/" + sessionId, JSON.stringify({ text: errMessage, ts: new Date().getTime() }));
    } else {
        _extendSessionTimeout(sessionId);
    }
}

/**
 * onSessionExpiration
 */
onSessionExpiration = (sessionId) => {
    if(SESSIONS[sessionId] && SESSIONS[sessionId].owner == "HOTWORD"){
        delete SESSIONS[sessionId];
        client.publish("PASSIST/HOTWORD_DETECTOR/START", JSON.stringify({ ts: new Date().getTime() }));
    } else {
        _BORROWED = false;
        delete SESSIONS[sessionId];
        client.publish("PASSIST/API/TIMEOUT/" + sessionId, JSON.stringify({ "ts": new Date().getTime(), "reason": "SES_TIO" }));
        client.publish("PASSIST/HOTWORD_DETECTOR/START", JSON.stringify({ "ts": new Date().getTime() }));
    }
}

