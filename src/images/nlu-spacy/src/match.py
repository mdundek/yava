import logging
import time
import paho.mqtt.client as mqtt
from mylib import classifier
import json
import os
import sys
import requests
from requests.exceptions import HTTPError

try:
    question = sys.argv[1]
    matcher = classifier.NodeMatcher(intentsModelFile="/usr/src/app/models/intents/model.nlp", entitiesModelDir="/usr/src/app/models/entities/")
    intentMatch = matcher.matchIntent(question, language=os.environ['LANGUAGE'])
    print(intentMatch)
    if intentMatch is not None:
        entityMatch = matcher.matchEntities(intentMatch['intent'], question)
        print(entityMatch)
    
except HTTPError as http_err:
    print(f'HTTP error occurred: {http_err}')
    
except Exception as err:
    print(f'Other error occurred: {err}')

response = requests.get('http://localhost:8000/exit')
response.raise_for_status()