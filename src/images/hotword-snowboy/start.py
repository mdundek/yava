from snowboy.snowboydecoder import HotwordDetector
import signal
import os
import logging
import pyaudio
import time
import wave
import threading
import json
import paho.mqtt.client as mqtt
import uuid

logging.basicConfig()
logger = logging.getLogger("HOTWORD=>")
logger.setLevel(logging.INFO)

# Declare the detector object
detector = None

MQTT_CONNECTED = False
DETECTOR_RUNNING = False

modelFile = None
for r, d, f in os.walk("./models"):
    for file in f:
        if ('.pmdl' in file) or ('.umdl' in file):
            modelFile = os.path.join(r, file)

def interrupt_callback():
    False

def start_hw_detector_thread():
    # Start the hotword detection thread
    detectorThread = threading.Thread(target=start_hw_detector, args=())
    detectorThread.start()

    global DETECTOR_RUNNING
    DETECTOR_RUNNING = True

    if MQTT_CONNECTED == True:
        client.publish("PASSIST/HOTWORD_DETECTOR/START_DONE", "")

def stop_hw_detector_thread():
    global detector
    detector.terminate()

def start_hw_detector():
    global detector
    detector = HotwordDetector(modelFile, sensitivity=0.4)
    detector.start(detected_callback=hwdetect_callback,
                   interrupt_check=interrupt_callback,
                   sleep_time=0.03)

    logger.debug("Stopped Snowboy listener")
    global DETECTOR_RUNNING
    DETECTOR_RUNNING = False

    detector.terminate()

def hwdetect_callback():
    if MQTT_CONNECTED == True:
        stop_hw_detector_thread()
        client.publish("PASSIST/HOTWORD_DETECTOR/EVENT/" + str(uuid.uuid4())[:8], json.dumps({
            "hotword": True
        }))

# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, flags, rc):
    logger.info("MQTT Connected with result code "+str(rc))

    client.subscribe("PASSIST/HOTWORD_DETECTOR/START")
    client.subscribe("PASSIST/HOTWORD_DETECTOR/STOP")

    global MQTT_CONNECTED
    MQTT_CONNECTED = True

def on_disconnect(client, userdata, rc):
    logger.info("MQTT Disconnected with result code "+str(rc))

    global MQTT_CONNECTED
    MQTT_CONNECTED = False

def on_message(client, userdata, msg):
    if msg.topic == "PASSIST/HOTWORD_DETECTOR/START" and DETECTOR_RUNNING == False:
        start_hw_detector_thread()

    if msg.topic == "PASSIST/HOTWORD_DETECTOR/STOP" and DETECTOR_RUNNING == True:
        stop_hw_detector_thread()

# Now staret the detector thread
start_hw_detector_thread()

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
