<p align="center">
  <a href="https://github.com/homebridge/homebridge"><img alt="Homebridge Plugin" src="https://github.com/homebridge/branding/blob/master/logos/homebridge-color-round.svg?sanitize=true" width="140px"></a>
</p>

# Homebridge Camera Swann

[![npm](https://badgen.net/npm/v/homebridge-camera-swann)](https://www.npmjs.com/package/homebridge-camera-swann)
[![npm](https://badgen.net/npm/dt/homebridge-camera-swann)](https://www.npmjs.com/package/homebridge-camera-swann)
[![isc license](https://badgen.net/badge/license/ISC/red)](https://github.com/SupImDos/homebridge-camera-swann/blob/master/LICENSE)

Enables Homebridge access to Swann NVR cameras via RTSP

This is a fork of the popular: [homebridge-camera-ffmpeg](https://github.com/KhaosT/homebridge-camera-ffmpeg)

## Installation

- Install via Homebridge Web UI 
  - Search for `Camera Swann` on the plugin screen of [config-ui-x](https://github.com/oznu/homebridge-config-ui-x) .
  - Click install.

- Basic Installation
  - Install this plugin using: `npm install -g homebridge-camera-swann`
  - Edit `config.json` and add the camera.
  - Run Homebridge
  - Add extra camera accessories in Home app. The setup code is the same as homebridge.

- Advanced Installation
  - Warning: This will install the latest cutting edge develeopment version (may not work!).
  - Install: `npm install -g --save https://github.com/SupImDos/homebridge-camera-swann/tarball/master`
  - Edit `config.json` and add the camera.
  - Run Homebridge
  - Add extra camera accessories in Home app. The setup code is the same as homebridge.

## Configuration

#### Config.json Example

```json
{
    "platform": "Camera-Swann",
    "cameras": [
        {
            "name": "Camera Name",
            "manufacturer": "Camera Brand",
            "model": "Camera Model",
            "serialNumber": "Camera Serial",
            "firmwareRevision": "Camera Firmware Version",
            "videoConfig": {
                "mainStream": "-rtsp_transport tcp -i rtsp://[USER]:[PASS]@[HOST]:[PORT]/ch0[X]/0",
                "subStream": "-rtsp_transport tcp -i rtsp://[USER]:[PASS]@[HOST]:[PORT]/ch0[X]/1",
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

#### Swann NVR/DVR Configuration Example

Main Stream
<p align="center">
  <img src="https://user-images.githubusercontent.com/62866982/80780499-bcb20400-8ba1-11ea-8097-ab7dfb5d2873.png">
</p>

Sub Stream
<p align="center">
  <img src="https://user-images.githubusercontent.com/62866982/80780501-bf145e00-8ba1-11ea-9974-f49867df7f6b.png">
</p>

## Explanation

TODO
