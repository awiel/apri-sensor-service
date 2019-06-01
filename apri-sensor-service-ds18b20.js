/*
** Module: apri-sensor-service-ds18b20.js
**   ApriSensorService server
**			inbox service for ds18b20 sensor data
**
**
*/

"use strict";

var log = function(message){
	console.log(new Date().toISOString()+' | '+message);
}
var logdir = function(object){
	console.log(object);
}

var service 		= 'apri-sensor-service-ds18b20';
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

var sensorServiceName = "ds18b20";

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
	log("ApriSensorService ds18b20 testservice: " + req.url );

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

	logdir(_query);

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
	var calType = 'N';
	if (req.query.calType) {
		if (req.query.calType=='P') { // P = calibrate on PM base
			calType = 'P';
		}
		if (req.query.calType=='R') { // R = calibrate on Raw base (particals for ds18b20)
			calType = 'R';
		}
	}
	var fiwareObject = {};
	fiwareObject.id=_foi+"_"+calType+"_"+dateObserved.toISOString();
	fiwareObject.sensorId=_foi;
	fiwareObject.type="AirQualityObserved";
	fiwareObject.calType=calType;
	//fiwareObject.sensorSystem=query.sensorsystem;
	fiwareObject.dateReceived=dateReceived.toISOString();
	fiwareObject.dateObserved=dateObserved.toISOString();

	logdir(fiwareObject);

	var _inputObservation			= _query.observation;
	var _categories						= _inputObservation.split(',');

	var fiwareMap	= {};
	fiwareMap.unknown_obs 		= {};
	fiwareMap['temperature']	= 'temperature';

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

	log(_foi);


	res.send(JSON.stringify(controlData));
});
*/

app.get('/*', function(req, res) {
	log("Apri-Sensor-service ds18b20 request url error: " + req.url );
	var _message = errorMessages.URLERROR
	_message.message += " API error, wrong parameters?";
	//errorResult(res, _message);
	log('Error: %s - %s', _message.returnCode, _message.message );
	res.contentType('text/plain');
	res.send('');
	return;
});

var sendFiwareData = function(data, target, res) {
	var _data = JSON.stringify(data);
	var _res 	= res;
	var _target = target;
//	var _url 	= _target.protocol +
//			_target.host +
//			_target.prefixPath'; //openiodUrl;

	//log(data);
//	var json_obj = JSON.stringify(data);
//	log(_url);
	//log(json_obj)
/*
	var options = {
		hostname: _target.host,
		port: 		_target.port,
		path: 		_target.prefixPath+_target.path,
		method: 	_target.method,
		headers: {
				 'Content-Type': 				'application/json',
				 'Content-Length': 			_data.length,
				 'Fiware-Service': 			_target.FiwareService,
				 'Fiware-ServicePath': 	_target.FiwareServicePath
			 }
	};

  logdir(options);

	var result = {}
	//console.log(options);
	//console.log(_data);
	var req = https.request(options, (res) => {
		log('statusCode:' + res.statusCode);
		//console.log('headers:', res.headers);
		var result = {
			statusCode: res.statusCode
		}
		_res.send('{"statusCode":"'+res.statusCode+'",""}');

		res.on('data', (d) => {

			process.stdout.write(d);
			log(d);
		});
	});

	req.on('error', (e) => {
		console.error(e);
	});

	req.write(_data);
	req.end();

*/


	var url = 'https://'+_target.host+':'+_target.port+'/'+_target.prefixPath+_target.path
	var headers = {
		'Content-Type': 				'application/json',
		'Content-Length': 			_data.length,
		'Fiware-Service': 			_target.FiwareService,
		'Fiware-ServicePath': 	_target.FiwareServicePath
	}

	var axiosParams = {
			url:url,
	    method: 'post',
	    data: bodyFormData,
	    config: { headers: headers}
	}
	console.log(axiosParams);
	axios(axiosParams)
	.then(response => {
		//log('Response recieved');
		logDir(response)
		//_res.send('{"statusCode":"'+res.statusCode+'",""}');
		_res.send(response);
	 })
	 .catch(error => {
		 log('Error config code: '+ error.code);
		 _res.send(error);
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
