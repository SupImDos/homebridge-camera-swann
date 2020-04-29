// Declare Variables
var Accessory, Service, Characteristic, hap, UUIDGen;

// Declare Requirements
var SwannCamera = require('./ffmpeg').SwannCamera;

// Declare Exports
module.exports = function(homebridge) {
  // Get Variables from HAP
  Accessory = homebridge.platformAccessory;
  hap = homebridge.hap;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  // Register Platform
  homebridge.registerPlatform("homebridge-camera-swann", "Camera-Swann", swannCameraPlatform, true);
}

// Swann Camera Platform
function swannCameraPlatform(log, config, api) {
  // Declare Self
  var self = this;

  // Logging and Config
  self.log = log;
  self.config = config || {};

  // Check API
  if (api) {
    self.api = api;

    if (api.version < 2.1) {
      throw new Error("Unexpected API version.");
    }

    // Finish Launching
    self.api.on('didFinishLaunching', self.didFinishLaunching.bind(this));
  }
}

// Configure Accessory
swannCameraPlatform.prototype.configureAccessory = function(accessory) {
  // Won't be invoked
}

// Finish Launching
swannCameraPlatform.prototype.didFinishLaunching = function() {
  // Declare Self, videoProcessor and interfaceName
  var self = this;
  var videoProcessor = self.config.videoProcessor || 'ffmpeg';
  var interfaceName = self.config.interfaceName || '';

  // Camera Configuration
  if (self.config.cameras) {
    // List of Configured Accessories
    var configuredAccessories = [];

    // Loop Through Cameras
    var cameras = self.config.cameras;
    cameras.forEach(function(cameraConfig) {
      // Camera Name and Video Config
      var cameraName = cameraConfig.name;
      var videoConfig = cameraConfig.videoConfig;

      // Check for Parameters
      if (!cameraName || !videoConfig) {
        self.log("Missing parameters.");
        return;
      }

      // Register Camera Accessory
      var uuid = UUIDGen.generate(cameraName);
      var cameraAccessory = new Accessory(cameraName, uuid, hap.Accessory.Categories.CAMERA);
      var cameraAccessoryInfo = cameraAccessory.getService(Service.AccessoryInformation);
      if (cameraConfig.manufacturer) {
        cameraAccessoryInfo.setCharacteristic(Characteristic.Manufacturer, cameraConfig.manufacturer);
      }
      if (cameraConfig.model) {
        cameraAccessoryInfo.setCharacteristic(Characteristic.Model, cameraConfig.model);
      }
      if (cameraConfig.serialNumber) {
        cameraAccessoryInfo.setCharacteristic(Characteristic.SerialNumber, cameraConfig.serialNumber);
      }
      if (cameraConfig.firmwareRevision) {
        cameraAccessoryInfo.setCharacteristic(Characteristic.FirmwareRevision, cameraConfig.firmwareRevision);
      }

      cameraAccessory.context.log = self.log;

      // Register Motion Sensor Switch if Required
      if (cameraConfig.motion) {
        var button = new Service.Switch(cameraName);
        cameraAccessory.addService(button);

        var motion = new Service.MotionSensor(cameraName);
        cameraAccessory.addService(motion);

        button.getCharacteristic(Characteristic.On)
          .on('set', _Motion.bind(cameraAccessory));
      }

      // Register Camera Source
      var cameraSource = new SwannCamera(hap, cameraConfig, self.log, videoProcessor, interfaceName);
      cameraAccessory.configureCameraSource(cameraSource);
      configuredAccessories.push(cameraAccessory);
    });

    // Publish Accessories
    self.api.publishCameraAccessories("Camera-Swann", configuredAccessories);
  }
};

// Motion Sensor
function _Motion(on, callback) {
  // Log Motion
  this.context.log("Setting %s Motion to %s", this.displayName, on);

  // Detect Motion
  this.getService(Service.MotionSensor).setCharacteristic(Characteristic.MotionDetected, (on ? 1 : 0));
  if (on) {
    setTimeout(_Reset.bind(this), 5000);
  }

  // Callback
  callback();
}

// Reset
function _Reset() {
  // Log Reset
  this.context.log("Setting %s Button to false", this.displayName);

  // Reset Switch
  this.getService(Service.Switch).setCharacteristic(Characteristic.On, false);
}
