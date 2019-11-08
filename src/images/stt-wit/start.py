import logging
import speech_recognition as sr
import json
from datetime import datetime
import paho.mqtt.client as mqtt
import os

WIT_KEY = None
with open('key.txt', 'r') as file:
    WIT_KEY = file.read().replace('\n', '')

if WIT_KEY is None:
    logger.error("No API key provided for WIT STT")
    sys.exit(1)

PROCESS_TOPIC = "STT"
if "STT_ALT" in os.environ and os.environ['STT_ALT'] is "1":
    PROCESS_TOPIC = "STT_ALT"

logging.basicConfig()
logger = logging.getLogger(PROCESS_TOPIC + "=>")
logger.setLevel(logging.INFO)

firstConnect = False

r = sr.Recognizer()

MQTT_CONNECTED = False

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

        f = sr.AudioFile('new.wav')
        with f as source:
            audio = r.record(source)

        try:
            recog = r.recognize_wit(
                audio, key=WIT_KEY)
            logger.info(recog)
            client.publish(
                "YAVA/"+PROCESS_TOPIC+"/PROCESS_DONE/"+sessionId, recog)
        except sr.UnknownValueError:
            logger.error("could not understand audio")
            client.publish("YAVA/ERROR/" + sessionId, json.dumps({
                "reason": "STT_AUD",
                "ts": datetime.timestamp(datetime.now())
            }))
        except sr.RequestError as e:
            logger.error("Could not request results ; {0}".format(e))
            client.publish("YAVA/ERROR/" + sessionId, json.dumps({
                "reason": "STT_ERR",
                "ts": datetime.timestamp(datetime.now())
            }))

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
client.on_disconnect = on_disconnect

client.connect("yava-mosquitto", 1883, 60)

logger.info("MQTT Connecting...")

# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
client.loop_forever()
