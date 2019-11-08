# YAVA (Yet Another Voice Assistant)

__YAVA__ is a full fledged open source, extensible voice assistant solution with a focus on flexibility, based on popular components that make the various pieces and bits of a complete voice assistant. designed to run on a Raspberry Pi 2/3. I have not tested it on a Raspberry Pi 4 or Zero, so if you do test it on those platforms, please let me know how it goes. Other platforms will be supported soon.

To read more about why yet another voice assistant, checkout the section ["Why another voice assistant"](#introduction). 

<img width="100%" src="header.png">

## Table of contents

* [Why another voice assistant](#introduction)  
* [Some of the key features](#keyfeatures)  
* [Installation](./INSTALL.md)  
	* [Prerequisit](./INSTALL.md#prereq)  
	* [Install the Private Voice Assistant](./INSTALL.md#install_yava)  
* [Configuration & Setup](./SETUP.md)   
	* [Prepare your configuration files](./SETUP.md#prepare)
	* [Hotword detector](./SETUP.md#hotword)  
		* [Configure Snowboy](./SETUP.md#snowboy)  
		* [Configure Porcupine](./SETUP.md#porcupine)  	
	* [Speech capture](./SETUP.md#speechcapture)  	
	* [Speech to text](./SETUP.md#stt)  	
		* [Configure Pocketsphinx STT](./SETUP.md#pocketsphinx)  
		* [Configure WIT STT](./SETUP.md#wit)  	
		* [Configure Google STT](./SETUP.md#googlestt)  
		* [Configure a second STT container (optional)](./SETUP.md#secondarystt)  
	* [NLU](./SETUP.md#nlu)  
		* [Configure NLU Light](./SETUP.md#nlulight)  
		* [Configure NLU Spacy](./SETUP.md#nluspacy)  
	* [Text to speech](./SETUP.md#tts)  
	* [Ortchestrator](./SETUP.md#orchestrator)  
	* [MQTT broker](./SETUP.md#mqtt)  
* [Use the platform](./USE.md)  
  * [Train your NLU model](./USE.md#train) 
    * [Prepare your training data](./USE.md#confignlu)  
    * [Train model for NLU Light](./USE.md#nlulighttrain)  
    * [Train model for NLU Spacy](./USE.md#nluspacytrain)  
* [Start the voice assistant](./USE.md#startassistant)  
* [Get the message bus logs](./USE.md#logsassistant)  
* [Stop the voice assistant](./USE.md#stopassistant)  
* [Use the client libraries](./USE.md#clientlib)  
	* [NodeJS library](./USE.md#libnode)  
    * [Python library](./USE.md#libpy)
    * [Java library](./USE.md#libjava) 


## Why another voice assistant?<a name="introduction"></a>

There are plenty of voice assistants out there, even a couple of open source once. The work they have done is great and some of them where a source of inspiration for this project.  

Nevertheless, sometimes you need more out of your assistant than the usual __hotword__ => __command capture__ => __intent matching__ => __action__ kind of workflow.  

Maybe you would like to skip the `hotword` detection part, and use the assistant on specific components of the overall solution only. Or let's say you are building a robot that for some reason needs to interact with you (ex. on environemental sensor triggers, or simply because of a custom event you defined), rather than you asking it to listen to you command when you need to interact with it by calling a hotword. Or let's say you want to capture the transcribed text from your speech without it going through the NLU component for intent and entity recognition. Or even better, you want to use two speech to text engines in your solution, one to run offline on the device for privacy, and one for accurate transcription on the cloud for specific commands within your application flow.  

You see, there are alot of situations where you need flexibility of the solution in order to achieve certain goals, and that's what this project is focusing on.    

## Some of the key features<a name="keyfeatures"></a>

- Plug & play composable architecture, flexible and extensible
- NodeJs, Python & Java client libraries (Python & Java will be available soon)
- Possibility to transcribe user commands to text without NLU matching
- Possibility to hyjack and control the assistant from your application, rather than triggered by a hotword
- Possibility to use 2 separate speech to text engines for optimised use cases

## What's next

This project is fairly recent, and should be considered at the moment as work in progress. There might still be some bugs, so if you come across some unwanted behaviour or bugs, please let me know. At the moment the focus is at stabilizing the platform and finishing some components such as client libraries for other programming languages. 

__Work in progress:__ 

- Add support for other languages than English
- Automated mandatory entity slot filling
- Python & Java client libraries
- Add Espeak & Google TTS images as alternatives for the TTS engines
- Write documentation on how to extend and build new images for the YAVA platform