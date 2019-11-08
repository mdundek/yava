import logging
import time
import paho.mqtt.client as mqtt
from mylib import classifier
import json
import os
import requests
from requests.exceptions import HTTPError

logging.basicConfig()
logger = logging.getLogger("NLU=>")
logger.setLevel(logging.INFO)

MQTT_CONNECTED = False

matcher = None
trainingSets = None
firstConnect = False

def on_connect(client, userdata, flags, rc):
    logger.info("MQTT Connected with result code "+str(rc))

    global trainingSets
    if trainingSets is None:
        utteranceGen = classifier.UtteranceGen("/usr/src/app/training_data/train.yaml")
        trainingSets = utteranceGen.generateTrainingSet()
    
    global matcher
    if matcher is None:
        matcher = classifier.NodeMatcher(
            trainingSets["spacy"], 
            intentsModelFile="/usr/src/app/models/intents/model.nlp", 
            language=os.environ['LANGUAGE']
        )

        matcher.loadModel()

        client.subscribe("YAVA/NLP/MATCH/+")

    global MQTT_CONNECTED
    MQTT_CONNECTED = True

    global firstConnect
    if firstConnect is False:
        firstConnect = True
        client.publish("YAVA/NLP/READY", "")


def on_disconnect(client, userdata, rc):
    logger.info("MQTT Disconnected with result code "+str(rc))

    global MQTT_CONNECTED
    MQTT_CONNECTED = False


# The callback for when a PUBLISH message is received from the server.
def on_message(client, userdata, msg):
    if msg.topic.startswith("YAVA/NLP/MATCH/") == True:
        
        sessionId = msg.topic.split("/").pop()
        m_decode = str(msg.payload.decode("utf-8", "ignore"))
        m_in = json.loads(m_decode)  # decode json data
        
        global matcher
        nlpResult = matcher.match(m_in["text"], min_confidence=0.7)
        
        # logger.info(nlpResult)

        if nlpResult is not None:
            nlpResult["utterance"] = m_in["text"]
            client.publish("YAVA/NLP/MATCH_DONE/" + sessionId, json.dumps(nlpResult))
        else:
            client.publish("YAVA/NLP/MATCH_DONE/" + sessionId, json.dumps({
                "intent": "",
                "entities": "",
                "utterance": m_in["text"]
            }))

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
client.on_disconnect = on_disconnect

client.connect("yava-mosquitto", 1883, 60)
logger.info("MQTT Connecting...")
client.loop_forever()
