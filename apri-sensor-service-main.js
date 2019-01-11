/*
** Module: apri-sensor-service-main.js
**   ApriSensorService server
**
**
**
*/

"use strict";

var service 		= 'apri-sensor-service-main';
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
	res.send('');
});

app.get('/'+_systemCode+'/apri-sensor-service/testservice', function(req, res ) {
	console.log("ApriSensorService testservice: " + req.url );

	res.contentType('text/html');
	var htmlFile = 'testrun started';
 	res.send(htmlFile);

});



app.all('/*', function(req, res, next) {
	console.log("app.all/: " + req.url + " ; systemCode: " + _systemCode );
	next();
});

app.get('/'+_systemCode+'/apri-sensor-service/v1/getfingerprint', function(req, res) {
	res.contentType('text/html');
	//var fingerprint = 'D5:D3:B2:5E:5D:9D:68:43:FE:02:0C:84:1C:C7:CC:7D:6C:F5:B9:12';  // 2017
	var fingerprint = '82:B3:C5:2E:84:78:29:44:EB:D6:14:49:12:23:AC:8F:6D:9A:75:BD';  // 2018
	res.send(fingerprint);
});

app.get('/'+_systemCode+'/apri-sensor-service/v1/getparameters', function(req, res) {
	var _query = req.query;

	if (_query == null) {
  		errorResult(res, errorMessages.NOQUERY);
		return;
	}

// http://localhost:5001/SCAPE604/apri-sensor-service/v1
//  /getfingerprint
//  /getparameters?foi=SCNMDC4F22113934&version=0.11

	if (_query.foi == null || _query.version == null ) {
		errorResult(res, errorMessages.NOQUERY);
		return;
	}

	console.log("ApriSensorService request parameters: %s", req.url );
	console.log("ApriSensorService request parameters: %s %s",_query.foi, _query.version);
	res.returncode = 200;
	res.contentType('text/plain');
	res.status(res.returncode).send('To do');

});


app.get('/*', function(req, res) {
	console.log("Apri-Sensor-service request url error: " + req.url );
	var _message = errorMessages.URLERROR
	_message.message += " API error, wrong parameters?";
	errorResult(res, _message);
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
