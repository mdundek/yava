import logging
import json
from datetime import datetime
import paho.mqtt.client as mqtt
import os
import sys
import io
import socket
import speech_recognition as sr

PROCESS_TOPIC = "STT"
if "STT_ALT" in os.environ and os.environ['STT_ALT'] is "1":
    PROCESS_TOPIC = "STT_ALT"

logging.basicConfig()
logger = logging.getLogger(PROCESS_TOPIC + "=>")
logger.setLevel(logging.INFO)

firstConnect = False

r = sr.Recognizer()

MQTT_CONNECTED = False

def get_model_path():
    project_path = os.path.dirname(os.path.realpath(__file__))

    language_path = os.path.join(project_path,os.environ['PSX_LANGUAGE_PATH'])
    hmm_path = os.path.join(project_path,os.environ['PSX_HMM_PATH'])
    lm_file = os.path.join(project_path,os.environ['PSX_LM_FILE'])
    dict_file = os.path.join(project_path,os.environ['PSX_DICT_FILE'])

    for prequisit in [language_path, hmm_path, lm_file, dict_file]:
        if not os.path.exists(prequisit):
            raise IOError('%s does not exits'%prequisit)
    return hmm_path, lm_file, dict_file

hmmd, lmd, dictd = get_model_path()
language_tuple = (hmmd, lmd, dictd)

def on_connect(client, userdata, flags, rc):
    logger.info("MQTT Connected with result code "+str(rc))

    client.subscribe("YAVA/"+PROCESS_TOPIC+"/PROCESS/+")

    global MQTT_CONNECTED
    MQTT_CONNECTED = True

    global firstConnect
    if firstConnect is False:
        firstConnect = True
        client.publish("YAVA/STT/READY", "")

def on_disconnect(client, userdata, rc):
    logger.info("MQTT Disconnected with result code "+str(rc))

    global MQTT_CONNECTED
    MQTT_CONNECTED = False

def on_message(client, userdata, msg):
    if msg.topic.startswith("YAVA/"+PROCESS_TOPIC+"/PROCESS/") == True:
        sessionId = msg.topic.split("/").pop()

        f = open('new.wav', 'wb')
        f.write(msg.payload)
        f.close()
        
        with sr.AudioFile('new.wav') as source:
            audio = r.record(source)

        result = r.recognize_sphinx(audio,language=language_tuple)
        
        client.publish(
            "YAVA/"+PROCESS_TOPIC+"/PROCESS_DONE/"+sessionId, result
        )  

clientMqtt = mqtt.Client()
clientMqtt.on_connect = on_connect
clientMqtt.on_message = on_message
clientMqtt.on_disconnect = on_disconnect

clientMqtt.connect("yava-mosquitto", 1883, 60)

logger.info("MQTT Connecting...")

# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
clientMqtt.loop_forever()