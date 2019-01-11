
/**
 * The apri-sensor-service-config module for init and config node-apri system
 * @module apri-sensor-service-config
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

	var fs 		= require('fs'),
		path 	  = require('path'),
		os 		  = require('os');

	var mainSystemCode,
		parameter,
		request,
		systemBaseCode,
		systemCode,
		systemConfigLocalPath,
		systemConfigStr,
		systemConfig,
		systemContext,
		systemFolder,
		systemFolderParent,
		systemHostName,
		systemServiceName,
		systemName,
		systemListenPort,
		systemServiceType,
		systemStart,
		systemVersion,
		systemVersionL1,
		systemVersionL2,
		systemVersionL3;

module.exports = {

	init: function (name) {
		var _service;

		systemStart 				  = new Date();

		systemHostName				= os.hostname();
		systemFolder 				  = __dirname;
		systemFolderParent		= path.resolve(__dirname, '..');

		systemServiceName 		= name;
		systemBaseCode 				= path.basename(systemFolderParent);

		systemConfigLocalPath 		= systemFolderParent +'/config/';
		systemConfigStr 			= fs.readFileSync(systemConfigLocalPath + "apri-sensor-service-system.json");
		systemConfig 				  = JSON.parse(systemConfigStr);

		// IMPORTANT: SYSTEM CONFIGURATION VALUES !!!
		systemName 					  = systemConfig.system.systemName;
		systemCode 					  = systemConfig.system.systemCode;
		mainSystemCode 				= systemConfig.system.systemCode;
		systemListenPort 			= systemConfig.system.systemListenPort;
		systemVersionL1 			= systemConfig.system.version.l1;
		systemVersionL2 			= systemConfig.system.version.l2;
		systemVersionL3 			= systemConfig.system.version.l3;
		systemVersion 				= systemVersionL1 + '.' + systemVersionL2 + '.' + systemVersionL3;
		systemServiceType 		= systemConfig.system.serviceType;

		// context(s) for token
		systemContext				  = systemConfig.context;

		// Parameters
		parameter					    = systemConfig.parameter;

		// service overrules default config
		if (systemConfig.service) {
			for (var i=0;i<systemConfig.service.length;i++) {
				_service = systemConfig.service[i];
				if (_service.serviceName == systemServiceName)  {
					if (_service.systemCode) {
						systemCode = _service.systemCode;
					}
					if (_service.systemListenPort) {
						systemListenPort = _service.systemListenPort;
					}
					break;
				}
			}
		}

		console.log('\n=================================================================');
		console.log();
		console.log('Start systemname         :', systemName);
		console.log(' Systemmaincode / subcode:', mainSystemCode, systemCode );
		console.log(' Systemversion           :', systemVersion);
		console.log(' Systemhost              :', systemHostName);
		console.log(' System folder           :', systemFolder);
		console.log(' System folder parent    :', systemFolderParent);
		console.log(' System config folder    :', systemConfigLocalPath);
		console.log(' System servicename      :', systemServiceName);
		console.log(' Servicetype             :', systemServiceType);
		console.log(' Listening port          :', systemListenPort);
		console.log(' System start            :', systemStart.toISOString());
		console.log('=================================================================\n');

		if (mainSystemCode != systemBaseCode) {
			console.log('ERROR: SYSTEMCODE OF CONFIG FILE NOT EQUAL TO SYSTEM BASECODE (', systemCode, 'vs', systemBaseCode, ')');
			return false;
		}
		return true;

	},  // end of init

	getSystemCode: function () {
		return systemCode;
	},

	getSystemFolderParent: function () {
		return systemFolderParent;
	},

	getSystemFolder: function () {
		return systemFolder;
	},

	getSystemListenPort: function () {
		return systemListenPort;
	},

	getConfigParameter: function () {
		return parameter;
	},

	getConfigLocalPath: function () {
		return systemConfigLocalPath;
	}


} // end of module.exports
