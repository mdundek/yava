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
firstConnect = False

def on_connect(client, userdata, flags, rc):
    logger.info("MQTT Connected with result code "+str(rc))

    global matcher
    if matcher is None:
        matcher = classifier.NodeMatcher(intentsModelFile="/usr/src/app/models/intents/model.nlp", entitiesModelDir="/usr/src/app/models/entities", language=os.environ['LANGUAGE'])
       
    client.subscribe("PASSIST/NLP/MATCH/+")

    global MQTT_CONNECTED
    MQTT_CONNECTED = True

    global firstConnect
    if firstConnect is False:
        firstConnect = True
        client.publish("PASSIST/NLP/READY", "")


def on_disconnect(client, userdata, rc):
    logger.info("MQTT Disconnected with result code "+str(rc))

    global MQTT_CONNECTED
    MQTT_CONNECTED = False


# The callback for when a PUBLISH message is received from the server.
def on_message(client, userdata, msg):
    if msg.topic.startswith("PASSIST/NLP/MATCH/") == True:
        
        sessionId = msg.topic.split("/").pop()
        m_decode = str(msg.payload.decode("utf-8", "ignore"))
        m_in = json.loads(m_decode)  # decode json data
        
        global matcher
        intentMatch = matcher.matchIntent(m_in["text"], min_confidence=0.7, language=os.environ['LANGUAGE'])
        
        # logger.info(intentMatch)

        if intentMatch is not None:
            entities = matcher.matchEntities(intentMatch["intent"], m_in["text"])
            intentMatch["entities"] = intentMatch["entities"] + entities
            intentMatch["utterance"] = m_in["text"]
            client.publish("PASSIST/NLP/MATCH_DONE/" + sessionId, json.dumps(intentMatch))
        else:
            client.publish("PASSIST/NLP/MATCH_DONE/" + sessionId, json.dumps({
                "intent": "",
                "entities": "",
                "utterance": m_in["text"]
            }))

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
client.on_disconnect = on_disconnect

client.connect("pva-mosquitto", 1883, 60)
logger.info("MQTT Connecting...")
client.loop_forever()
