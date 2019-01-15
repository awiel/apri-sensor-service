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
	var ctrlDate="";
	var controlData = {};
	var _query = req.query;
	if (_query == undefined) {
  	res.send(calModel);
		return;
	}

	var _foi = '';
	if (req.query.sensorId != undefined) {
		_foi = req.query.sensorId;
	} else {
		_foi = req.query.foi;
	}

	console.log(_foi);

	if (_foi == 'SCNMA020A61B9EA5') {  // Aalten
		ctrlDate = "2019-01-01T08:18:00Z";
		// send date only when equal to request. No refresh of data when equal.
		if (ctrlDate == req.query.date) {
			controlData = {};
			controlData.date = ctrlDate;
		} else {
			controlData = initControlData(controlData);
			controlData.date = ctrlDate;
			controlData.res.rawInd										= true;    // PM raw values (6x)
			controlData.res.pmInd 										= true;     // PM values from sensor
			controlData.res.pmSecInd									= true;  // secundairy PM values
			controlData.res.pmCalInd									= true;  // calibrated PM values based on raw measurements
			controlData.res.pmCalPmInd								= true;  // calibrated PM values based on sensor PM values
			controlData.cF.pm1												= 1.0 ;
			controlData.cF.pm25 											= 1.0 ;
			controlData.cF.pm10 											= 1.0 ;
			controlData.cF.raw0_3 										= 1.0 ;
			controlData.cF.raw0_5 										= 1.0 ;
			controlData.cF.raw1_0 										= 1.0 ;
			controlData.cF.raw2_5 										= 1.0 ;
			controlData.cF.raw5_0 										= 1.0 ;
			controlData.cF.raw10_0										= 1.0 ;
			controlData.cF.temp												= 1.0 ;
			controlData.cF.rHum												= 1.0 ;
			controlData.cPm.pm25.B0 									= 14.540174 ;
			controlData.cPm.pm25.pm25		 							= 0.388 ;
			controlData.cPm.pm25.temp									= -0.177 ;
			controlData.cPm.pm25.rHum 								= -0.158 ;
			controlData.cPm.pm10.B0 									= 7.231944 ;
			controlData.cPm.pm10.pm10		 							= 0.349 ;
			controlData.cPm.pm10.temp									= 0.437 ;
			controlData.cPm.pm10.rHum 								= -0.04959 ;
			controlData.cRaw.pm25.B0			 						= 10.745691 ;
			controlData.cRaw.pm25.raw0_3 							= 0.172 ;
			controlData.cRaw.pm25.raw0_5 							= -0.553 ;
			controlData.cRaw.pm25.raw1_0 							= 0.08856 ;
			controlData.cRaw.pm25.raw2_5 							= -0.0005707 ;
			controlData.cRaw.pm25.raw5_0 							= 0.163 ;
			controlData.cRaw.pm25.raw10_0							= 2.071 ;
			controlData.cRaw.pm25.temp 								= -0.215 ;
			controlData.cRaw.pm25.rHum 								= -0.165 ;
			controlData.cRaw.pm10.B0			 						= 10.342340 ;
			controlData.cRaw.pm10.raw0_3 							= 0.282 ;
			controlData.cRaw.pm10.raw0_5 							= -0.907 ;
			controlData.cRaw.pm10.raw1_0 							= 0.147 ;
			controlData.cRaw.pm10.raw2_5 							= -0.649 ;
			controlData.cRaw.pm10.raw5_0 							= 0.08193 ;
			controlData.cRaw.pm10.raw10_0							= 11.600 ;
			controlData.cRaw.pm10.temp 								= 0.115 ;
			controlData.cRaw.pm10.rHum 								= -0.226 ;
		}
	}
	if (_foi == 'SCNM5CCF7F2F65F1') {  //prototype AAlten
		ctrlDate = "2019-01-13T12:36:00Z";
		// send date only when equal to request. No refresh of data when equal.
		if (ctrlDate == req.query.date) {
			controlData = {};
			controlData.date = ctrlDate;
		} else {
			controlData = initControlData(controlData);
			controlData.date = ctrlDate;
			controlData.res.rawInd										= true;    // PM raw values (6x)
			controlData.res.pmInd 										= true;     // PM values from sensor
			controlData.res.pmSecInd									= true;  // secundairy PM values
			controlData.res.pmCalInd									= true;  // calibrated PM values based on raw measurements
			controlData.res.pmCalPmInd								= true;  // calibrated PM values based on sensor PM values
			controlData.cF.pm1												= 1.0 ;
			controlData.cF.pm25 											= 1.0 ;
			controlData.cF.pm10 											= 1.0 ;
			controlData.cF.raw0_3 										= 1.0 ;
			controlData.cF.raw0_5 										= 1.0 ;
			controlData.cF.raw1_0 										= 1.0 ;
			controlData.cF.raw2_5 										= 1.0 ;
			controlData.cF.raw5_0 										= 1.0 ;
			controlData.cF.raw10_0										= 1.0 ;
			controlData.cF.temp												= 1.0 ;
			controlData.cF.rHum												= 1.0 ;
			controlData.cPm.pm25.B0 									= 14.540174 ;
			controlData.cPm.pm25.pm25		 							= 0.388 ;
			controlData.cPm.pm25.temp									= -0.177 ;
			controlData.cPm.pm25.rHum 								= -0.158 ;
			controlData.cPm.pm10.B0 									= 7.231944 ;
			controlData.cPm.pm10.pm10		 							= 0.349 ;
			controlData.cPm.pm10.temp									= 0.437 ;
			controlData.cPm.pm10.rHum 								= -0.04959 ;
			controlData.cRaw.pm25.B0			 						= 10.745691 ;
			controlData.cRaw.pm25.raw0_3 							= 0.172 ;
			controlData.cRaw.pm25.raw0_5 							= -0.553 ;
			controlData.cRaw.pm25.raw1_0 							= 0.08856 ;
			controlData.cRaw.pm25.raw2_5 							= -0.0005707 ;
			controlData.cRaw.pm25.raw5_0 							= 0.163 ;
			controlData.cRaw.pm25.raw10_0							= 2.071 ;
			controlData.cRaw.pm25.temp 								= -0.215 ;
			controlData.cRaw.pm25.rHum 								= -0.165 ;
			controlData.cRaw.pm10.B0			 						= 10.342340 ;
			controlData.cRaw.pm10.raw0_3 							= 0.282 ;
			controlData.cRaw.pm10.raw0_5 							= -0.907 ;
			controlData.cRaw.pm10.raw1_0 							= 0.147 ;
			controlData.cRaw.pm10.raw2_5 							= -0.649 ;
			controlData.cRaw.pm10.raw5_0 							= 0.08193 ;
			controlData.cRaw.pm10.raw10_0							= 11.600 ;
			controlData.cRaw.pm10.temp 								= 0.115 ;
			controlData.cRaw.pm10.rHum 								= -0.226 ;
		}
	}
	res.send(JSON.stringify(controlData));
});

var initControlData = function(controlData) {
	var _controlData 				= controlData;
	_controlData.date 			= "1900-01-01T00:00:00+00:00";
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
