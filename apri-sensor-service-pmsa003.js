/*
** Module: apri-sensor-service-pmsa003.js
**   ApriSensorService server
**			inbox service for pmsa003 sensor data
**
**
*/

"use strict";

var service 		= 'apri-sensor-service-pmsa003';
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

var sensorServiceName = "pmsa003";

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

app.get('/'+sensorServiceName+'/testservice', function(req, res ) {
	console.log("ApriSensorService pmsa003 testservice: " + req.url );

	res.contentType('text/plain');
	var result = 'testservice active';
 	res.send(result);

});



app.all('/*', function(req, res, next) {
	console.log("app.all/: " + req.url + " ; systemCode: " + _systemCode );
	next();
});
/*
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


	res.send(JSON.stringify(controlData));
});
*/

app.get('/*', function(req, res) {
	console.log("Apri-Sensor-service pmsa003 request url error: " + req.url );
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
