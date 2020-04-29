<p align="center">
  <a href="https://github.com/homebridge/homebridge"><img alt="Homebridge Plugin" src="https://github.com/homebridge/branding/blob/master/logos/homebridge-color-round.svg?sanitize=true" width="140px"></a>
</p>

# Homebridge Camera Swann

Enables Homebridge access to Swann NVR cameras via RTSP

This is a fork of the popular: [homebridge-camera-ffmpeg](https://github.com/KhaosT/homebridge-camera-ffmpeg)

## Installation

- Basic Installation
  - npm install -g homebridge-camera-swann

## Configuration

#### Config.json Example

```json
{
  "platform": "Camera-Swann",
  "cameras": [
    {
      "name": "Camera Name",
      "videoConfig": {
        "mainStream": "-rtsp_transport tcp -i rtsp://[USER]@[PASS]:[HOST]:[PORT]/ch0[x]/0",
        "subStream": "-rtsp_transport tcp -i rtsp://[USER]@[PASS]:[HOST]:[PORT]/ch0[x]/1",
        "maxStreams": 1,
        "bitrateThreshold": 299,
        "videoPacketSize": 1378,
        "audioPacketSize": 188,
        "mapvideo": "0:v",
        "mapaudio": "0:a",
        "audio": true,
        "debug": false
      }
    }
  ]
}
```
