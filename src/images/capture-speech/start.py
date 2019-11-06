from threading import Thread
import logging
import speech_recognition as sr
import json
import time
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

r = sr.Recognizer()
r.dynamic_energy_threshold = True

MQTT_CONNECTED = False

def capture_speech(sessionId, payload):
    with sr.Microphone(sample_rate=sample_rate) as source:
        r.adjust_for_ambient_noise(source, duration=0.5)
        try:
            audio = r.listen(source, timeout=5)
            wav_data = audio.get_wav_data()
            if len(wav_data) > 500000:
                logger.info("Audio length is too big, please make shorter sentances")

                client.publish("PASSIST/ERROR/" + sessionId, json.dumps({
                    "reason": "AUD_MAX",
                    "ts": datetime.timestamp(datetime.now())
                }))
            else:
                client.publish(
                    "PASSIST/RECORD_SPEECH/CAPTURED/" + sessionId, wav_data)
        except TimeoutException:
            client.publish("PASSIST/ERROR/" + sessionId, json.dumps({
                "reason": "AUD_TMO",
                "ts": datetime.timestamp(datetime.now())
            }))
        except Exception as e:
            logger.error(e)
            client.publish("PASSIST/ERROR/" + sessionId, json.dumps({
                "reason": "AUD_ERR",
                "ts": datetime.timestamp(datetime.now())
            }))

def on_connect(client, userdata, flags, rc):
    logger.info("MQTT Connected with result code "+str(rc))

    client.subscribe("PASSIST/RECORD_SPEECH/START/+")

    global MQTT_CONNECTED
    MQTT_CONNECTED = True


def on_disconnect(client, userdata, rc):
    logger.info("MQTT Disconnected with result code "+str(rc))

    global MQTT_CONNECTED
    MQTT_CONNECTED = False

def on_message(client, userdata, msg):
    if msg.topic.startswith("PASSIST/RECORD_SPEECH/START/") == True:
        sessionId = msg.topic.split("/").pop()
        
        m_decode = str(msg.payload.decode("utf-8", "ignore"))
        m_in = json.loads(m_decode)  # decode json data
        capture_speech(sessionId, m_in)

with noalsaerr():
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
