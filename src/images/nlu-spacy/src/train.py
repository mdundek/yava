import logging
import time
import paho.mqtt.client as mqtt
from mylib import classifier
import json
import os
import requests
from requests.exceptions import HTTPError

utteranceGen = classifier.UtteranceGen("./training_data/train.yaml")
trainingSets = utteranceGen.generateTrainingSet()

trainer = classifier.Trainer()
success = trainer.trainNodeIntents(
    trainingSets["classifier"],
    intentsModelFile="/usr/src/app/models/intents/model.nlp", 
    language=os.environ['LANGUAGE']
)
if success is False:
    print("An error occured, training could not finish")
else:
    trainer.trainEntities(
        trainingSets["spacy"], 
        entitiesModelDir="/usr/src/app/models/entities", 
        entity_iterations=int(os.environ['TRAIN_ENTITIES_ITERATIONS'])
)
  
try:
    response = requests.get('http://localhost:8000/exit')
    # If the response was successful, no Exception will be raised
    response.raise_for_status()
except HTTPError as http_err:
    print(f'HTTP error occurred: {http_err}')
    
except Exception as err:
    print(f'Other error occurred: {err}')