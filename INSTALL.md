## Table of contents

* [Prerequisit](#prereq)  
* [Install the Private Voice Assistant](#install_pva)  

## Installation<a name="install"></a>

### Prerequisit<a name="prereq"></a>

Start from a clean Raspbian stretch light installation, enable SSH and connect the device to the internet. This part is out of scope for this README, please refer to the Raspberry Pi website for more details. 

#### Install GIT

To clone this repo, you will need GIT. you can install it with the following command:

```shell
sudo apt-get update
sudo apt-get install git
```

#### Microphone setup

You will need a decent microphone for this. I am using the ReSpeeker Microphon Array with the firmware updated to it's latest version (the default firmware did not work out of the box), with pritty good results.  

First, we need to configure the microphone & speaker on your Raspberry Pi. To do so, create / edit the file `.asoundrc` in your home folder, and enter the following content:

```
pcm.!default {
  type asym
   playback.pcm {
     type plug
     slave.pcm "hw:0,0"
   }
   capture.pcm {
     type plug
     slave.pcm "hw:1,0"
   }
}
```

> This will use the USB microphone array as the default recording device, and the 3.5 jack output on the Raspberry Pi as the default audio output. If your setup is different from mine, you wight have to adjust those settings. If you are not sure about the audio devices available on your device, You can list them using the command `aplay -l`.

If your audio volume seems too low, then you probably need to adjust it. You can do this using the command `alsamixer`.

#### Install Docker

Simply run the following command to install Docker:

```shell
curl -fsSL get.docker.com -o get-docker.sh && sh get-docker.sh
```

Finally, add your user to the docker user group:

```shell
sudo usermod -aG docker pi
```

#### Install Docker Compose

For docker-compose, we will use `pip` to install it on our Raspberry Pi. Therefore we need to install it first, and then install docker-compose:

```shell
sudo apt-get -y install python-setuptools && sudo easy_install pip && sudo pip install docker-compose
```

### Install the Private Voice Assistant<a name="install_pva"></a>

Clone the repository to your Raspberry Pi:

```shell
git clone https://github.com/mdundek/private-voice-assistant.git
```
