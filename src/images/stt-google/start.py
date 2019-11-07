import logging
import json
from datetime import datetime
import paho.mqtt.client as mqtt
import os
import io

from google.cloud import speech
from google.cloud.speech import enums
from google.cloud.speech import types
from google.oauth2 import service_account

# Instantiates a client
creds = service_account.Credentials.from_service_account_file("/usr/src/app/credentials.json")
gClient = speech.SpeechClient(credentials=creds)

gConfig = types.RecognitionConfig(
    encoding=enums.RecognitionConfig.AudioEncoding.LINEAR16,
    enable_automatic_punctuation=True,
    sample_rate_hertz=16000,
    language_code='en-US')

PROCESS_TOPIC = "STT"
if "STT_ALT" in os.environ and os.environ['STT_ALT'] is "1":
    PROCESS_TOPIC = "STT_ALT"

logging.basicConfig()
logger = logging.getLogger(PROCESS_TOPIC + "=>")
logger.setLevel(logging.INFO)

firstConnect = False

MQTT_CONNECTED = False

def on_connect(client, userdata, flags, rc):
    logger.info("MQTT Connected with result code "+str(rc))

    client.subscribe("PASSIST/"+PROCESS_TOPIC+"/PROCESS/+")

    global MQTT_CONNECTED
    MQTT_CONNECTED = True

    global firstConnect
    if firstConnect is False:
        firstConnect = True
        client.publish("PASSIST/STT/READY", "")

def on_disconnect(client, userdata, rc):
    logger.info("MQTT Disconnected with result code "+str(rc))

    global MQTT_CONNECTED
    MQTT_CONNECTED = False

def on_message(client, userdata, msg):
    if msg.topic.startswith("PASSIST/"+PROCESS_TOPIC+"/PROCESS/") == True:
        sessionId = msg.topic.split("/").pop()
      
        audio = types.RecognitionAudio(content=msg.payload)
        response = gClient.recognize(gConfig, audio)        
      
        for result in response.results:
            client.publish(
                "PASSIST/"+PROCESS_TOPIC+"/PROCESS_DONE/"+sessionId, result.alternatives[0].transcript
            )
            break
      
clientMqtt = mqtt.Client()
clientMqtt.on_connect = on_connect
clientMqtt.on_message = on_message
clientMqtt.on_disconnect = on_disconnect

clientMqtt.connect("pva-mosquitto", 1883, 60)

logger.info("MQTT Connecting...")

# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
clientMqtt.loop_forever()
