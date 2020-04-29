<p align="center">
  <a href="https://github.com/homebridge/verified/blob/master/verified-plugins.json"><img alt="homebridge-verified" src="https://github.com/homebridge/branding/blob/master/logos/homebridge-color-round.svg?sanitize=true" width="140px"></a>
</p>

# Homebridge Camera Swann

Enables Homebridge access to Swann NVR cameras via RTSP

## Installation

- Basic Installation
  - TODO

## Configuration

#### Config.json Example

```json
{
  "platform": "Camera-swann",
  "cameras": [
    {
      "name": "Camera Name",
      "videoConfig": {
        "mainStream": "-rtsp_transport tcp -i rtsp://[HOST]:[PORT]/CH0x/0",
        "subStream": "-rtsp_transport tcp -i rtsp://[HOST]:[PORT]/CH0x/1",
        "maxStreams": 1,
        "audio": true
      }
    }
  ]
}
```
