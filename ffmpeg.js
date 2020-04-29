'use strict';
// Declare Variables
var uuid, Service, Characteristic, StreamController;

// Declare Requirements
var crypto = require('crypto');
var ip = require('ip');
var spawn = require('child_process').spawn;

// Declare Exports
module.exports = {
  FFMPEG: FFMPEG
};

// FFMPEG Function
function FFMPEG(hap, cameraConfig, log, videoProcessor, interfaceName) {
  // Get Variables from HAP
  uuid = hap.uuid;
  Service = hap.Service;
  Characteristic = hap.Characteristic;
  StreamController = hap.StreamController;
  this.log = log;

  // Get Configuration Options
  var ffmpegOpt = cameraConfig.videoConfig;

  // Parse Configuration Options
  this.name = cameraConfig.name;
  this.videoProcessor = videoProcessor || 'ffmpeg';
  this.interfaceName = interfaceName;
  this.audio = ffmpegOpt.audio;
  this.videoPacketSize = ffmpegOpt.videoPacketSize
  this.audioPacketSize = ffmpegOpt.audioPacketSize
  this.debug = ffmpegOpt.debug;
  this.mapvideo = ffmpegOpt.mapvideo || "0:0";
  this.mapaudio = ffmpegOpt.mapaudio || "0:1";

  // Check for MainStream and SubStream
  if (!ffmpegOpt.mainStream || !ffmpegOpt.subStream) {
    throw new Error("Missing main stream and substream for camera.");
  }

  // Get MainStream and SubStream
  this.ffmpegMainStream = ffmpegOpt.mainStream;
  this.ffmpegSubStream = ffmpegOpt.subStream;

  // Services and StreamControllers
  this.services = [];
  this.streamControllers = [];

  // Sessions
  this.pendingSessions = {};
  this.ongoingSessions = {};

  // Number of Streams
  var numberOfStreams = ffmpegOpt.maxStreams || 1;

  // Homekit Options
  let options = {
    proxy: false, // Requires RTP/RTCP MUX Proxy
    srtp: true, // Supports SRTP AES_CM_128_HMAC_SHA1_80 encryption
    video: {
      resolutions: videoResolutions,
      codec: {
        profiles: [0, 1, 2], // Enum, please refer StreamController.VideoCodecParamProfileIDTypes
        levels: [0, 1, 2] // Enum, please refer StreamController.VideoCodecParamLevelTypes
      }
    },
    audio: {
      codecs: [
        {
          type: "OPUS", // Audio Codec
          samplerate: 24 // 8, 16, 24 KHz
        },
        {
          type: "AAC-eld",
          samplerate: 16
        }
      ]
    }
  }

  // Create Homebridge Service and Controllers
  this.createCameraControlService();
  this._createStreamControllers(numberOfStreams, options);
}

// Handle Connnection Close
FFMPEG.prototype.handleCloseConnection = function(connectionID) {
  this.streamControllers.forEach(function(controller) {
    controller.handleCloseConnection(connectionID);
  });
}

// Handle Snapshot Request
FFMPEG.prototype.handleSnapshotRequest = function(request, callback) {
  // Get Request Data
  var width = request.width;
  var height = request.height;
  var resolution = width + ':' + height;

  // Grab Image
  let ffmpeg = spawn(this.videoProcessor, (this.ffmpegMainStream + ' -t 1 -vf scale=' + resolution + ' -f image2 -').split(' '), {env: process.env});
  var imageBuffer = Buffer.alloc(0);

  // Log Info
  this.log("Snapshot from: " + this.name + " @ " + resolution);

  // Log Debug Info
  if(this.debug) console.log('ffmpeg '+ this.ffmpegMainStream + ' -t 1 -vf scale='+ resolution + ' -f image2 -');

  // Grab Image
  ffmpeg.stdout.on('data', function(data) {
    imageBuffer = Buffer.concat([imageBuffer, data]);
  });

  // Callbacks
  let self = this;

  ffmpeg.on('error', function(error){
    self.log("An error occurs while making snapshot request");
    self.debug ? self.log(error) : null;
  });

  ffmpeg.on('close', function(code) {
    callback(undefined, imageBuffer);
  }.bind(this));
}

// Prepare Stream
FFMPEG.prototype.prepareStream = function(request, callback) {
  // Declare sessionInfo
  var sessionInfo = {};

  // Session ID and Target IP Address
  let sessionID = request["sessionID"];
  let targetAddress = request["targetAddress"];

  // Record in Response
  sessionInfo["address"] = targetAddress;

  // Declare Response
  var response = {};

  // Video Request
  let videoInfo = request["video"];
  if (videoInfo) {
    // SRTP Configuration
    let targetPort = videoInfo["port"];
    let srtp_key = videoInfo["srtp_key"];
    let srtp_salt = videoInfo["srtp_salt"];

    // SSRC is a 32 bit integer that is unique per stream
    let ssrcSource = crypto.randomBytes(4);
    ssrcSource[0] = 0;
    let ssrc = ssrcSource.readInt32BE(0, true);

    // Video Response
    let videoResp = {
      port: targetPort,
      ssrc: ssrc,
      srtp_key: srtp_key,
      srtp_salt: srtp_salt
    };

    // Record in Response
    response["video"] = videoResp;

    // Record in Response
    sessionInfo["video_port"] = targetPort;
    sessionInfo["video_srtp"] = Buffer.concat([srtp_key, srtp_salt]);
    sessionInfo["video_ssrc"] = ssrc;
  }

  // Audio Request
  let audioInfo = request["audio"];
  if (audioInfo) {
    // SRTP Configuration
    let targetPort = audioInfo["port"];
    let srtp_key = audioInfo["srtp_key"];
    let srtp_salt = audioInfo["srtp_salt"];

    // SSRC is a 32 bit integer that is unique per stream
    let ssrcSource = crypto.randomBytes(4);
    ssrcSource[0] = 0;
    let ssrc = ssrcSource.readInt32BE(0, true);

    // Audio Response
    let audioResp = {
      port: targetPort,
      ssrc: ssrc,
      srtp_key: srtp_key,
      srtp_salt: srtp_salt
    };

    // Record in Response
    response["audio"] = audioResp;

    // Record in Response
    sessionInfo["audio_port"] = targetPort;
    sessionInfo["audio_srtp"] = Buffer.concat([srtp_key, srtp_salt]);
    sessionInfo["audio_ssrc"] = ssrc;
  }

  // Get Current IP Address
  let currentAddress = ip.address(this.interfaceName);

  // Record in Response
  var addressResp = {
    address: currentAddress
  };

  // Record IP Type in Response
  if (ip.isV4Format(currentAddress)) {
    addressResp["type"] = "v4";
  } else {
    addressResp["type"] = "v6";
  }

  // Record in Response
  response["address"] = addressResp;

  // Record Session
  this.pendingSessions[uuid.unparse(sessionID)] = sessionInfo;

  // Callback
  callback(response);
}

// Handle Stream Request
FFMPEG.prototype.handleStreamRequest = function(request) {
  // Get Session ID and Request Type
  var sessionID = request["sessionID"];
  var requestType = request["type"];

  // Handle Request
  if (sessionID) {
    // Session Identifier
    let sessionIdentifier = uuid.unparse(sessionID);

    // Start Stream
    if (requestType == "start") {
      // Record in Pending Sessions
      var sessionInfo = this.pendingSessions[sessionIdentifier];
      if (sessionInfo) {
        // Get Configuration
        var source = this.ffmpegMainStream;
        var abitrate = 24;
        var asamplerate = 16;
        var vcodec = 'copy';
        var acodec = 'libfdk_aac';
        var videoPacketSize = this.videoPacketSize || 1378;
        var audioPacketSize = this.audioPacketSize || 188;
        var mapvideo = this.mapvideo;
        var mapaudio = this.mapaudio;

        // Switch for MainStream and Substream
        let videoInfo = request["video"];
        if (videoInfo) {
          if(videoInfo["max_bit_rate"] < 300) {
            source = this.ffmpegSubStream;
          }
        }

        // SRTP Configuration
        let targetAddress = sessionInfo["address"];
        let targetVideoPort = sessionInfo["video_port"];
        let videoKey = sessionInfo["video_srtp"];
        let videoSsrc = sessionInfo["video_ssrc"];
        let targetAudioPort = sessionInfo["audio_port"];
        let audioKey = sessionInfo["audio_srtp"];
        let audioSsrc = sessionInfo["audio_ssrc"];

        // ffmpeg Command
        let fcmd = this.ffmpegSource;

        // Video Args
        let ffmpegVideoArgs = ' -map ' + mapvideo +
          ' -vcodec ' + vcodec +
          ' -an' +
          ' -f rawvideo' +
          ' -payload_type 99';

          // Video Stream Args
        let ffmpegVideoStream = ' -ssrc ' + videoSsrc +
          ' -f rtp' +
          ' -srtp_out_suite AES_CM_128_HMAC_SHA1_80' +
          ' -srtp_out_params ' + videoKey.toString('base64') +
          ' srtp://' + targetAddress + ':' + targetVideoPort +
          '?rtcpport=' + targetVideoPort +
          '&localrtcpport=' + targetVideoPort +
          '&pkt_size=' + videoPacketSize;

        // Build Command
        fcmd += ffmpegVideoArgs;
        fcmd += ffmpegVideoStream;

        // Options Audio Args
        if(this.audio) {
          // Audio Args
          let ffmpegAudioArgs = ' -map ' + mapaudio +
              ' -acodec ' + acodec +
              ' -profile:a aac_eld' +
              ' -flags +global_header' +
              ' -ar ' + asamplerate + 'k' +
              ' -b:a ' + abitrate + 'k' +
              ' -payload_type 110';

          // Audio Stream Args
          let ffmpegAudioStream = ' -ssrc ' + audioSsrc +
              ' -f rtp' +
              ' -srtp_out_suite AES_CM_128_HMAC_SHA1_80' +
              ' -srtp_out_params ' + audioKey.toString('base64') +
              ' srtp://' + targetAddress + ':' + targetAudioPort +
              '?rtcpport=' + targetAudioPort +
              '&localrtcpport=' + targetAudioPort +
              '&pkt_size=' + audioPacketSize;

          // Build Command
          fcmd += ffmpegAudioArgs;
          fcmd += ffmpegAudioStream;
        }

        // Debug Logging Switch
        if (this.debug) {
          fcmd += ' -loglevel debug';
        }

        // Start the process
        let ffmpeg = spawn(this.videoProcessor, fcmd.split(' '), {env: process.env});
        this.log("Start streaming video from " + this.name);
        if(this.debug){
          console.log("ffmpeg " + fcmd);
        }

        // Always setup hook on stderr.
        // Without this streaming stops within one to two minutes.
        ffmpeg.stderr.on('data', function(data) {
          // Do not log to the console if debugging is turned off
          if(this.debug){
            console.log(data.toString());
          }
        }.bind(this));

        // Callbacks
        let self = this;
        ffmpeg.on('error', function(error){
            self.log("An error occurs while making stream request");
            self.debug ? self.log(error) : null;
        });

        ffmpeg.on('close', (code) => {
          if(code == null || code == 0 || code == 255){
            self.log("Stopped streaming");
          } else {
            self.log("ERROR: FFmpeg exited with code " + code);
            for(var i=0; i < self.streamControllers.length; i++){
              var controller = self.streamControllers[i];
              if(controller.sessionIdentifier === sessionID){
                controller.forceStop();
              }
            }
          }
        });
        this.ongoingSessions[sessionIdentifier] = ffmpeg;
      }

      // Remove from Pending Sessions
      delete this.pendingSessions[sessionIdentifier];

    // Stop Request
    } else if (requestType == "stop") {
      var ffmpegProcess = this.ongoingSessions[sessionIdentifier];
      if (ffmpegProcess) {
        ffmpegProcess.kill('SIGTERM');
      }
      // Remove from Ongoing Sessions
      delete this.ongoingSessions[sessionIdentifier];
    }
  }
}

// Create Camera Control Service
FFMPEG.prototype.createCameraControlService = function() {
  var controlService = new Service.CameraControl();

  this.services.push(controlService);

  if(this.audio){
    var microphoneService = new Service.Microphone();
    this.services.push(microphoneService);
  }
}

// Private
FFMPEG.prototype._createStreamControllers = function(maxStreams, options) {
  let self = this;

  for (var i = 0; i < maxStreams; i++) {
    var streamController = new StreamController(i, options, self);

    self.services.push(streamController.service);
    self.streamControllers.push(streamController);
  }
}
