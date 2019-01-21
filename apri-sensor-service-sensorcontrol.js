/*
** Module: apri-sensor-service-sensorcontrol.js
**   ApriSensorService server
**
**
**
*/

"use strict";

var service 		= 'apri-sensor-service-sensorcontrol';
	console.log("Path: " + service);
var modulePath = require('path').resolve(__dirname, '.');
	console.log("Modulepath: " + modulePath);
var apriSensorServiceConfig 		= require(modulePath + '/apri-sensor-service-config');
apriSensorServiceConfig.init(service);

var self = this;

// **********************************************************************************

// add module specific requires
//var request 					= require('request');
var express 						= require('express');
//var cookieParser 			= require('cookie-parser');
//var session 					= require('express-session');
//var uid 							= require('uid-safe');
////var bodyParser 			= require('connect-busboy');
var bodyParser 					= require('body-parser');
//var fs 								  = require('fs');

var _systemCode 					= apriSensorServiceConfig.getSystemCode();
var _systemFolderParent		= apriSensorServiceConfig.getSystemFolderParent();
var _systemFolder					= apriSensorServiceConfig.getSystemFolder();
var _systemListenPort			= apriSensorServiceConfig.getSystemListenPort();
var _systemParameter			= apriSensorServiceConfig.getConfigParameter();

var app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// **********************************************************************************

// todo: see messages in OGC 06-121r3 Table 8
var errorMessages = {
	  NOQUERY 			: { "message": 'Query parameters missing'		, "returnCode": 501 }
	, NOSERVICE 		: { "message": 'SERVICE parameter missing'		, "returnCode": 501 }
	, NOREQUEST 		: { "message": 'REQUEST parameter missing'		, "returnCode": 501 }
	, UNKNOWNREQ 		: { "message": 'REQUEST parameter unknown'		, "returnCode": 501 }
	, UNKNOWNIDENTIFIER : { "message": 'IDENTIFIER parameter unknown'	, "returnCode": 501 }
	, URLERROR 			: { "message": 'URL incorrect'					, "returnCode": 501 }
	, NOFOI 			: { "message": 'Feature of Interest missing'	, "returnCode": 501 }
	, NOMODEL 			: { "message": 'MODEL parameter missing'		, "returnCode": 501 }
}

app.all('/favicon.ico', function(req, res) {
	res.contentType('text/plain');
	res.send('');
});

app.get('/'+_systemCode+'/apri-sensor-service/testservice', function(req, res ) {
	console.log("ApriSensorService testservice: " + req.url );

	res.contentType('text/plain');
	var result = 'testrun started';
 	res.send(result);

});



app.all('/*', function(req, res, next) {
	console.log("app.all/: " + req.url + " ; systemCode: " + _systemCode );
	next();
});

app.get('/'+_systemCode+'/apri-sensor-service/v1/getCalModelData', function(req, res) {
	res.contentType('application/json');

	var params = {};
	var controlData = {};

	var sensorCtrlDate = '';

	var _query = req.query;
	if (_query == undefined) {
  	res.send(calModel);
		return;
	}

	params.foi = '';
	if (_query.sensorId != undefined) {
		params.foi = _query.sensorId;
	} else {
		params.foi = _query.foi;
	}

	params.ctrlDate = '';
	if (_query.date != undefined) {
		params.ctrlDate = _query.date;
	}
	console.log(params.foi);


	if (params.foi == 'SCNM5CCF7F2F65F1') {  //
		params.sensorCtrlDate = "2019-01-16T23:22:00Z";
		// send date only when equal to request. No refresh of data when equal.
		if (params.sensorCtrlDate == params.ctrlDate) {  // do nothing
			controlData = {};
			controlData.date = params.sensorCtrlDate;
		} else {
			console.log(params.ctrlDate);
			console.log(params.sensorCtrlDate);

			controlData = setDefaultControlData(controlData,params);

			// addition or overrule defaults
			controlData.res.otaInd 										= true;
//			controlData.bin.prot											= 'https';
//			controlData.bin.host											= 'aprisensor-bin.openiod.org';
//			controlData.bin.path											= '/arduino-bin/test/';
			controlData.bin.prot											= 'http';
			controlData.bin.host											= '37.97.135.211:5003';  //web
			controlData.bin.path											= '/arduino-bin/test/';
			controlData.res.rawInd										= false;    // PM raw values (6x)
			controlData.res.pmInd 										= true;     // PM values from sensor
			controlData.res.pmSecInd									= false;  // secundairy PM values
			controlData.res.pmCalInd									= false;  // calibrated PM values based on raw measurements
			controlData.res.pmCalPmInd								= false;  // calibrated PM values based on sensor PM values

		}
	}

	if (params.foi == 'SCNM2C3AE84FB02A' ) {  //
		params.sensorCtrlDate = "2019-01-21T11:34:00Z";
		// send date only when equal to request. No refresh of data when equal.
		if (params.sensorCtrlDate == params.ctrlDate) {  // do nothing
			controlData = {};
			controlData.date = params.sensorCtrlDate;
		} else {
			console.log(params.ctrlDate);
			console.log(params.sensorCtrlDate);

			controlData = setDefaultControlData(controlData,params);

			// addition or overrule defaults
			controlData.res.otaInd 										= true;
			controlData.bin.prot											= 'https';
			controlData.bin.host											= 'aprisensor-bin.openiod.org';
			controlData.bin.path											= '/arduino-bin/test/';
			controlData.res.rawInd										= false;    // PM raw values (6x)
			controlData.res.pmInd 										= true;     // PM values from sensor
			controlData.res.pmSecInd									= false;  // secundairy PM values
			controlData.res.pmCalInd									= false;  // calibrated PM values based on raw measurements
			controlData.res.pmCalPmInd								= false;  // calibrated PM values based on sensor PM values

		}
	}
	if (params.foi == 'SCNMA020A61B9EA5') {  // Aalten
		params.sensorCtrlDate = "2019-01-01T08:18:00Z";
		// send date only when equal to request. No refresh of data when equal.
		if (params.sensorCtrlDate == params.ctrlDate) { // do nothing
			controlData = {};
			controlData.date = params.sensorCtrlDate;
		} else {
			controlData = setDefaultControlData(controlData,params);
		}
	}

	if (controlData.date == undefined) {   // there is no controlData config for this sensor, send minimum functionality.
		controlData = {};
		controlData.date 													= params.ctrlDate;
		controlData.res 													= {};
		controlData.res.pmInd 										= true;     // only PM values from sensor
	}

	console.dir(controlData);

	res.send(JSON.stringify(controlData));
});

var initControlData = function(controlData) {
	var _controlData 				= controlData;
	_controlData.date 			= "1900-01-01T00:00:00+00:00";
	_controlData.bin				= {};
	_controlData.res 				= {};
	_controlData.cF 				= {};
	_controlData.cPm 				= {};
	_controlData.cPm.pm25		= {};
	_controlData.cPm.pm10 	= {};
	_controlData.cRaw				= {};
	_controlData.cRaw.pm25 	= {};
	_controlData.cRaw.pm10 	= {};
	return _controlData;
}
var setDefaultControlData = function(controlData,params) {
	var _controlData = controlData;
	_controlData = initControlData(_controlData);
	_controlData.date = params.sensorCtrlDate;
	_controlData.res.rawInd										= true;    // PM raw values (6x)
	_controlData.res.pmInd 										= true;     // PM values from sensor
	_controlData.res.pmSecInd									= true;  // secundairy PM values
	_controlData.res.pmCalInd									= true;  // calibrated PM values based on raw measurements
	_controlData.res.pmCalPmInd								= true;  // calibrated PM values based on sensor PM values
	_controlData.cF.pm1												= 1.0 ;
	_controlData.cF.pm25 											= 1.0 ;
	_controlData.cF.pm10 											= 1.0 ;
	_controlData.cF.raw0_3 										= 1.0 ;
	_controlData.cF.raw0_5 										= 1.0 ;
	_controlData.cF.raw1_0 										= 1.0 ;
	_controlData.cF.raw2_5 										= 1.0 ;
	_controlData.cF.raw5_0 										= 1.0 ;
	_controlData.cF.raw10_0										= 1.0 ;
	_controlData.cF.temp											= 1.0 ;
	_controlData.cF.rHum											= 1.0 ;
	_controlData.cPm.pm25.B0 									= 14.540174 ;
	_controlData.cPm.pm25.pm25		 						= 0.388 ;
	_controlData.cPm.pm25.temp								= -0.177 ;
	_controlData.cPm.pm25.rHum 								= -0.158 ;
	_controlData.cPm.pm10.B0 									= 7.231944 ;
	_controlData.cPm.pm10.pm10		 						= 0.349 ;
	_controlData.cPm.pm10.temp								= 0.437 ;
	_controlData.cPm.pm10.rHum 								= -0.04959 ;
	_controlData.cRaw.pm25.B0			 						= 10.745691 ;
	_controlData.cRaw.pm25.raw0_3 						= 0.172 ;
	_controlData.cRaw.pm25.raw0_5 						= -0.553 ;
	_controlData.cRaw.pm25.raw1_0 						= 0.08856 ;
	_controlData.cRaw.pm25.raw2_5 						= -0.0005707 ;
	_controlData.cRaw.pm25.raw5_0 						= 0.163 ;
	_controlData.cRaw.pm25.raw10_0						= 2.071 ;
	_controlData.cRaw.pm25.temp 							= -0.215 ;
	_controlData.cRaw.pm25.rHum 							= -0.165 ;
	_controlData.cRaw.pm10.B0			 						= 10.342340 ;
	_controlData.cRaw.pm10.raw0_3 						= 0.282 ;
	_controlData.cRaw.pm10.raw0_5 						= -0.907 ;
	_controlData.cRaw.pm10.raw1_0 						= 0.147 ;
	_controlData.cRaw.pm10.raw2_5 						= -0.649 ;
	_controlData.cRaw.pm10.raw5_0 						= 0.08193 ;
	_controlData.cRaw.pm10.raw10_0						= 11.600 ;
	_controlData.cRaw.pm10.temp 							= 0.115 ;
	_controlData.cRaw.pm10.rHum 							= -0.226 ;

	return _controlData;
}


app.get('/*', function(req, res) {
	console.log("Apri-Sensor-service request url error: " + req.url );
	var _message = errorMessages.URLERROR
	_message.message += " API error, wrong parameters?";
	//errorResult(res, _message);
	console.log('Error: %s - %s', _message.returnCode, _message.message );
	res.contentType('text/plain');
	res.send('');
	return;
});



var errorResult = function(res, message) {
	res.returncode = message.returnCode;
	res.contentType('text/plain');
	res.status(message.returnCode).send(message.message);
	console.log('Error: %s - %s', message.returnCode, message.message );
};


var startListen = function() {
	app.listen(_systemListenPort);
	console.log('listening to http://proxyintern: ' + _systemListenPort );
}


startListen();
