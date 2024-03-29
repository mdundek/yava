from threading import Thread
import logging
import speech_recognition as sr
import json
import time
import os
import paho.mqtt.client as mqtt
import wave
import contextlib
from datetime import datetime
from ctypes import *
from contextlib import contextmanager

ERROR_HANDLER_FUNC = CFUNCTYPE(None, c_char_p, c_int, c_char_p, c_int, c_char_p)
def py_error_handler(filename, line, function, err, fmt):
    pass
c_error_handler = ERROR_HANDLER_FUNC(py_error_handler)

@contextmanager
def noalsaerr():
    asound = cdll.LoadLibrary('libasound.so')
    asound.snd_lib_error_set_handler(c_error_handler)
    yield
    asound.snd_lib_error_set_handler(None)

logging.basicConfig()
logger = logging.getLogger("CAPTURE=>")
logger.setLevel(logging.INFO)

sample_rate = 16000

firstConnect = False

r = sr.Recognizer()
r.dynamic_energy_threshold = True
MQTT_CONNECTED = False

MAX_PHRASE_LIMIT_SEC = 20
if "MAX_PHRASE_LIMIT_SEC" in os.environ:
    MAX_PHRASE_LIMIT_SEC = int(os.environ["MAX_PHRASE_LIMIT_SEC"])

MAX_PHRASE_LIMIT_MS = MAX_PHRASE_LIMIT_SEC * 1000

def capture_speech(sessionId, payload):
    with sr.Microphone(sample_rate=sample_rate) as source:
        r.adjust_for_ambient_noise(source, duration=0.5)
        try:
            start_ms = time.time_ns()
            audio = r.listen(source, timeout=5, phrase_time_limit=MAX_PHRASE_LIMIT_SEC)
            end_ms = time.time_ns()

            duration_ms = (end_ms - start_ms) / 1000000

            if duration_ms >= MAX_PHRASE_LIMIT_MS:
                client.publish("YAVA/ERROR/" + sessionId, json.dumps({
                    "reason": "AUD_MAX",
                    "ts": datetime.timestamp(datetime.now())
                }))
            else:
                wav_data = audio.get_wav_data()
                client.publish(
                    "YAVA/RECORD_SPEECH/CAPTURED/" + sessionId, wav_data)
       
        except Exception as e:
            if type(e).__name__ == "WaitTimeoutError":
                client.publish("YAVA/ERROR/" + sessionId, json.dumps({
                    "reason": "AUD_TMO",
                    "ts": datetime.timestamp(datetime.now())
                }))
            else:
                client.publish("YAVA/ERROR/" + sessionId, json.dumps({
                    "reason": "AUD_ERR",
                    "ts": datetime.timestamp(datetime.now())
                }))

def on_connect(client, userdata, flags, rc):
    logger.info("MQTT Connected with result code "+str(rc))

    client.subscribe("YAVA/RECORD_SPEECH/START/+")

    global MQTT_CONNECTED
    MQTT_CONNECTED = True

    global firstConnect
    if firstConnect is False:
        firstConnect = True
        client.publish("YAVA/RECORD_SPEECH/READY", "")


def on_disconnect(client, userdata, rc):
    logger.info("MQTT Disconnected with result code "+str(rc))

    global MQTT_CONNECTED
    MQTT_CONNECTED = False

def on_message(client, userdata, msg):
    if msg.topic.startswith("YAVA/RECORD_SPEECH/START/") == True:
        sessionId = msg.topic.split("/").pop()
        
        m_decode = str(msg.payload.decode("utf-8", "ignore"))
        m_in = json.loads(m_decode)  # decode json data
        capture_speech(sessionId, m_in)

with noalsaerr():
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
