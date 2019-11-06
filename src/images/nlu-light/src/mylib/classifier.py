import threading
import yaml
import sys
import re
import os
import json
import time
import _pickle as cPickle
from pathlib import Path
import requests
from requests.exceptions import HTTPError

class UtteranceGen:

    trainingData = []

    def __init__(self, path):
        self.loadTrainingData(path)

    def loadTrainingData(self, path):
        with open(path, 'r') as stream:
            try:
                global trainingData
                trainingData = yaml.safe_load(stream)

            except yaml.YAMLError as exc:
                print(exc)
                sys.exit(1)

    def templatesHaveMoreEntities(self, intentTemplates):
        for template in intentTemplates:
            # Process all entities first
            entityPlaceholders = re.findall(r'\[.*?\]', template)
            if len(entityPlaceholders) > 0:
                return True
        return False

    def templatesHaveMorePlaceholders(self, intentTemplates):
        for template in intentTemplates:
            # Process all placeholders first
            entityPlaceholders = re.findall(r'\{.*?\}', template)
            if len(entityPlaceholders) > 0:
                return True
        return False

    def generateUtterancesWithEntities(self, intentTemplates):
        generatedUtterances = []
        for template in intentTemplates:
            # Process all entities first
            entityPlaceholders = re.findall(r'\[.*?\]', template)
            if len(entityPlaceholders) > 0:
                for ep in entityPlaceholders:
                    # Get list of target entity
                    entities = trainingData['training']['entities'][ep[1:-1]]
                    for entity in entities:
                        # Now generate sample utterance
                        constructedUtterance = template.replace(ep, entity, 1)
                        generatedUtterances.append(constructedUtterance)
            else:
                generatedUtterances.append(template)
        return generatedUtterances

    def generateUtterancesWithPlaceholders(self, intentTemplates):
        generatedUtterances = []
        for template in intentTemplates:
            
            # Process all placeholders first
            entityPlaceholders = re.findall(r'\{.*?\}', template)
            if len(entityPlaceholders) > 0:
                for ep in entityPlaceholders:
                    # Get list of target placeholder
                    placeholders = trainingData['training']['placeholders'][ep[1:-1]]
                    for placeholder in placeholders:
                        # Now generate sample utterance
                        constructedUtterance = template.replace(ep, placeholder, 1)
                        generatedUtterances.append(constructedUtterance)
            else:
                generatedUtterances.append(template)
        return generatedUtterances

    def tagEntitiesHaveMoreEntities(self, utteranceList):
        for tagObject in utteranceList:
            # Process all entities first
            entityPlaceholders = re.findall(r'\[.*?\]', tagObject["utterance"])
            if len(entityPlaceholders) > 0:
                return True
        return False

    def tagEntities(self, utteranceList):
        taggedUtterances = []
        for tagObject in utteranceList:
            # Process all entities first
            entityPlaceholders = re.findall(r'\[.*?\]', tagObject["utterance"])
            if len(entityPlaceholders) > 0:
                ep = entityPlaceholders[0]
                # Get list of target entity
                entities = trainingData['training']['entities'][ep[1:-1]]
                for entity in entities:
                    # Now generate sample utterance
                    entityStartIndex = tagObject["utterance"].find(ep)
                    entityEndIndex = entityStartIndex + len(entity)
                    constructedUtterance = tagObject["utterance"].replace(ep, entity, 1)
                    entCopy = tagObject["entities"].copy()
                    entLabel = ep[1:-1]
                    entLabel = re.sub(r'\(.*?\)','', entLabel)
                    entCopy.append((entityStartIndex, entityEndIndex, entLabel))
                    taggedUtterances.append({
                        "entities": entCopy,
                        "utterance": constructedUtterance
                    })
            else:
                taggedUtterances.append(tagObject)
        return taggedUtterances

    def generateTrainingSet(self):
        intentUtterances = {}
        intentEntities = {}
        
        for intent in trainingData['training']['intents']:
            # One intent at a time
            utterances = trainingData['training']['intents'][intent]

            # Intents: Parse and generate utterances for all placeholder tags
            while self.templatesHaveMorePlaceholders(utterances) is True:
                utterances = self.generateUtterancesWithPlaceholders(utterances)

            # Entities: Parse and generate entity tagging samples
            taggedUtterances = []
            for u in utterances:
                taggedUtterances.append({
                    "entities": [],
                    "utterance": u
                })
            while self.tagEntitiesHaveMoreEntities(taggedUtterances) is True:
                taggedUtterances = self.tagEntities(taggedUtterances)

            intentEntities[intent] = taggedUtterances
      
            # Intents: Parse and generate utterances for all entities tags
            while self.templatesHaveMoreEntities(utterances) is True:
                utterances = self.generateUtterancesWithEntities(utterances)

            intentUtterances[intent] = utterances

        spacyTrainSetByIntent = {}
        for intent in intentEntities:

            spacyTrainSet = []
            for o in intentEntities[intent]:
                spacyTrainSet.append((o["utterance"], {"entities" : o["entities"]}))
            spacyTrainSetByIntent[intent] = spacyTrainSet

        return {"classifier": intentUtterances, "spacy": spacyTrainSetByIntent}




class Trainer:
    def __init__(self):
        def _start_node_server():
            os.system("./runServer.sh")

        self.nodeServerThread = threading.Thread(target=_start_node_server, args=())
        self.nodeServerThread.start()
        
        attempts = 0
        while True:
            try:
                requests.get('http://localhost:8000/ping')
                break
            except Exception as err:
                attempts = attempts + 1
                time.sleep(1)
                if attempts > 10:
                    raise ValueError('NodeJS server could not be started')
                    break

    def train(self, trainingSets, intentsModelFile="/usr/src/app/models/intents/model.nlp", language="en"):
        try:
            response = requests.post('http://localhost:8000/train', data={
                "data": json.dumps(trainingSets),
                "language": language,
                "intentsModelFile": intentsModelFile
            })
            # If the response was successful, no Exception will be raised
            response.raise_for_status()
        except HTTPError as http_err:
            print(f'HTTP error occurred: {http_err}')  # Python 3.6
            return False
        except Exception as err:
            print(f'Other error occurred: {err}')  # Python 3.6
            return False
           
        return True

class NodeMatcher:
    def __init__(self, entityTrainingData, intentsModelFile="./models/intents/model.nlp", language="en"):  

        self.language = language     
        
        def _start_node_server():
            os.system("./runServer.sh")

        self.nodeServerThread = threading.Thread(target=_start_node_server, args=())
        self.nodeServerThread.start()
        
        attempts = 0
        while True:
            try:
                requests.get('http://localhost:8000/ping')
                break
            except Exception as err:
                attempts = attempts + 1
                time.sleep(1)
                if attempts > 10:
                    raise ValueError('NodeJS server could not be started')
                    break

        self.intentsModelFile = intentsModelFile

        requests.post('http://localhost:8000/loadEntityData', data={
            "data": json.dumps(entityTrainingData),
            "language": self.language
        })


        
       
    def match(self, question, min_confidence=0.73):
        try:
            response = requests.post('http://localhost:8000/match', data={
                "data": question,
                "language": self.language,
                "intentsModelFile": self.intentsModelFile
            })
            # If the response was successful, no Exception will be raised
            response.raise_for_status()            
            httpResponse = response.json()
                        
            if 'intent' in httpResponse["result"]:
                if httpResponse["result"]["confidence"] >= min_confidence:
                    return httpResponse["result"]
                else:
                    return None
            else:
                return None

        except HTTPError as http_err:
            print(f'HTTP error occurred: {http_err}')  # Python 3.6
            return None
        except Exception as err:
            print(f'Other error occurred: {err}')  # Python 3.6
            return None