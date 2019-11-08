var mqtt = require('mqtt');
// const shortid = require('shortid');

let API_SESSION_OBJECT = null;
let _BORROWED_FLAG = false;

let _INITIAL_YAVA_READY = false;
let _INITIAL_YAVA_READY_INTERVAL = null;

/**
 * Yava
 */
class Yava {
    static connect(host) {
        this.host = host;
    
        this.client = mqtt.connect('mqtt://' + this.host);

        this.client.on('connect',  () => {
            this.client.subscribe('YAVA/#');

            this.client.publish("YAVA/YAVA/GET_STATUS", "");
            if(!_INITIAL_YAVA_READY_INTERVAL){
                _INITIAL_YAVA_READY_INTERVAL = setInterval(() => {
                    if(!_INITIAL_YAVA_READY)
                        this.client.publish("YAVA/YAVA/GET_STATUS", "");
                }, 3000);
            }
        });

        this.client.on('offline',  () => {
            _INITIAL_YAVA_READY = false;

            if(_INITIAL_YAVA_READY_INTERVAL){
                clearInterval(_INITIAL_YAVA_READY_INTERVAL);
                _INITIAL_YAVA_READY_INTERVAL = null;
            }

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
            
            if (topic == "YAVA/YAVA/STATUS_OK") {
                this.connected = true;
                if(!_INITIAL_YAVA_READY && this.callback.onConnect){
                   this.callback.onConnect();
                   _INITIAL_YAVA_READY = true;
                }
            } else if (topic == "YAVA/YAVA/STATUS_KO") {
                this.connected = false;
            }
            else if (topic.indexOf("YAVA/API/BRODCAST_INTENT/") == 0) {
                
                if(this.callback.intentEventCallback){
                    let sessionId = topic.split("/").pop();
                    let payload = JSON.parse(message.toString("UTF-8"));

                    let sessionObject = new APISession(sessionId, payload, this.client);
                    this.callback.intentEventCallback(sessionObject);
                }
            }
            else if(topic.indexOf("YAVA/API/HIJACK_SESSION_READY/") == 0){
                if(API_SESSION_OBJECT && API_SESSION_OBJECT.action == "hijack"){
                    let sessionId = topic.split("/").pop();
                    let _cb = API_SESSION_OBJECT.next;
                    API_SESSION_OBJECT = null;

                    let sessionObject = new APISession(sessionId, null, this.client);
                    _cb(sessionObject);
                   
                    
                }
            } 
            else if(topic.indexOf("YAVA/TTS/SAY_DONE/") == 0){
                if(API_SESSION_OBJECT && API_SESSION_OBJECT.action == "speekOut"){
                    let _cb = API_SESSION_OBJECT.next;
                    API_SESSION_OBJECT = null;
                    _cb();
                }
            } 
            else if(topic.indexOf("YAVA/RECORD_SPEECH/CAPTURED/") == 0) {
                if(API_SESSION_OBJECT && (API_SESSION_OBJECT.action == "listenAndTranscribe" || API_SESSION_OBJECT.action == "listenAndMatchIntent")){
                    let sessionId = topic.split("/").pop();
                    this.client.publish("YAVA/"+(API_SESSION_OBJECT.stt_alt ? "STT_ALT":"STT")+"/PROCESS/" + sessionId, message);
                }
            }
            else if(topic.indexOf("YAVA/STT/PROCESS_DONE/") == 0 || topic.indexOf("YAVA/STT_ALT/PROCESS_DONE/") == 0) {
                if(API_SESSION_OBJECT && API_SESSION_OBJECT.action == "listenAndTranscribe"){
                    let sessionId = topic.split("/").pop();
                    let _cb = API_SESSION_OBJECT.next;
                    API_SESSION_OBJECT = null;
                    _cb(message.toString("UTF-8"));
                } else if(API_SESSION_OBJECT && API_SESSION_OBJECT.action == "listenAndMatchIntent"){
                    let sessionId = topic.split("/").pop();
                    this.client.publish("YAVA/NLP/MATCH/" + sessionId, JSON.stringify({ text: message.toString("UTF-8"), ts: new Date().getTime() }));
                }
            }
            else if(topic.indexOf("YAVA/NLP/MATCH_DONE/") == 0) {
                if(API_SESSION_OBJECT && API_SESSION_OBJECT.action == "listenAndMatchIntent"){
                    let sessionId = topic.split("/").pop();
                    let _cb = API_SESSION_OBJECT.next;
                    API_SESSION_OBJECT = null;
                    _cb(JSON.parse(message.toString("UTF-8")));
                }
            } else if (topic.indexOf("YAVA/ERROR/") == 0) {
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
            } else if (topic.indexOf("YAVA/API/TIMEOUT/") == 0) {
                let sessionId = topic.split("/").pop();
                if(API_SESSION_OBJECT && API_SESSION_OBJECT.sessionId == sessionId){
                    let _err = API_SESSION_OBJECT.err;
                    API_SESSION_OBJECT = null;
                    _err(null);
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
            if(!this.connected) {
                return rej({ reason: 'YAVA_OFL', ts: new Date().getTime() });
            }

            _BORROWED_FLAG = true;

            API_SESSION_OBJECT = {
                "action": "hijack",
                "next": res,
                "err": rej
            };
            this.client.publish("YAVA/API/HIJACK_SESSION", "");
        });
    }
}

Yava.callback = {};
Yava.connected = false;
Yava.host = null;
Yava.client = null;

module.exports = Yava;

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
            if(!Yava.connected) {
                return rej({ reason: 'YAVA_OFL', ts: new Date().getTime() });
            }
            if(API_SESSION_OBJECT){
                return rej({ reason: 'SES_BUS', ts: new Date().getTime() });
            } 
            API_SESSION_OBJECT = {
                "sessionId": this.sessionId,
                "action": "speekOut",
                "next": res,
                "err": rej
            };
            if(!_BORROWED_FLAG){
                this._client.publish("YAVA/API/BORROW_SESSION/" + this.sessionId, "");
                _BORROWED_FLAG = true;
            }
            this._client.publish("YAVA/TTS/SAY/" + this.sessionId, JSON.stringify({ text: text, ts: new Date().getTime() }));
        });
    }

    listenAndTranscribe(opt) {
        return new Promise((res, rej) => {
            if(!Yava.connected) {
                return rej({ reason: 'YAVA_OFL', ts: new Date().getTime() });
            }
            if(API_SESSION_OBJECT){
                return rej({ reason: 'SES_BUS', ts: new Date().getTime() });
            } 
            API_SESSION_OBJECT = {
                "sessionId": this.sessionId,
                "action": "listenAndTranscribe",
                "next": res,
                "err": rej
            };
            if(opt && opt.stt_alt === true)
                API_SESSION_OBJECT.stt_alt = true;

            if(!_BORROWED_FLAG){
                this._client.publish("YAVA/API/BORROW_SESSION/" + this.sessionId, "");
                _BORROWED_FLAG = true;
            }
            this._client.publish("YAVA/RECORD_SPEECH/START/" + this.sessionId, JSON.stringify({ts: new Date().getTime()}));
        });
    }

    listenAndMatchIntent(opt) {
        return new Promise((res, rej) => {
            if(!Yava.connected) {
                return rej({ reason: 'YAVA_OFL', ts: new Date().getTime() });
            }
            if(API_SESSION_OBJECT){
                return rej({ reason: 'SES_BUS', ts: new Date().getTime() });
            } 
            API_SESSION_OBJECT = {
                "sessionId": this.sessionId,
                "action": "listenAndMatchIntent",
                "next": res,
                "err": rej
            };
            if(opt && opt.stt_alt === true)
                API_SESSION_OBJECT.stt_alt = true;
                
            if(!_BORROWED_FLAG){
                this._client.publish("YAVA/API/BORROW_SESSION/" + this.sessionId, "");
                _BORROWED_FLAG = true;
            }
            this._client.publish("YAVA/RECORD_SPEECH/START/" + this.sessionId, JSON.stringify({ts: new Date().getTime()}));
        });
    }

    done() {
        if(Yava.connected) {
            this._client.publish("YAVA/API/RELEASE_SESSION/" + this.sessionId, "");
        }
        _BORROWED_FLAG = false;        
    }
}
 

 