import logging
import time
import paho.mqtt.client as mqtt
from mylib import classifier
import json
import os
import sys
import requests
from requests.exceptions import HTTPError

utteranceGen = classifier.UtteranceGen("./training_data/train.yaml")
trainingSets = utteranceGen.generateTrainingSet()

try:
    question = sys.argv[1]
    matcher = classifier.NodeMatcher(
        trainingSets["spacy"], 
        intentsModelFile="/usr/src/app/models/intents/model.nlp", 
        language=os.environ['LANGUAGE']
    )

    result = matcher.match(question)
    print(json.dumps(result, indent=4, sort_keys=True))
   
    
except HTTPError as http_err:
    print(f'HTTP error occurred: {http_err}')
    
except Exception as err:
    print(f'Other error occurred: {err}')

response = requests.get('http://localhost:8000/exit')
response.raise_for_status()