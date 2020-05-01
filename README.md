<p align="center">
  <a href="https://github.com/homebridge/homebridge"><img src="https://raw.githubusercontent.com/homebridge/branding/master/logos/homebridge-color-round-stylized.png" height="140"></a>
</p>

# Homebridge Camera Swann

[![npm](https://badgen.net/npm/v/homebridge-camera-swann?cache=300)](https://www.npmjs.com/package/homebridge-camera-swann)
[![npm](https://badgen.net/npm/dt/homebridge-camera-swann?cache=300)](https://www.npmjs.com/package/homebridge-camera-swann)
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
    - Warning: This will install the latest cutting edge development version (may not work!).
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

## Why use this plugin?

#### Copy instead of Transcode

The main advantage of this plugin is that it uses `ffmpeg` to copy the H.264 stream, without the need to transcode it.

#### Bitrate Threshold

The second advantage of this plugin is the ability to set a `bitrateThreshold`. This bitrate threshold allows the plugin to select the `mainStream` or `subStream` based on the video bitrate requested by HomeKit.

Examples:

1. Scenario 1 (At home)
    * `bitrateThreshold=299`
    * iPhone is on local network, requests a stream with video bitrate of `299kbps`
    * Requested bitrate is `>= bitrateThreshold`
    * `Camera-Swann` selects Main Stream to restream over SRTP

2. Scenario 2 (Away from home)
    * `bitrateThreshold=299`
    * iPhone is on 4G, requests a stream with video bitrate of `132kbps`
    * Requested bitrate is `< bitrateThreshold`
    * `Camera-Swann` selects Sub Stream to restream over SRTP
