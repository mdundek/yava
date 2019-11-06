import threading
import logging
import paho.mqtt.client as mqtt
import json
import os
import sys
import re
import uuid
import pvporcupine
import struct
import time
from datetime import datetime
import pyaudio

from ctypes import *
from contextlib import contextmanager

ERROR_HANDLER_FUNC = CFUNCTYPE(
    None, c_char_p, c_int, c_char_p, c_int, c_char_p)


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
logger = logging.getLogger("HOTWORD=>")
logger.setLevel(logging.INFO)

MQTT_CONNECTED = False
DETECTOR_RUNNING = False

porcupine = None
pa = None
audio_stream = None
sample_rate = None
num_keywords = 2

keyword_file_paths = []
for r, d, f in os.walk("./models"):
    for file in f:
        if '.ppn' in file:
            keyword_file_paths.append(os.path.join(r, file))

def get_pi_hardware():
    with open('/proc/cpuinfo', 'r') as infile:
        cpuinfo = infile.read()
    # Match a line like 'Hardware   : BCM2709'
    match = re.search('^Hardware\s+:\s+(\w+)$', cpuinfo,
                      flags=re.MULTILINE | re.IGNORECASE)
    if not match:
        # Couldn't find the hardware, assume it isn't a pi.
        return None
    if match.group(1) == 'BCM2836':
        return "cortex-a7"
    if match.group(1) == 'BCM2711':
        return "cortex-a72"
    elif match.group(1) == 'BCM2709':
        return "cortex-a53"
    elif match.group(1) == 'BCM2837':
        return "cortex-a53" 
    elif match.group(1) == 'BCM2835':
        return "arm11" 
    else:
        # Something else, not a pi.
        return None

piHardware = get_pi_hardware()
if piHardware is None:
    logger.error("Raspberry Pi version not recognized")
    sys.exit(1)

library_path = "/usr/local/lib/python3.7/site-packages/pvporcupine/lib/raspberry-pi/" + piHardware + "/libpv_porcupine.so"
model_file_path ="/usr/local/lib/python3.7/site-packages/pvporcupine/lib/common/porcupine_params.pv"

def start_hw_detector_thread():
    # Start the hotword detection thread
    detectorThread = threading.Thread(target=start_hw_detector, args=())
    detectorThread.start()

    global DETECTOR_RUNNING
    DETECTOR_RUNNING = True

    if MQTT_CONNECTED == True:
        client.publish("PASSIST/HOTWORD_DETECTOR/START_DONE", "")

def start_hw_detector():
    global porcupine
    if len(keyword_file_paths) > 0:
        porcupine = pvporcupine.create(
            library_path=library_path,
            model_file_path=model_file_path,
            keyword_file_paths=keyword_file_paths,
            sensitivities=0.5
        )
    else:
        hotwords = os.environ['SYSTEM_HOTWORDS'].split(",")
        porcupine = pvporcupine.create(keywords=hotwords)

    global pa
    
    pa = pyaudio.PyAudio()
    sample_rate = porcupine.sample_rate
    num_channels = 1
    audio_format = pyaudio.paInt16
    frame_length = porcupine.frame_length

    global audio_stream  
    audio_stream = pa.open(
        rate=sample_rate,
        channels=num_channels,
        format=audio_format,
        input=True, 
        output=False,
        frames_per_buffer=frame_length)
    
    while DETECTOR_RUNNING:
        pcm = audio_stream.read(porcupine.frame_length)
        pcm = struct.unpack_from("h" * porcupine.frame_length, pcm)

        result = porcupine.process(pcm)
        if num_keywords == 1 and result:
            hwdetect_callback()
        elif num_keywords > 1 and result >= 0:
            hwdetect_callback()

    
    if audio_stream is not None:
        audio_stream.stop_stream()
        audio_stream.close()

    if pa is not None:
        pa.terminate()

    # delete Porcupine last to avoid segfault in callback.
    if porcupine is not None:
        porcupine.delete()
    client.publish("PASSIST/HOTWORD_DETECTOR/STOP_DONE", "")

def stop_hw_detector():
    global DETECTOR_RUNNING
    DETECTOR_RUNNING = False

    

def hwdetect_callback():
    if MQTT_CONNECTED == True:
        time.sleep(0.3)
        stop_hw_detector()
        client.publish("PASSIST/HOTWORD_DETECTOR/EVENT/" + str(uuid.uuid4())[:8], json.dumps({
            "hotword": True
        }))

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
        stop_hw_detector()

with noalsaerr():
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
