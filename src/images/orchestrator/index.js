const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://yava-mosquitto');
const shortid = require('shortid');
let SESSIONS = {};
let _BORROWED = false;
let COMPONENT_READY_COUNTER = [];

let API_SESSION_TIMEOUT_MS = 60000; // default to 1 minute
if(process.env.API_SESSION_TIMEOUT){
    API_SESSION_TIMEOUT_MS = parseInt(process.env.API_SESSION_TIMEOUT_MS) * 1000;
}

client.on('connect', function () {
    console.log("INFO:ORCHESTRATOR=>:MQTT Orchestrator connected");
    client.subscribe('YAVA/#');

});

client.on('message', function (topic, message) {
    console.log("INFO=>:", topic);

    if (topic.endsWith("/READY")) {
        let componentName = topic.substring(0, topic.lastIndexOf("/"));
        componentName = componentName.substring(componentName.lastIndexOf("/") + 1);
        if(COMPONENT_READY_COUNTER.indexOf(componentName) == -1){
            COMPONENT_READY_COUNTER.push(componentName);
        }
    }
    else if (topic == "YAVA/YAVA/GET_STATUS") {
        client.publish("YAVA/YAVA/STATUS_" + (COMPONENT_READY_COUNTER.length == 5 ? "OK" : "KO"), "");        
    }
    else if (topic.indexOf("YAVA/HOTWORD_DETECTOR/EVENT/") == 0) {
        let sessionId = topic.split("/").pop();
        hotwordDetected(sessionId);
    }
    else if (topic.indexOf("YAVA/RECORD_SPEECH/CAPTURED/") == 0) {
        let sessionId = topic.split("/").pop();
        speechCaptureDone(sessionId, message);
    }
    else if (topic.indexOf("YAVA/STT/PROCESS_DONE/") == 0 || topic.indexOf("YAVA/STT_ALT/PROCESS_DONE/") == 0) {
        let sessionId = topic.split("/").pop();
        speechToTextDone(sessionId, message.toString("UTF-8"));
    }
    else if (topic.indexOf("YAVA/NLP/MATCH_DONE/") == 0) {
        let sessionId = topic.split("/").pop();
        onNlpDone(sessionId, JSON.parse(message.toString("UTF-8")));
    }
    else if (topic.indexOf("YAVA/TTS/SAY_DONE/") == 0) {
        let sessionId = topic.split("/").pop();
        textToSpeechDone(sessionId);
    }
    else if (topic.indexOf("YAVA/API/BORROW_SESSION/") == 0) {
        let sessionId = topic.split("/").pop();
        if(_BORROWED){
            client.publish("YAVA/ERROR/" + sessionId, JSON.stringify({ "reason": "SES_BUS", "ts": new Date().getTime() }));
        } else {
            if(SESSIONS[sessionId]){
                _BORROWED = true;
                SESSIONS[sessionId].owner = "API";
                _extendSessionTimeout(sessionId);
            } 
            // else {
            //     client.publish("YAVA/ERROR/" + sessionId, JSON.stringify({ "reason": "SES_EXP", "ts": new Date().getTime() }));
            // }
        }
    }
    else if (topic == "YAVA/API/HIJACK_SESSION") {
        let sessionId = shortid.generate() + "_SID";
        if(_BORROWED){
            client.publish("YAVA/ERROR/NULL", JSON.stringify({ "reason": "SES_BUS", "ts": new Date().getTime() }));
        } else {
            _BORROWED = true;
            SESSIONS[sessionId] = {
                owner: "API"
            };
            client.publish("YAVA/HOTWORD_DETECTOR/STOP", JSON.stringify({ ts: new Date().getTime() }));

            // Reset failsafe to 1 minute, in case the client library never finishes closing this session
            SESSIONS[sessionId].inactiveTimeout = setTimeout(function (_sessionId){ 
                onSessionExpiration(_sessionId)
            }.bind(this, sessionId), API_SESSION_TIMEOUT_MS);

            setTimeout(() => {
                client.publish("YAVA/API/HIJACK_SESSION_READY/" + sessionId, JSON.stringify({ ts: new Date().getTime() }));
            }, 1000)
        }
    }
    else if (topic.indexOf("YAVA/API/RELEASE_SESSION/") == 0) {
        let sessionId = topic.split("/").pop();
        if(SESSIONS[sessionId]){
           if(SESSIONS[sessionId].inactiveTimeout){
                clearTimeout(SESSIONS[sessionId].inactiveTimeout);
            }
            delete SESSIONS[sessionId];
        
            _BORROWED = false;
            client.publish("YAVA/HOTWORD_DETECTOR/START", JSON.stringify({ ts: new Date().getTime() }));
        }
    }
    else if (topic.indexOf("YAVA/ERROR/") == 0) {
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
    }.bind(this, sessionId), API_SESSION_TIMEOUT_MS);
}

/**
 * hotwordDetected
 */
hotwordDetected = (sessionId) => {
    SESSIONS[sessionId] = {
        owner: "HOTWORD"
    };

    client.publish("YAVA/RECORD_SPEECH/START/" + sessionId, JSON.stringify({
        ts: new Date().getTime()
    }));
}

/**
 * speechCaptureDone
 */
speechCaptureDone = (sessionId, payload) => {
    if(SESSIONS[sessionId] && SESSIONS[sessionId].owner == "HOTWORD"){
        client.publish("YAVA/STT/PROCESS/" + sessionId, payload);
    } else {
        if(SESSIONS[sessionId]){
            _extendSessionTimeout(sessionId);
        } 
        // else {
        //     client.publish("YAVA/ERROR/" + sessionId, JSON.stringify({ "reason": "SES_EXP", "ts": new Date().getTime() }));
        // }
    }
}

/**
 * speechToTextDone
 */
speechToTextDone = (sessionId, payload) => {
    if(SESSIONS[sessionId] && SESSIONS[sessionId].owner == "HOTWORD"){
        client.publish("YAVA/NLP/MATCH/" + sessionId, JSON.stringify({ text: payload, ts: new Date().getTime() }));
    } else {
        if(SESSIONS[sessionId]){
            _extendSessionTimeout(sessionId);
        } 
        // else {
        //     client.publish("YAVA/ERROR/" + sessionId, JSON.stringify({ "reason": "SES_EXP", "ts": new Date().getTime() }));
        // }
    }
}

/**
 * onNlpDone
 */
onNlpDone = (sessionId, payload) => {
    if(SESSIONS[sessionId] && SESSIONS[sessionId].owner == "HOTWORD"){
        console.log(JSON.stringify(payload, null, 4))
        if(payload.intent.length == 0){
            client.publish("YAVA/TTS/SAY/" + sessionId, JSON.stringify({ text: "Sorry, but I did not understand you.", ts: new Date().getTime() }));
        } else {
            client.publish("YAVA/API/BRODCAST_INTENT/" + sessionId, JSON.stringify(payload));
            // Start the timer, if nothing happened within the next 10 seconds, 
            // reset the session and start hotword detection
            SESSIONS[sessionId].inactiveTimeout = setTimeout(function (_sessionId){ 
                onSessionExpiration(_sessionId)
            }.bind(this, sessionId), 10000);
        }
    } else {
        if(SESSIONS[sessionId]){
            _extendSessionTimeout(sessionId);
        } 
        // else {
        //     client.publish("YAVA/ERROR/" + sessionId, JSON.stringify({ "reason": "SES_EXP", "ts": new Date().getTime() }));
        // }
    }
}

/**
 * textToSpeechDone
 */
textToSpeechDone = (sessionId) => {
    if(SESSIONS[sessionId] && SESSIONS[sessionId].owner == "HOTWORD"){
        delete SESSIONS[sessionId];
        client.publish("YAVA/HOTWORD_DETECTOR/START", JSON.stringify({ ts: new Date().getTime() }));
    } else {
        if(SESSIONS[sessionId]){
            _extendSessionTimeout(sessionId);
        } 
        // else {
        //     client.publish("YAVA/ERROR/" + sessionId, JSON.stringify({ "reason": "SES_EXP", "ts": new Date().getTime() }));
        // }
    }
}

/**
 * onSessionError
 */
onSessionError = (sessionId, payload) => {
    if(sessionId != "NULL" && SESSIONS[sessionId] && SESSIONS[sessionId].owner == "HOTWORD"){
        let errMessage;
        switch(payload.reason) {
            case "AUD_MAX":
                errMessage = "There was a problem, your sentance is too long.";
                break;
            case "AUD_ERR":
                errMessage = "There was a problem with the microphone.";
                break;
            case "AUD_TMO":
                errMessage = "Sorry, I did not understand that.";
                break;
            case "STT_AUD":
                errMessage = "Sorry, I did not understand that.";
                break;
            case "STT_ERR":
                errMessage = "There was a problem with the speech to text engine.";
                break;
            default:
                errMessage = "There was an error, please try again.";
        }
        client.publish("YAVA/TTS/SAY/" + sessionId, JSON.stringify({ text: errMessage, ts: new Date().getTime() }));
    } else if(SESSIONS[sessionId]){
        _extendSessionTimeout(sessionId);
    }
}

/**
 * onSessionExpiration
 */
onSessionExpiration = (sessionId) => {
    if(SESSIONS[sessionId] && SESSIONS[sessionId].owner == "HOTWORD"){
        delete SESSIONS[sessionId];
        client.publish("YAVA/HOTWORD_DETECTOR/START", JSON.stringify({ ts: new Date().getTime() }));
    } else {
        _BORROWED = false;
        
        delete SESSIONS[sessionId];
        client.publish("YAVA/API/TIMEOUT/" + sessionId, JSON.stringify({ "ts": new Date().getTime(), "reason": "SES_TIO" }));
        client.publish("YAVA/HOTWORD_DETECTOR/START", JSON.stringify({ "ts": new Date().getTime() }));
    }
}

