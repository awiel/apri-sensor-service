/*
** Module: apri-sensor-service-arduinobin.js
**   ApriSensorService server
**
**
**
*/

"use strict";

var service 		= 'apri-sensor-service-arduinobin';
	console.log("Path: " + service);
var modulePath = require('path').resolve(__dirname, '.');
	console.log("Modulepath: " + modulePath);
var apriSensorServiceConfig 		= require(modulePath + '/apri-sensor-service-config');
apriSensorServiceConfig.init(service);

var self = this;

// **********************************************************************************

// add module specific requires
//var request 						= require('request');
var express 							= require('express');
//var cookieParser 				= require('cookie-parser');
//var session 						= require('express-session');
//var uid 								= require('uid-safe');
////var bodyParser 				= require('connect-busboy');
var bodyParser 						= require('body-parser');
var fs 										= require('fs');

var systemCode 						= apriSensorServiceConfig.getSystemCode();
var systemFolderParent		= apriSensorServiceConfig.getSystemFolderParent();
var systemFolder					= apriSensorServiceConfig.getSystemFolder();
var systemListenPort			= apriSensorServiceConfig.getSystemListenPort();
var systemParameter				= apriSensorServiceConfig.getConfigParameter();

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

var arduinobinLocalPath = systemFolderParent +'/arduinobin/';
console.log (arduinobinLocalPath);

app.all('/favicon.ico', function(req, res) {
	res.contentType('text/plain');
	res.send('');
});

app.get('/'+systemCode+'/apri-sensor-service/testservice', function(req, res ) {
	console.log("ApriSensorService testservice: " + req.url );

	res.contentType('text/plain');
	var result = 'testrun started';
 	res.send(result);

});



app.all('/*', function(req, res, next) {
	console.log("app.all/: " + req.url + " ; systemCode: " + systemCode );
	next();
});

app.get('/'+systemCode+'/apri-sensor-service/v1/getCalModelData', function(req, res) {
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



	if (params.foi == 'SCNM2C3AE84FB02A') {  //
		params.sensorCtrlDate = "2019-01-16T23:22:00Z";
		// send date only when equal to request. No refresh of data when equal.
		if (params.sensorCtrlDate == params.ctrlDate) {  // do nothing
			controlData = {};
			controlData.date = params.sensorCtrlDate;
		} else {
			console.log(params.ctrlDate);
			console.log(params.sensorCtrlDate);

			controlData = setDefaultControlData(controlData,params);
			controlData.res.otaInd 										= true;
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
	if (params.foi == 'SCNM5CCF7F2F65F1') {  //prototype AAlten
		params.sensorCtrlDate = "2019-01-13T12:36:00Z";
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
	app.listen(systemListenPort);
	console.log('listening to http://proxyintern: ' + systemListenPort );
}

startListen();
