var mqtt = require('mqtt');
// const shortid = require('shortid');

let API_SESSION_OBJECT = null;
let _BORROWED_FLAG = false;

/**
 * PrivateVoiceAssistant
 */
class PrivateVoiceAssistant {
    static connect(host) {
        this.host = host;
    
        this.client = mqtt.connect('mqtt://' + this.host);

        this.client.on('connect',  () => {
            // this.client.publish("PASSIST/API/ONLINE/" + this._apiRegisterId, message);
            this.client.subscribe('PASSIST/#');
            this.connected = true;
            if(this.callback.onConnect){
                this.callback.onConnect();
            }
        });

        this.client.on('offline',  () => {
            this.connected = false;
            if(this.callback.onDisconnect){
                this.callback.onDisconnect();
            }
            if(API_SESSION_OBJECT){
                let _err = API_SESSION_OBJECT.err;
                API_SESSION_OBJECT = null;
                _err({ "ts": new Date().getTime(), "reason": "CON_LOS" });
            }
        });
        this.client.on('error',  () => {
            console.log("error");
        });

        this.client.on('message', (topic, message) => {
            
            if (topic.indexOf("PASSIST/API/BRODCAST_INTENT/") == 0) {
                
                if(this.callback.intentEventCallback){
                    let sessionId = topic.split("/").pop();
                    let payload = JSON.parse(message.toString("UTF-8"));

                    let sessionObject = new APISession(sessionId, payload, this.client);
                    this.callback.intentEventCallback(sessionObject);
                }
            }
            else if(topic.indexOf("PASSIST/API/HIJACK_SESSION_READY/") == 0){
                if(API_SESSION_OBJECT && API_SESSION_OBJECT.action == "hijack"){
                    let sessionId = topic.split("/").pop();
                    let _cb = API_SESSION_OBJECT.next;
                    API_SESSION_OBJECT = null;

                    let sessionObject = new APISession(sessionId, null, this.client);
                    _cb(sessionObject);
                   
                    
                }
            } 
            else if(topic.indexOf("PASSIST/TTS/SAY_DONE/") == 0){
                if(API_SESSION_OBJECT && API_SESSION_OBJECT.action == "speekOut"){
                    let _cb = API_SESSION_OBJECT.next;
                    API_SESSION_OBJECT = null;
                    _cb();
                }
            } 
            else if(topic.indexOf("PASSIST/RECORD_SPEECH/CAPTURED/") == 0) {
                if(API_SESSION_OBJECT && (API_SESSION_OBJECT.action == "listenAndTranscribe" || API_SESSION_OBJECT.action == "listenAndMatchIntent")){
                    let sessionId = topic.split("/").pop();
                    this.client.publish("PASSIST/"+(API_SESSION_OBJECT.stt_alt ? "STT_ALT":"STT")+"/PROCESS/" + sessionId, message);
                }
            }
            else if(topic.indexOf("PASSIST/STT/PROCESS_DONE/") == 0 || topic.indexOf("PASSIST/STT_ALT/PROCESS_DONE/") == 0) {
                if(API_SESSION_OBJECT && API_SESSION_OBJECT.action == "listenAndTranscribe"){
                    let sessionId = topic.split("/").pop();
                    let _cb = API_SESSION_OBJECT.next;
                    API_SESSION_OBJECT = null;
                    _cb(message.toString("UTF-8"));
                } else if(API_SESSION_OBJECT && API_SESSION_OBJECT.action == "listenAndMatchIntent"){
                    let sessionId = topic.split("/").pop();
                    this.client.publish("PASSIST/NLP/MATCH/" + sessionId, JSON.stringify({ text: message.toString("UTF-8"), ts: new Date().getTime() }));
                }
            }
            else if(topic.indexOf("PASSIST/NLP/MATCH_DONE/") == 0) {
                if(API_SESSION_OBJECT && API_SESSION_OBJECT.action == "listenAndMatchIntent"){
                    let sessionId = topic.split("/").pop();
                    let _cb = API_SESSION_OBJECT.next;
                    API_SESSION_OBJECT = null;
                    _cb(JSON.parse(message.toString("UTF-8")));
                }
            } else if (topic.indexOf("PASSIST/ERROR/") == 0) {
                let sessionId = topic.split("/").pop();
                if(API_SESSION_OBJECT && (sessionId == "NULL" || API_SESSION_OBJECT.sessionId == sessionId)){

                    let errorObj = JSON.parse(message.toString("UTF-8"));
                    if(errorObj.reason == "AUD_TMO" && API_SESSION_OBJECT.action == "listenAndTranscribe"){
                        let _next = API_SESSION_OBJECT.next;
                        API_SESSION_OBJECT = null;
                        _next("");
                    } else if(errorObj.reason == "AUD_TMO" && API_SESSION_OBJECT.action == "listenAndMatchIntent"){
                        let _next = API_SESSION_OBJECT.next;
                        API_SESSION_OBJECT = null;
                        _next({
                            "intent": "",
                            "entities": "",
                            "utterance": ""
                        });
                    } else {
                        let _err = API_SESSION_OBJECT.err;
                        API_SESSION_OBJECT = null;
                        _err(JSON.parse(message.toString("UTF-8")));
                    }
                }
            } else if (topic.indexOf("PASSIST/API/TIMEOUT/") == 0) {
                let sessionId = topic.split("/").pop();
                if(API_SESSION_OBJECT && API_SESSION_OBJECT.sessionId == sessionId){
                    let _next = API_SESSION_OBJECT.next;
                    API_SESSION_OBJECT = null;
                    _next(null);
                }
            }    
        });
    }

    static onInitialIntent(cb) {
        this.callback.intentEventCallback = cb;
    }

    static onConnect(cb) {
        this.callback.onConnect = cb;
    }

    static onDisconnect(cb) {
        this.callback.onDisconnect = cb;
    }

    static hijackSession(){
        return new Promise((res, rej) => {
            if(_BORROWED_FLAG) {
                return rej({ reason: 'SES_BUS', ts: new Date().getTime() });
            }

            _BORROWED_FLAG = true;

            API_SESSION_OBJECT = {
                "action": "hijack",
                "next": res,
                "err": rej
            };
            this.client.publish("PASSIST/API/HIJACK_SESSION", "");
        });
    }
}

PrivateVoiceAssistant.callback = {};
PrivateVoiceAssistant.connected = false;
PrivateVoiceAssistant.host = null;
PrivateVoiceAssistant.client = null;

module.exports = PrivateVoiceAssistant;

/**
 * APISession
 */
class APISession {

    constructor(sessionId, data, mqtt) {
        this.sessionId = sessionId;
        this.data = data;
        this._client = mqtt;
    }
    
    speekOut(text) {
        return new Promise((res, rej) => {
            if(API_SESSION_OBJECT){
                rej({ reason: 'SES_BUS', ts: new Date().getTime() });
            } else{
                API_SESSION_OBJECT = {
                    "sessionId": this.sessionId,
                    "action": "speekOut",
                    "next": res,
                    "err": rej
                };
                if(!_BORROWED_FLAG){
                    this._client.publish("PASSIST/API/BORROW_SESSION/" + this.sessionId, "");
                    _BORROWED_FLAG = true;
                }
                this._client.publish("PASSIST/TTS/SAY/" + this.sessionId, JSON.stringify({ text: text, ts: new Date().getTime() }));
            }
        });
    }

    listenAndTranscribe(opt) {
        return new Promise((res, rej) => {
            if(API_SESSION_OBJECT){
                rej({ reason: 'SES_BUS', ts: new Date().getTime() });
            } else{
                API_SESSION_OBJECT = {
                    "sessionId": this.sessionId,
                    "action": "listenAndTranscribe",
                    "next": res,
                    "err": rej
                };
                if(opt && opt.stt_alt === true)
                    API_SESSION_OBJECT.stt_alt = true;

                    if(!_BORROWED_FLAG){
                        this._client.publish("PASSIST/API/BORROW_SESSION/" + this.sessionId, "");
                        _BORROWED_FLAG = true;
                    }
                this._client.publish("PASSIST/RECORD_SPEECH/START/" + this.sessionId, JSON.stringify({ts: new Date().getTime()}));
            }
        });
    }

    listenAndMatchIntent(opt) {
        return new Promise((res, rej) => {
            if(API_SESSION_OBJECT){
                rej({ reason: 'SES_BUS', ts: new Date().getTime() });
            } else{
                API_SESSION_OBJECT = {
                    "sessionId": this.sessionId,
                    "action": "listenAndMatchIntent",
                    "next": res,
                    "err": rej
                };
                if(opt && opt.stt_alt === true)
                    API_SESSION_OBJECT.stt_alt = true;
                    if(!_BORROWED_FLAG){
                        this._client.publish("PASSIST/API/BORROW_SESSION/" + this.sessionId, "");
                        _BORROWED_FLAG = true;
                    }
                this._client.publish("PASSIST/RECORD_SPEECH/START/" + this.sessionId, JSON.stringify({ts: new Date().getTime()}));
            }
        });
    }

    done() {
        this._client.publish("PASSIST/API/RELEASE_SESSION/" + this.sessionId, "");
        _BORROWED_FLAG = false;
    }
}
 

 