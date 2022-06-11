/*

Replaced by apri-sensor-service-sensormain.js !!!!



** Module: apri-sensor-service-solar.js
**   ApriSensorService server
**			inbox service for solar sensor data
**
**
*/

"use strict";

var log = function(message){
	console.log(new Date().toISOString()+' | '+message);
}
var logDir = function(object){
	console.log(object);
}

var service 		= 'apri-sensor-service-solar';
	log("Path: " + service);
var modulePath = require('path').resolve(__dirname, '.');
	log("Modulepath: " + modulePath);
var apriSensorServiceConfig 		= require(modulePath + '/apri-sensor-service-config');
apriSensorServiceConfig.init(service);

var self = this;

// **********************************************************************************

// add module specific requires
//var https 						= require('https');
var axios 							= require('axios');
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
var _serviceTarget				= apriSensorServiceConfig.getConfigServiceTarget();

var app = express();

var sensorServiceName = "solar";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// **********************************************************************************
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
	log("ApriSensorService solar testservice: " + req.url );
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
	log(_foi);
	logDir(_query);

	var dateReceived = new Date();
	var dateObserved;
	var offset;
	if (req.query.dateObserved) {
		dateObserved = new Date(req.query.dateObserved);
	} else {
		if (req.query.timeOffsetMillis) {
			offset = Number.parseInt(req.query.timeOffsetMillis);
			if (Number.isNaN(offset)) {
				offset = 0;
			}
			dateObserved = new Date(dateReceived.getTime()-offset);
		}	else {
			dateObserved = dateReceived;
		}
	}
	var fiwareObject = {};
	fiwareObject.id=_foi+"_"+dateObserved.toISOString();
	fiwareObject.sensorId=_foi;
	fiwareObject.type="AirQualityObserved";
	fiwareObject.dateReceived=dateReceived.toISOString();
	fiwareObject.dateObserved=dateObserved.toISOString();
	logDir(fiwareObject);

	var _inputObservation			= _query.observation;
	var _categories						= _inputObservation.split(',');

	var fiwareMap	= {};
	fiwareMap.unknown_obs 		= {};
	fiwareMap['irradiance']	= 'irradiance';
	fiwareMap['raw']	= 'raw';
	fiwareMap['amplified']	= 'amplified';
	fiwareMap['sensor']	= 'sensor';
	fiwareMap['offset']	= 'offset';
	fiwareMap['Vfactor']	= 'Vfactor';
	fiwareMap['s']	= 's';

	for (var i = 0;i<_categories.length;i++) {
		var _category				= _categories[i];
		var _categoryKeyValue		= _category.split(':');

		var _categoryId				= _categoryKeyValue[0];
		var _fiWareCategoryId	= _categoryKeyValue[0];
		var _categoryResult		= parseFloat(_categoryKeyValue[1]);

		// fiware attributes
		if (fiwareMap[_fiWareCategoryId]) {
			_fiWareCategoryId = fiwareMap[_fiWareCategoryId];
			fiwareObject[_fiWareCategoryId] = _categoryResult;
		} else {
			_fiWareCategoryId = _fiWareCategoryId;
			fiwareObject.unknown_obs[_fiWareCategoryId] = _categoryKeyValue[1];
		}
	}
	sendFiwareData(fiwareObject, _serviceTarget, res);
});

app.all('/*', function(req, res, next) {
	log("app.all/: " + req.url + " ; systemCode: " + _systemCode );
	next();
});

app.get('/*', function(req, res) {
	log("Apri-Sensor-service solar request url error: " + req.url );
	var _message = errorMessages.URLERROR
	_message.message += " API error, wrong parameters?";
	//errorResult(res, _message);
	log('Error: %s - %s', _message.returnCode, _message.message );
	res.contentType('text/plain');
	res.send('');
	return;
});

var sendFiwareData = function(data, target, res) {
	//var _data = JSON.stringify(data);
	var _data = data;
	var _res 	= res;
	var _target = target;

	var url = 'https://'+_target.host+':'+_target.port+_target.prefixPath+_target.path
	var headers = {
		//'Content-Type': 				'application/json',
		//'Content-Length': 			_data.length,
		'Fiware-Service': 			_target.FiwareService,
		'Fiware-ServicePath': 	_target.FiwareServicePath
	}

	var axiosParams = {
			url:url,
	    method: 'post',
	    data: _data,
	    config: { headers: headers}
	}
	console.log(axiosParams);
	axios.post(url, _data, { 'headers': headers})
	.then(function(response) {
\		logDir(response.status)
		var result = {}
		result.status = response.status,
		result.statusDesc = response.statusDesc
		result.statusData = response.data
		_res.contentType('application/json')
		_res.send(result);
	 })
	 .catch(function(error) {
		 var result = {};
		 if (error.response) {
			logDir(error.response.status)
			logDir(error.response.statusTekst)
			logDir(error.response.data)
			result.status = error.response.status
			result.statusDesc = error.response.statusDesc
			result.statusData = error.response.data
    } else if (error.request) {
			result.request = error.request;
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log('Error request: '+ error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error message', error.message);
			result.message = error.message;
    }

		_res.contentType('application/json');
		logDir(result)
		_res.send(result);
	 });
};


var errorResult = function(res, message) {
	res.returncode = message.returnCode;
	res.contentType('text/plain');
	res.status(message.returnCode).send(message.message);
	log('Error: %s - %s', message.returnCode, message.message );
};

var startListen = function() {
	app.listen(_systemListenPort);
	log('listening to http://proxyintern: ' + _systemListenPort );
}


startListen();
