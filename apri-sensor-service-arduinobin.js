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
var express 							= require('express');
//var cookieParser 				= require('cookie-parser');
//var session 						= require('express-session');
//var uid 								= require('uid-safe');
////var bodyParser 				= require('connect-busboy');
var bodyParser 						= require('body-parser');
var fs 										= require('fs');

var readline 							= require('readline');

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
var md5Bin = "";

const rl = readline.createInterface({
  input: require('fs').createReadStream(arduinobinLocalPath+"arduinobin.md5")
});

rl.on('line', function (line) {
  console.log('Line from file:', line);
	md5Bin = line;
});



/*
var readMd5File = function(md5Bin) {
	var fileName = arduinobinLocalPath+"arduinobin.md5";
	console.log("MD5 file: " + fileName);
	var _md5Bin = md5Bin;
	fs.readFile(arduinobinLocalPath+"arduinobin.md5", function(err, data){
		if (err) {
			console.log(err);
		}
		_md5Bin = data;
		console.log(_md5Bin);
	})

	return;
};


//readMd5File(md5Bin); //'93f764cb8dd72a2b43ad5927be7e8a1f';

*/

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

app.get('/arduino-bin/test/', function(req, res) {
  var md5Sensor = req.get('x-esp8266-sketch-md5');
  console.log(md5Bin);
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

	console.log(md5Sensor);
	if ( md5Sensor == undefined) {
    var status = 401; // not modified
    res.status(status);
  //  res.send(status);
  //  res.send('304 not modified');
  }

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


app.get('/arduino-bin/', function(req, res) {
  var md5Sensor = req.get('x-esp8266-sketch-md5');
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

	console.log(md5Sensor);
	if ( md5Sensor == undefined) {
    var status = 401; // not modified
    res.status(status);
  //  res.send(status);
  //  res.send('304 not modified');
  }

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
