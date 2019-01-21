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

app.all('/*', function(req, res, next) {
	console.log("app.all/: " + req.url + " ; systemCode: " + systemCode );
	next();
});

app.get('/'+systemCode+'/apri-sensor-service/testservice', function(req, res ) {
	console.log("ApriSensorService testservice: " + req.url );

	res.contentType('text/plain');
	var result = 'testrun OK';
 	res.send(result);

});

app.get('/arduinobin/', function(req, res) {
  var md5Sensor = req.get('x-esp8266-sketch-md5');
  var md5Bin = readMd5File(); //'93f764cb8dd72a2b43ad5927be7e8a1f';
  console.log(JSON.stringify(req.headers));
  console.log(req.headers['content-type']);
  console.log(req.get('host'));
  console.log(req.get('user-agent'));
  console.log(req.get('x-esp8266-sta-mac'));
  console.log(req.get('x-esp8266-ap-mac'));
  console.log(req.get('x-esp8266-sketch-size'));

  console.log(req.get('x-esp8266-free-space'));
  console.log(md5Sensor);
  console.log(req.get('x-esp8266-chip-size'));
  console.log(req.get('x-esp8266-sdk-version'));
  console.log(req.get('x-esp8266-mode'));

  if ( md5Sensor == md5Bin) {
    var status = 304; // not modified
    res.status(status);
  //  res.send(status);
  //  res.send('304 not modified');
  }



  //console.log("YUI request: " + req.url );

//  console.dir(req);
//  try {
    //var url = req.url.replace(/\.\./gi,'');
    //var url="apri-sensor-nodemcu-meteo.ino.nodemcu.bin";
//    var _jsFile=fs.readFileSync(systemFolderRoot + url);
var _jsFile = 'abcdefgh';
    //res.contentType('application/octet-stream',true);
    res.contentType('application/octet-stream',true);
    res.setHeader('Content-Disposition','attachment; filename=apri-sensor-nodemcu-meteo.ino.nodemcu.bin');
  //  res.setHeader('x-MD5','cfbc6bb28926ce99fb75c554d75f49cd');
    res.setHeader('x-MD5',md5Bin);

    //res.send(_jsFile);
    res.sendFile(arduinobinLocalPath+'apri-sensor-nodemcu-meteo.ino.nodemcu.bin');
//  }
//  catch(error) {
    //console.error(error);
//    console.error('image not found: '+ systemFolderRoot+req.url);
//    res.send('Image not found');
//  }

});

var readMd5File = function() {
	console.log("MD5 file: " + req.url );
	var _md5 = "";
	fs.readFile(arduinobinLocalPath, function(err, data){
		if (err) {
			console.log(err);
		}
		_md5 = data;
	})
  console.log(_md5);
	return _md5
};

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
