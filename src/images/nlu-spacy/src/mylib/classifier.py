import threading
import yaml
import sys
import re
import os
import json
import time
import _pickle as cPickle
from pathlib import Path
from textblob.classifiers import MaxEntClassifier
import spacy
import random
from spacy.util import minibatch, compounding
from nltk.corpus import stopwords as stopwords
import unicodedata as _unicodedata
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
        self._tbl = None
        self._stopwords = None

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

    def _get_stopwords(self):
        self._tbl = dict.fromkeys(i for i in range(sys.maxunicode)
                            if _unicodedata.category(chr(i)).startswith('P'))

        self._stopwords = dict.fromkeys(s for s in set(stopwords.words('english')))


    def clean_text(self, str):
        if self._tbl is None or self._stopwords is None:
            self._get_stopwords()

        # get rid of the puncuation
        str = str.translate(self._tbl)
        # get rid of the stopwords
        str = str.translate(self._stopwords)
        # lowercase everything
        str = str.lower()
        return str

    def train(self, trainingSets, intentsModelFile="./intents_model.pickle", iterations=200, break_at_lldelta=0.0002, entitiesModelDir="./models/entities/", entity_iterations=40):
        # First, the intent parser
        flattenedTrainingSet = []
        for intent in trainingSets["classifier"]:
            setData = [(x, intent) for x in trainingSets["classifier"][intent]]

            to = []
            for o in setData:
                # to.append((self.clean_text(o[0]), o[1]))
                to.append((o[0], o[1]))
        
            flattenedTrainingSet.extend(to)

        self._classifier = MaxEntClassifier(flattenedTrainingSet)
        self._classifier.train(min_lldelta=break_at_lldelta, max_iter=iterations)

        save_training = open(intentsModelFile,'wb')
        cPickle.dump(self._classifier, save_training)  # SAVE TRAINED CLASSIFIER
        save_training.close()

        self.trainEntities(trainingSets["spacy"], entitiesModelDir=entitiesModelDir, entity_iterations=entity_iterations)

    def trainNodeIntents(self, trainingSetsIntents, intentsModelFile="/usr/src/app/models/intents/model.nlp", language="en"):
        try:
            response = requests.post('http://localhost:8000/train', data={
                "data": json.dumps(trainingSetsIntents),
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

    def trainEntities(self, trainingSetsEntities, entitiesModelDir="/usr/src/app/models/entities", entity_iterations=40):
        # Now the entity recognizer
        
        LABEL = []
        TRAIN_DATA = []
        for intent in trainingSetsEntities:
            
            TRAIN_DATA = TRAIN_DATA + trainingSetsEntities[intent]

            for sampleUtteranceData in TRAIN_DATA:
                for entityConfig in sampleUtteranceData[1]["entities"]:
                    if entityConfig[2] not in LABEL:
                        LABEL.append(entityConfig[2])
            
        nlp = spacy.load(os.environ['SPACY_MODEL'])
        if 'ner' not in nlp.pipe_names:
            ner = nlp.create_pipe('ner')
            nlp.add_pipe(ner)
        else:
            ner = nlp.get_pipe('ner')
        for i in LABEL:
            ner.add_label(i)

        optimizer = nlp.entity.create_optimizer()
        
        other_pipes = [pipe for pipe in nlp.pipe_names if pipe != 'ner']
        with nlp.disable_pipes(*other_pipes):  # only train NER
            for itn in range(entity_iterations):
                random.shuffle(TRAIN_DATA)
                losses = {}
                batches = minibatch(TRAIN_DATA, size=compounding(4., 32., 1.001))
                for batch in batches:
                    texts, annotations = zip(*batch)
                    nlp.update(texts, annotations, sgd=optimizer, drop=0.25, losses=losses)
                print('Losses in training entities for intent ' + intent, losses)

        output_dir = Path(os.path.join(entitiesModelDir, "p_model_" + os.environ['SPACY_MODEL']))
        if not output_dir.exists():
            output_dir.mkdir()
        nlp.meta['name'] = "p_model_" + os.environ['SPACY_MODEL']
        nlp.to_disk(output_dir)            


class Matcher:
    def __init__(self, intentsModelFile="./intents_model.pickle", entitiesModelDir="./models/entities/"):
        load_training = open(intentsModelFile,'rb')
        self._classifier = cPickle.load(load_training)

        intentFolders = next(os.walk(entitiesModelDir))[1]
        self._intent_entity_nlp = spacy.load(os.path.join(entitiesModelDir, "p_model_" + os.environ['SPACY_MODEL']))
       
    def matchIntent(self, question, min_confidence=0.83):
        prob_dist = self._classifier.prob_classify(question)
        if prob_dist.prob(prob_dist.max()) >= min_confidence:
            res = {}
            res['intent'] = prob_dist.max()
            res['confidence'] = prob_dist.prob(prob_dist.max())

            return res
        else:
            return None

    def matchEntities(self, intent, question):
        doc = self._intent_entity_nlp(question)
        entities = []
        for ent in doc.ents:
            entities.append({"entity": ent.label_, "value": ent.text})

        return entities

class NodeMatcher:
    def __init__(self, intentsModelFile="./models/intents/model.nlp", entitiesModelDir="./models/entities/"):       
        
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
        intentFolders = next(os.walk(entitiesModelDir))[1]
        self._intent_entity_nlp = spacy.load(os.path.join(entitiesModelDir, "p_model_" + os.environ['SPACY_MODEL']))
       
    def matchIntent(self, question, min_confidence=0.73, language="en"):
        try:
            response = requests.post('http://localhost:8000/match', data={
                "data": question,
                "language": language,
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

    def matchEntities(self, intent, question):
        doc = self._intent_entity_nlp(question)
        entities = []
        for ent in doc.ents:
            entities.append({"entity": ent.label_, "value": ent.text})

        return entities