import logging
import subprocess
import json
import paho.mqtt.client as mqtt

logging.basicConfig()
logger = logging.getLogger("TTS=>")
logger.setLevel(logging.INFO)

MQTT_CONNECTED = False

def on_connect(client, userdata, flags, rc):
    logger.info("MQTT Connected with result code "+str(rc))
    client.subscribe("PASSIST/TTS/SAY/+")

    global MQTT_CONNECTED
    MQTT_CONNECTED = True

def on_disconnect(client, userdata, rc):
    logger.info("MQTT Disconnected with result code "+str(rc))

    global MQTT_CONNECTED
    MQTT_CONNECTED = False

def on_message(client, userdata, msg):
    if msg.topic.startswith("PASSIST/TTS/SAY/") == True:
        sessionId = msg.topic.split("/").pop()

        m_decode = str(msg.payload.decode("utf-8", "ignore"))
        m_in = json.loads(m_decode)  # decode json data
        subprocess.run(["./mimic1/mimic", "-t", m_in["text"]])
        client.publish("PASSIST/TTS/SAY_DONE/" + sessionId, "")

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
client.on_disconnect = on_disconnect

client.connect("pva-mosquitto", 1883, 60)

logger.info("MQTT Connecting...")

# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
client.loop_forever()
