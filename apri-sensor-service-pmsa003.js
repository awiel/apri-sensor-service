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
var request 						= require('request');
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

app.get('/'+sensorServiceName+'/v1/m', function(req, res) {
	res.contentType('application/json');
	var _query = req.query;
	if (_query == undefined) {
		errorResult(res,NOQUERY);
		return;
	}

	var _foi = '';
	if (req.query.sensorId != undefined) {
		_foi = req.query.sensorId;
	} else {
		_foi = req.query.foi;
	}
	console.log(_foi);

	console.log(_query);

	var dateRecieved = new Date();
	var fiwareObject = {};
	fiwareObject.id=_foi+"_"+dateRecieved;
	fiwareObject.sensorId=_foi;
	fiwareObject.type="AirQualityObserved";
	//fiwareObject.sensorSystem=query.sensorsystem;
	fiwareObject.dateRecieved=dateRecieved;
	//			fiwareObject.relativeHumidity=inRecord.s_humidity/1000;
	//			fiwareObject.temperature	= milliKelvinToCelsius(inRecord.s_temperatureambient);
	//			fiwareObject.CO2=inRecord.s_co2/1000;
	//			fiwareObject.lightTop=inRecord.s_lightsensortop;
	//			fiwareObject.pressure=inRecord.s_barometer/100;

	console.log(fiwareObject);

	var _inputObservation					= _query.observation;
	var _categories							= _inputObservation.split(',');

	var fiwareMap	= {};
	fiwareMap['apri-sensor-pmsa003-concPM10_0_CF1']	= 'pm10';
	fiwareMap['apri-sensor-pmsa003-concPM2_5_CF1']	= 'pm25';
	fiwareMap['apri-sensor-pmsa003-concPM1_0_CF1']	= 'pm1';
	fiwareMap['apri-sensor-pmsa003-concPM10_0_amb']	= 'pm10amb';
	fiwareMap['apri-sensor-pmsa003-concPM2_5_amb']	= 'pm25amb';
	fiwareMap['apri-sensor-pmsa003-concPM1_0_amb']	= 'pm1amb';
	fiwareMap['apri-sensor-pmsa003-rawGt0_3um']	= 'raw03um';
	fiwareMap['apri-sensor-pmsa003-rawGt0_5um']	= 'raw05um';
	fiwareMap['apri-sensor-pmsa003-rawGt1_0um']	= 'raw1um';
	fiwareMap['apri-sensor-pmsa003-rawGt2_5um']	= 'raw25um';
	fiwareMap['apri-sensor-pmsa003-rawGt5_0um']	= 'raw5um';
	fiwareMap['apri-sensor-pmsa003-rawGt10_0um']	= 'raw10um';



	for (var i = 0;i<_categories.length;i++) {
		var _category				= _categories[i];
		var _categoryKeyValue		= _category.split(':');

		var _categoryId				= _categoryKeyValue[0];
		var _fiWareCategoryId	= _categoryKeyValue[0];
		var _categoryResult			= parseFloat(_categoryKeyValue[1]);

		// fiware attributes
		if (fiwareMap[_fiWareCategoryId]) {
			_fiWareCategoryId = fiwareMap[_fiWareCategoryId];
		}
		fiwareObject[_fiWareCategoryId] = _categoryResult;

		sendFiwareData(fiwareObject);


	}
	res.send('OK');
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

var sendFiwareData = function(data) {
	var _url = 'https://orion.openiod.nl/v2/entities?options=keyValues'; //openiodUrl;

	//console.log(data);
	var json_obj = JSON.stringify(data);
	//console.log(_url);
	//console.log(json_obj)

	request.post({
			headers: {'content-type': 'application/json'},
			url: _url,
			body: json_obj, //form: json_obj
		}, function(error, response, body){
			if (error) {
				console.log(error);
			}
			//console.log(body);
		}
	);
};


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
