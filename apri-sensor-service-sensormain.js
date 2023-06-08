/*
** Module: apri-sensor-service-sensormain.js
**   ApriSensorService sensormain
**			inbox service for sensortype depending on first parameter
**
**
*/

"use strict";

var argv = {}
argv.sensor = process.argv[2]; // bme280 or pmsa003 or etc.
if (!argv.sensor) {
	console.log('No sensor parameter given, job wil not process any data.');
}

var log = function (message) {
	console.log(new Date().toISOString() + ' | ' + message);
}
var logDir = function (object) {
	console.log(object);
}

var service = 'apri-sensor-service-' + argv.sensor;
log("Service: " + service);
var modulePath = require('path').resolve(__dirname, '.');
var configPath = require('path').resolve(__dirname, './apri-sensor-service-config');
log("Modulepath: " + modulePath);
log("Configpath: " + configPath);
var apriSensorServiceConfig = require(configPath);
apriSensorServiceConfig.init(service);

var self = this;

// **********************************************************************************

// add module specific requires
var axios = require('axios');
var express = require('express');
var bodyParser = require('body-parser');

var _systemCode = apriSensorServiceConfig.getSystemCode();
var _systemFolderParent = apriSensorServiceConfig.getSystemFolderParent();
var _systemFolder = apriSensorServiceConfig.getSystemFolder();
var _systemListenPort = apriSensorServiceConfig.getSystemListenPort();
var _systemParameter = apriSensorServiceConfig.getConfigParameter();
var _serviceTarget = apriSensorServiceConfig.getConfigServiceTarget();

var app = express();

var sensorServiceName = argv.sensor;

//var controlerPath = modulePath+'/apri-sensor-service-sensormain-controlers/apri-sensor-controler-'+sensorServiceName+'.js'
//var sensorControl = require(controlerPath)

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var projectTarget = {
	'SCRP000000008b6eb7a5': 'purm'
	,'SCRP000000009e652147':'sh'  // test CO2 sensor
	,'SCRP000000009730402a':'sh'  // Almere
	,'SCRP000000007d199115':'sh'  // Schoorl
	,'SCRP00000000afd8eca3':'sh'  // Aalten 
	,'SCRP000000000d1a69b1':'provgr' // Winschoten 2 provincie Groningen
	,'SCRP000000009d9bfc64':'provgr' // Winschoten 1 provincie Groningen
	,'SCRP00000000b90b0d72':'provdr' // Assen 1 provincie Drenthe 
	,'SCRP000000001695843b':'provdr' // Assen 2 provincie Drenthe 
	,'SCRP00000000ae100c03':'provdr' // Wilhelminaoord provincie Drenthe 
	,'SCRP00000000f2fe0eed':'provfr' // Leeuwarden provincie Friesland 
	,'SCRP00000000402f83a4':'provfr' // Rinsumageest provincie Friesland  
	,'SCRP00000000ff477352':'provfr' // Wijnjewoude provincie Friesland  
	//,'default':'2021'
}

// **********************************************************************************

// todo: see messages in OGC 06-121r3 Table 8
var errorMessages = {
	NOQUERY: { "message": 'Query parameters missing', "returnCode": 501 }
	, NOSERVICE: { "message": 'SERVICE parameter missing', "returnCode": 501 }
	, NOREQUEST: { "message": 'REQUEST parameter missing', "returnCode": 501 }
	, UNKNOWNREQ: { "message": 'REQUEST parameter unknown', "returnCode": 501 }
	, UNKNOWNIDENTIFIER: { "message": 'IDENTIFIER parameter unknown', "returnCode": 501 }
	, URLERROR: { "message": 'URL incorrect', "returnCode": 501 }
	, NOFOI: { "message": 'Feature of Interest missing', "returnCode": 501 }
	, NOMODEL: { "message": 'MODEL parameter missing', "returnCode": 501 }
}

app.get('/' + sensorServiceName + '/testservice', function (req, res) {
	log("ApriSensorService " + sensorServiceName + " testservice: " + req.url);
	res.contentType('text/plain');
	var result = 'testservice active';
	res.send(result);
});

app.all('/*', function (req, res, next) {
	console.log("app.all/: " + req.url + " ; systemCode: " + _systemCode);
	if (!argv.sensor) {
		console.log('No sensor parameter available for this service. This request will be ignored.')
		res.returncode = 503;
		res.contentType('text/plain');
		res.status(res.returncode).send('This service is not processing any sensordata.');
	} else {
		next();
	}
});

app.get('/' + sensorServiceName + '/v1/m', function (req, res) {
	res.contentType('application/json');
	var _query = req.query;
	if (_query == undefined) {
		errorResult(res, NOQUERY);
		return;
	}

	var _foi = '';
	if (req.query.sensorId != undefined) {
		_foi = req.query.sensorId;
	} else {
		_foi = req.query.foi;
	}
	//log(_foi);

	//logDir(_query);

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
			dateObserved = new Date(dateReceived.getTime() - offset);
		} else {
			dateObserved = dateReceived;
		}
	}
	var calType = 'N';
	if (req.query.calType) {
		if (req.query.calType == 'P') { // P = calibrate on PM base
			calType = 'P';
		}
		if (req.query.calType == 'R') { // R = calibrate on Raw base (particals for ds18b20)
			calType = 'R';
		}
	}
	var fiwareObject = {};
	fiwareObject.id = _foi + "_" + calType + "_" + dateObserved.toISOString();
	fiwareObject.sensorId = _foi;
	fiwareObject.subSystemId = '';
	if (sensorServiceName == 'pmsa003nm') fiwareObject.subSystemId = 'NM';
	if (projectTarget[_foi] != undefined) fiwareObject.projectTarget = '_' + projectTarget[_foi]
	else fiwareObject.projectTarget = ''
	fiwareObject.type = "AirQualityObserved";  // default
	fiwareObject.calType = calType;
	//fiwareObject.sensorSystem=query.sensorsystem;
	fiwareObject.dateReceived = dateReceived.toISOString();
	fiwareObject.dateObserved = dateObserved.toISOString();


	// add yearmonth to project/servicename
	if (_serviceTarget.FiwareService.substr(-5) == '_hour') {
		if (fiwareObject.dateObserved.substr(0, 10) < '2021-05-01') {
			//console.log(_serviceTarget.FiwareService)
		} else {
			//console.log(_serviceTarget.FiwareService + fiwareObject.projectTarget + '_' + fiwareObject.dateObserved.substr(0, 4) + fiwareObject.dateObserved.substr(5, 2))
			fiwareObject.projectTarget = fiwareObject.projectTarget + '_' +
				fiwareObject.dateObserved.substr(0, 4) + fiwareObject.dateObserved.substr(5, 2)
		}
	} else {
		fiwareObject.projectTarget = fiwareObject.projectTarget + '_' +
			fiwareObject.dateObserved.substr(0, 4) + fiwareObject.dateObserved.substr(5, 2)
	}

	//logDir(fiwareObject);

	var _inputObservation = _query.observation;
	var _categories = _inputObservation.split(',');

	var fiwareMap = {};
	//	fiwareMap.unknown_obs 		= {};
	if (sensorServiceName == 'bme280') {
		fiwareMap['pressure'] = 'pressure';
		fiwareMap['temperature'] = 'temperature';
		fiwareMap['rHum'] = 'rHum';
	}
	if (sensorServiceName == 'bme280_hour') {
		fiwareMap['pressure'] = 'pressure';
		fiwareMap['pressure_min'] = 'pressure_min';
		fiwareMap['pressure_max'] = 'pressure_max';
		fiwareMap['temperature'] = 'temperature';
		fiwareMap['temperature_min'] = 'temperature_min';
		fiwareMap['temperature_max'] = 'temperature_max';
		fiwareMap['rHum'] = 'rHum';
		fiwareMap['rHum_min'] = 'rHum_min';
		fiwareMap['rHum_max'] = 'rHum_max';
	}
	if (sensorServiceName == 'pmsa003') {
		fiwareMap['pm1'] = 'pm1';
		fiwareMap['pm25'] = 'pm25';
		fiwareMap['pm10'] = 'pm10';
		fiwareMap['pm1amb'] = 'pm1amb';
		fiwareMap['pm25amb'] = 'pm25amb';
		fiwareMap['pm10amb'] = 'pm10amb';
		fiwareMap['raw0_3'] = 'raw0_3';
		fiwareMap['raw0_5'] = 'raw0_5';
		fiwareMap['raw1_0'] = 'raw1_0';
		fiwareMap['raw2_5'] = 'raw2_5';
		fiwareMap['raw5_0'] = 'raw5_0';
		fiwareMap['raw10_0'] = 'raw10_0';
	}
	if (sensorServiceName == 'pmsa003_hour') {
		fiwareMap['count'] = 'count';
		fiwareMap['pm1'] = 'pm1';
		fiwareMap['pm1_min'] = 'pm1_min';
		fiwareMap['pm1_max'] = 'pm1_max';
		fiwareMap['pm25'] = 'pm25';
		fiwareMap['pm25_min'] = 'pm25_min';
		fiwareMap['pm25_max'] = 'pm25_max';
		fiwareMap['pm10'] = 'pm10';
		fiwareMap['pm10_min'] = 'pm10_min';
		fiwareMap['pm10_max'] = 'pm10_max';
		fiwareMap['pm1amb'] = 'pm1amb';
		fiwareMap['pm1amb_min'] = 'pm1amb_min';
		fiwareMap['pm1amb_max'] = 'pm1amb_max';
		fiwareMap['pm25amb'] = 'pm25amb';
		fiwareMap['pm25amb_min'] = 'pm25amb_min';
		fiwareMap['pm25amb_max'] = 'pm25amb_max';
		fiwareMap['pm10amb'] = 'pm10amb';
		fiwareMap['pm10amb_min'] = 'pm10amb_min';
		fiwareMap['pm10amb_max'] = 'pm10amb_max';
		fiwareMap['raw0_3'] = 'raw0_3';
		fiwareMap['raw0_3_min'] = 'raw0_3_min';
		fiwareMap['raw0_3_max'] = 'raw0_3_max';
		fiwareMap['raw0_5'] = 'raw0_5';
		fiwareMap['raw0_5_min'] = 'raw0_5_min';
		fiwareMap['raw0_5_max'] = 'raw0_5_max';
		fiwareMap['raw1_0'] = 'raw1_0';
		fiwareMap['raw1_0_min'] = 'raw1_0_min';
		fiwareMap['raw1_0_max'] = 'raw1_0_max';
		fiwareMap['raw2_5'] = 'raw2_5';
		fiwareMap['raw2_5_min'] = 'raw2_5_min';
		fiwareMap['raw2_5_max'] = 'raw2_5_max';
		fiwareMap['raw5_0'] = 'raw5_0';
		fiwareMap['raw5_0_min'] = 'raw5_0_min';
		fiwareMap['raw5_0_max'] = 'raw5_0_max';
		fiwareMap['raw10_0'] = 'raw10_0';
		fiwareMap['raw10_0_min'] = 'raw10_0_min';
		fiwareMap['raw10_0_max'] = 'raw10_0_max';
	}
	if (sensorServiceName == 'pmsa003_wsaqi') {
		fiwareMap['count'] = 'count';
		fiwareMap['wsaqi'] = 'wsaqi';
		fiwareMap['wsaqiMin'] = 'wsaqiMin';
		fiwareMap['wsaqiQ1'] = 'wsaqiQ1';
		fiwareMap['wsaqiMean'] = 'wsaqiMean';
		fiwareMap['wsaqiQ3'] = 'wsaqiQ3';
		fiwareMap['wsaqiMax'] = 'wsaqiMax';
		fiwareMap['wsaqiCountOutliersLow'] = 'wsaqiCountOutliersLow';
		fiwareMap['wsaqiCountOutliersHigh'] = 'wsaqiCountOutliersHigh';
		fiwareMap['wsaqiOutliersHighMin'] = 'wsaqiOutliersHighMin';
		fiwareMap['wsaqiOutliersHighMax'] = 'wsaqiOutliersHighMax';

	}
	if (sensorServiceName == 'ds18b20') {
		fiwareMap['temperature'] = 'temperature';
	}
	if (sensorServiceName == 'ds18b20_hour') {
		fiwareMap['temperature'] = 'temperature';
		fiwareMap['temperature_min'] = 'temperature_min';
		fiwareMap['temperature_max'] = 'temperature_max';
	}

	if (sensorServiceName == 'tgs5042') {
		fiwareMap['co'] = 'co';
		fiwareMap['CO'] = 'co';
	}
	if (sensorServiceName == 'tgs5042_hour') {
		fiwareMap['co'] = 'co';
		fiwareMap['co_min'] = 'co_min';
		fiwareMap['co_max'] = 'co_max';
	}
	//  if (fiwareObject.dateObserved>'2021-06-01' {
	if (sensorServiceName == 'bme680') {
		fiwareMap['pressure'] = 'pressure';
		fiwareMap['temperature'] = 'temperature';
		fiwareMap['rHum'] = 'rHum';
		fiwareMap['gasResistance'] = 'gasResistance';
	}
	if (sensorServiceName == 'bme680_hour') {
		fiwareMap['pressure'] = 'pressure';
		fiwareMap['pressure_min'] = 'pressure_min';
		fiwareMap['pressure_max'] = 'pressure_max';
		fiwareMap['temperature'] = 'temperature';
		fiwareMap['temperature_min'] = 'temperature_min';
		fiwareMap['temperature_max'] = 'temperature_max';
		fiwareMap['rHum'] = 'rHum';
		fiwareMap['rHum_min'] = 'rHum_min';
		fiwareMap['rHum_max'] = 'rHum_max';
		fiwareMap['gasResistance'] = 'gasResistance';
		fiwareMap['gasResistance_min'] = 'gasResistance_min';
		fiwareMap['gasResistance_max'] = 'gasResistance_max';
	}
	if (sensorServiceName == 'sps30') {
		fiwareMap['pm1'] = 'pm1';
		fiwareMap['pm25'] = 'pm25';
		fiwareMap['pm4'] = 'pm4';
		fiwareMap['pm10'] = 'pm10';
		fiwareMap['raw0_5'] = 'raw0_5';
		fiwareMap['raw1_0'] = 'raw1_0';
		fiwareMap['raw2_5'] = 'raw2_5';
		fiwareMap['raw4_0'] = 'raw4_0';
		fiwareMap['raw10_0'] = 'raw10_0';
		fiwareMap['tps'] = 'tps';
		fiwareMap['gpsMode'] = 'gpsMode';
		// not numeric fiwareMap['gpsTime']			= 'gpsTime';
		fiwareMap['gpsEpt'] = 'gpsEpt';
		fiwareMap['gpsLat'] = 'gpsLat';
		fiwareMap['gpsLon'] = 'gpsLon';
		fiwareMap['gpsAlt'] = 'gpsAlt';
		fiwareMap['gpsEpx'] = 'gpsEpx';
		fiwareMap['gpsEpy'] = 'gpsEpy';
		fiwareMap['gpsEpv'] = 'gpsEpv';
		fiwareMap['gpsTrack'] = 'gpsTrack';
		fiwareMap['gpsSpeed'] = 'gpsSpeed';
		fiwareMap['gpsClimb'] = 'gpsClimb';
		fiwareMap['gpsEps'] = 'gpsEps';
		fiwareMap['gpsEpc'] = 'gpsEpc';
	}
	if (sensorServiceName == 'sps30_hour') {
		fiwareMap['pm1'] = 'pm1';
		fiwareMap['pm1_min'] = 'pm1_min';
		fiwareMap['pm1_max'] = 'pm1_max';
		fiwareMap['pm25'] = 'pm25';
		fiwareMap['pm25_min'] = 'pm25_min';
		fiwareMap['pm25_max'] = 'pm25_max';
		fiwareMap['pm4'] = 'pm4';
		fiwareMap['pm4_min'] = 'pm4_min';
		fiwareMap['pm4_max'] = 'pm4_max';
		fiwareMap['pm10'] = 'pm10';
		fiwareMap['pm10_min'] = 'pm10_min';
		fiwareMap['pm10_max'] = 'pm10_max';
		fiwareMap['raw0_5'] = 'raw0_5';
		fiwareMap['raw0_5_min'] = 'raw0_5_min';
		fiwareMap['raw0_5_max'] = 'raw0_5_max';
		fiwareMap['raw1_0'] = 'raw1_0';
		fiwareMap['raw1_0_min'] = 'raw1_0_min';
		fiwareMap['raw1_0_max'] = 'raw1_0_max';
		fiwareMap['raw2_5'] = 'raw2_5';
		fiwareMap['raw2_5_min'] = 'raw2_5_min';
		fiwareMap['raw2_5_max'] = 'raw2_5_max';
		fiwareMap['raw4_0'] = 'raw4_0';
		fiwareMap['raw4_0_min'] = 'raw4_0_min';
		fiwareMap['raw4_0_max'] = 'raw4_0_max';
		fiwareMap['raw10_0'] = 'raw10_0';
		fiwareMap['raw10_0_min'] = 'raw10_0_min';
		fiwareMap['raw10_0_max'] = 'raw10_0_max';
		fiwareMap['tps'] = 'tps';
		fiwareMap['tps_min'] = 'tps_min';
		fiwareMap['tps_max'] = 'tps_max';
	}
	if (sensorServiceName == 'ips7100') {
		fiwareMap['pm01'] = 'pm01';
		fiwareMap['pm03'] = 'pm03';
		fiwareMap['pm05'] = 'pm05';
		fiwareMap['pm1'] = 'pm1';
		fiwareMap['pm25'] = 'pm25';
		fiwareMap['pm5'] = 'pm5';
		fiwareMap['pm10'] = 'pm10';
		fiwareMap['raw0_1'] = 'raw0_1';
		fiwareMap['raw0_3'] = 'raw0_3';
		fiwareMap['raw0_5'] = 'raw0_5';
		fiwareMap['raw1_0'] = 'raw1_0';
		fiwareMap['raw2_5'] = 'raw2_5';
		fiwareMap['raw5_0'] = 'raw5_0';
		fiwareMap['raw10_0'] = 'raw10_0';
	}
	if (sensorServiceName == 'ips7100_hour') {
		fiwareMap['pm01'] = 'pm01';
		fiwareMap['pm01_min'] = 'pm01_min';
		fiwareMap['pm01_max'] = 'pm01_max';
		fiwareMap['pm03'] = 'pm03';
		fiwareMap['pm03_min'] = 'pm03_min';
		fiwareMap['pm03_max'] = 'pm03_max';
		fiwareMap['pm05'] = 'pm05';
		fiwareMap['pm05_min'] = 'pm05_min';
		fiwareMap['pm05_max'] = 'pm05_max';
		fiwareMap['pm1'] = 'pm1';
		fiwareMap['pm1_min'] = 'pm1_min';
		fiwareMap['pm1_max'] = 'pm1_max';
		fiwareMap['pm25'] = 'pm25';
		fiwareMap['pm25_min'] = 'pm25_min';
		fiwareMap['pm25_max'] = 'pm25_max';
		fiwareMap['pm5'] = 'pm5';
		fiwareMap['pm5_min'] = 'pm5_min';
		fiwareMap['pm5_max'] = 'pm5_max';
		fiwareMap['pm10'] = 'pm10';
		fiwareMap['pm10_min'] = 'pm10_min';
		fiwareMap['pm10_max'] = 'pm10_max';
		fiwareMap['raw0_1'] = 'raw0_1';
		fiwareMap['raw0_1_min'] = 'raw0_1_min';
		fiwareMap['raw0_1_max'] = 'raw0_1_max';
		fiwareMap['raw0_3'] = 'raw0_3';
		fiwareMap['raw0_3_min'] = 'raw0_3_min';
		fiwareMap['raw0_3_max'] = 'raw0_3_max';
		fiwareMap['raw0_5'] = 'raw0_5';
		fiwareMap['raw0_5_min'] = 'raw0_5_min';
		fiwareMap['raw0_5_max'] = 'raw0_5_max';
		fiwareMap['raw1_0'] = 'raw1_0';
		fiwareMap['raw1_0_min'] = 'raw1_0_min';
		fiwareMap['raw1_0_max'] = 'raw1_0_max';
		fiwareMap['raw2_5'] = 'raw2_5';
		fiwareMap['raw2_5_min'] = 'raw2_5_min';
		fiwareMap['raw2_5_max'] = 'raw2_5_max';
		fiwareMap['raw5_0'] = 'raw5_0';
		fiwareMap['raw5_0_min'] = 'raw5_0_min';
		fiwareMap['raw5_0_max'] = 'raw5_0_max';
		fiwareMap['raw10_0'] = 'raw10_0';
		fiwareMap['raw10_0_min'] = 'raw10_0_min';
		fiwareMap['raw10_0_max'] = 'raw10_0_max';
	}
	if (sensorServiceName == 'scd30') {
		fiwareMap['temperature'] = 'temperature';
		fiwareMap['rHum'] = 'rHum';
		fiwareMap['co2'] = 'co2';
	}
	if (sensorServiceName == 'scd30_hour') {
		fiwareMap['temperature'] = 'temperature';
		fiwareMap['temperature_min'] = 'temperature_min';
		fiwareMap['temperature_max'] = 'temperature_max';
		fiwareMap['rHum'] = 'rHum';
		fiwareMap['rHum_min'] = 'rHum_min';
		fiwareMap['rHum_max'] = 'rHum_max';
		fiwareMap['co2'] = 'co2';
		fiwareMap['co2_min'] = 'co2_min';
		fiwareMap['co2_max'] = 'co2_max';
	}
	if (sensorServiceName == 'solar') {
		fiwareMap['irradiance'] = 'irradiance';
		fiwareMap['raw'] = 'raw';
		fiwareMap['amplified'] = 'amplified';
		fiwareMap['sensor'] = 'sensor';
		fiwareMap['offset'] = 'offset';
		fiwareMap['Vfactor'] = 'Vfactor';
		fiwareMap['s'] = 's';
	}
	if (sensorServiceName == 'solar_hour') {
		fiwareMap['irradiance'] = 'irradiance';
		fiwareMap['raw'] = 'raw';
		fiwareMap['amplified'] = 'amplified';
		fiwareMap['sensor'] = 'sensor';
		fiwareMap['offset'] = 'offset';
		fiwareMap['Vfactor'] = 'Vfactor';
		fiwareMap['s'] = 's';
		fiwareMap['irradiance'] = 'irradiance';
		fiwareMap['raw_min'] = 'raw_min';
		fiwareMap['amplified_min'] = 'amplified_min';
		fiwareMap['sensor_min'] = 'sensor_min';
		fiwareMap['offset_min'] = 'offset_min';
		fiwareMap['Vfactor_min'] = 'Vfactor_min';
		fiwareMap['s_min'] = 's_min';
		fiwareMap['irradiance_max'] = 'irradiance_max';
		fiwareMap['raw_max'] = 'raw_max';
		fiwareMap['amplified_max'] = 'amplified_max';
		fiwareMap['sensor_max'] = 'sensor_max';
		fiwareMap['offset_max'] = 'offset_max';
		fiwareMap['Vfactor_max'] = 'Vfactor_max';
		fiwareMap['s_max'] = 's_max';
	}
	if (sensorServiceName == 'bam1020') {
		fiwareMap['temperature'] = 'temperature';
		fiwareMap['rHum'] = 'rHum';
		fiwareMap['pm25'] = 'pm25';
	}
	if (sensorServiceName == 'bam1020_hour') {
		fiwareMap['temperature'] = 'temperature';
		fiwareMap['temperature_min'] = 'temperature_min';
		fiwareMap['temperature_max'] = 'temperature_max';
		fiwareMap['rHum'] = 'rHum';
		fiwareMap['rHum_min'] = 'rHum_min';
		fiwareMap['rHum_max'] = 'rHum_max';
		fiwareMap['pm25'] = 'pm25';
		fiwareMap['pm25_min'] = 'pm25_min';
		fiwareMap['pm25_max'] = 'pm25_max';
	}

	if (sensorServiceName == 'radiationd') {
		fiwareMap['rad'] = 'rad';
	}
	if (sensorServiceName == 'radiationd_hour') {
		fiwareMap['rad'] = 'rad';
		fiwareMap['rad_min'] = 'rad_min';
		fiwareMap['rad_max'] = 'rad_max';
	}
	if (sensorServiceName == 'pmsa003nm') {
		fiwareMap['pm25cal'] = 'pm25cal';
		fiwareMap['pm25'] = 'pm25';
		fiwareMap['temperature'] = 'temperature';
		fiwareMap['rHum'] = 'rHum';
		fiwareMap['pressure'] = 'pressure';
	}
	if (sensorServiceName == 'nextpm') {
		fiwareMap['part1'] = 'part1';
		fiwareMap['part25'] = 'part25';
		fiwareMap['part10'] = 'part10';
		fiwareMap['pm1'] = 'pm1';
		fiwareMap['pm25'] = 'pm25';
		fiwareMap['pm10'] = 'pm10';
	}
	//}

	for (var i = 0; i < _categories.length; i++) {
		var _category = _categories[i];
		//var _categoryKeyValue		= _category.split(':');

		//if (_categoryKeyValue.length>2) {
		var pos = _category.indexOf(':')
		var _categoryKey = _category.substr(0, pos)
		var _categoryValue = _category.substr(pos + 1)
		//console.log('Debug ######## ' + _categoryKey +' ' + _categoryValue)

		var _categoryId = _categoryKey
		var _fiWareCategoryId = _categoryKey
		var _categoryResult = parseFloat(_categoryValue);

		// fiware attributes
		if (fiwareMap[_fiWareCategoryId]) {
			_fiWareCategoryId = fiwareMap[_fiWareCategoryId];
			fiwareObject[_fiWareCategoryId] = _categoryResult;
		} else {
			//_fiWareCategoryId = _fiWareCategoryId;
			//fiwareObject.unknown_obs[_fiWareCategoryId] = _categoryKeyValue[1];
			fiwareObject[_fiWareCategoryId] = _categoryValue;
		}
	}
	sendFiwareData(fiwareObject, _serviceTarget, res);
});


app.all('/*', function (req, res, next) {
	log("app.all/: " + req.url + " ; systemCode: " + _systemCode);
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

app.get('/*', function (req, res) {
	log("Apri-Sensor-service " + sensorServiceName + " request url error: " + req.url);
	var _message = errorMessages.URLERROR
	_message.message += " API error, wrong parameters?";
	//errorResult(res, _message);
	log('Error: %s - %s', _message.returnCode, _message.message);
	res.contentType('text/plain');
	res.send('');
	return;
});

var sendFiwareData = function (data, target, res) {
	//var _data = JSON.stringify(data);
	var _data = data;
	var _res = res;
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
	
	  logDir(options);
	
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


	var url = 'https://' + _target.host + ':' + _target.port + _target.prefixPath + _target.path
	//	var headers = {
	//		//'Content-Type': 				'application/json',
	//		//'Content-Length': 			_data.length,
	//		'Fiware-Service': 			_target.FiwareService,
	//		'Fiware-ServicePath': 	_target.FiwareServicePath
	//	}
	var headers = {
		//'Content-Type': 				'application/json',
		//'Content-Length': 			_data.length,
		'Fiware-Service': _target.FiwareService + _data.subSystemId + _data.projectTarget,
		'Fiware-ServicePath': _target.FiwareServicePath
	}

	var axiosParams = {
		url: url,
		method: 'post',
		data: _data,
		config: { headers: headers }
	}
	//console.log(axiosParams);
	//	console.log(headers2);
	axios.post(url, _data, { 'headers': headers })
		.then(function (response) {
			//const jsonText = JSON.stringify(response);
			//const objResponse = JSON.parse(jsonText);
			//log('Response recieved');
			logDir(response.status)
			var result = {}
			result.status = response.status,
				result.statusDesc = response.statusDesc
			result.statusData = response.data
			_res.contentType('application/json')
			_res.send(result);
		})
		.catch(function (error) {
			var result = {};
			if (error.response) {
				// logDir(error.response);
				logDir(error.response.status)
				logDir(error.response.statusTekst)
				logDir(error.response.data)
				result.status = error.response.status
				result.statusDesc = error.response.statusDesc
				result.statusData = error.response.data
				// The request was made and the server responded with a status code
				// that falls out of the range of 2xx
				//      console.log(error.response.data);
				//      console.log(error.response.status);
				//      console.log(error.response.headers);
			} else if (error.request) {
				result.request = error.request;
				// The request was made but no response was received
				// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
				// http.ClientRequest in node.js
				console.log('Error request: ' + error.request);
			} else {
				// Something happened in setting up the request that triggered an Error
				console.log('Error message', error.message);
				result.message = error.message;
			}
			//    console.log(error.config);


			_res.contentType('application/json');
			logDir(result)
			_res.send(result);
			//			 'serviceStatus': error.response.status,
			//			 'serviceStatusTekst': error.response.statusTekst,
			//			 'serviceStatusData': error.response.data
			//	 	});
			//_res.send(JSON.stringfy(error));
		});
};


var errorResult = function (res, message) {
	res.returncode = message.returnCode;
	res.contentType('text/plain');
	res.status(message.returnCode).send(message.message);
	log('Error: %s - %s', message.returnCode, message.message);
};

var startListen = function () {
	app.listen(_systemListenPort);
	log('listening to http://proxyintern: ' + _systemListenPort);
}


startListen();
