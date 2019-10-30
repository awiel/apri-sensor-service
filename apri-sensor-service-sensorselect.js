/*
** Module: apri-sensor-service-sensorselect.js
**   ApriSensorService server
**
**
**
*/
// test:
// http://localhost:5050/apri-sensor-service/v1/getSelectionData/?fiwareService=aprisensor_in&fiwareServicePath=/pmsa003&foiOps=SCNM5CCF7F2F62F3:SCNM5CCF7F2F62F3_alias,pm25:pm25_alias&dateFrom=2019-03-03T22:55:55.000Z&dateTo=2019-03-04T22:55:55.999Z
"use strict";

var moduleName 		= 'apri-sensor-service-sensorselect';
	//log("Path: " + service);
var modulePath = require('path').resolve(__dirname, '.');
	//log("Modulepath: " + modulePath);
var apriSensorServiceConfig 		= require(modulePath + '/apri-sensor-service-config');
apriSensorServiceConfig.init(service);

var self = this;

// **********************************************************************************

// add module specific requires
//var request 					= require('request');
//const https							= require('https');
var axios 							= require('axios');
var express 						= require('express');
//var cookieParser 			= require('cookie-parser');
//var session 					= require('express-session');
//var uid 							= require('uid-safe');
////var bodyParser 			= require('connect-busboy');
var bodyParser 					= require('body-parser');
//var fs 								  = require('fs');
const winston = require('winston')


var _systemCode 					= apriSensorServiceConfig.getSystemCode();
var _systemFolderParent		= apriSensorServiceConfig.getSystemFolderParent();
var _systemFolder					= apriSensorServiceConfig.getSystemFolder();
var _systemListenPort			= apriSensorServiceConfig.getSystemListenPort();
var _systemParameter			= apriSensorServiceConfig.getConfigParameter();
var _serviceTarget				= apriSensorServiceConfig.getConfigServiceTarget();
var _serviceTarget2				= apriSensorServiceConfig.getConfigServiceTarget2();

//winston.log('info', 'Hello log files!', {
//  someKey: 'some-value'
//})
var winstonLogFileName = process.env.LOG_FILE
if (winstonLogFileName==undefined) {
	winstonLogFileName = _systemFolder + '/../log/'+moduleName+'_'+ _systemListenPort + '.log'
}
console.log(winstonLogFileName)
winston.add(new winston.transports.File({ filename: winstonLogFileName }))
winston.level = process.env.LOG_LEVEL

if (winston.level==undefined) winston.level='info'
var log = function(message){
	winston.log('info', new Date().toISOString()+' | '+message, {});
}
var logDir = function(object){
	winston.log('info',object,{});
}
log(winston.level)



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
	, NOSELECTIONID	: { "message": 'Selection ID missing'	, "returnCode": 501 }
	, NOFOIOPS 			: { "message": 'Observable properties missing'		, "returnCode": 501 }
}



app.all('/favicon.ico', function(req, res) {
	res.contentType('text/plain');
	res.send('');
});

app.get('/'+_systemCode+'/apri-sensor-service/testservice', function(req, res ) {
	log("ApriSensorService testservice: " + req.url );

	res.contentType('text/plain');
	var result = 'testrun started';
 	res.send(result);

});



app.all('/*', function(req, res, next) {
	log("app.all/: " + req.url + " ; systemCode: " + _systemCode );
	next();
});

app.get('/apri-sensor-service/v1/getSelectionData', function(req, res) {
	log('/apri-sensor-service/v1/getSelectionData');
	res.contentType('application/json');

	var params = {};
	var selection = {};
	var selectionData = {};

	var sensorCtrlDate = '';

	var _query = req.query;
	if (_query == undefined) {
  	res.status(errorMessages.NOQUERY.returnCode).send(errorMessages.NOQUERY.message);
		return;
	}

/*
	params.selectionId = '';
	if (_query.selectionId != undefined) {
		params.selectionId = _query.selectionId;
	} else {
		res.status(errorMessages.NOSELECTIONID.returnCode).send(errorMessages.NOSELECTIONID.message);
		return;
	}
*/
	params.opPerRow = 'true';  // defaults to true, for every observable property one output record. when false one record for all observable properties
	if (_query.opPerRow == 'false') {
		params.opPerRow = 'false';
	}
	params.key = 'sensorId';  // defaults to sensorId as key attribute
	if (_query.key != undefined) {
		params.key = _query.key;
	}
	params.foiOps = '';
	if (_query.foiOps != undefined) {
		params.foiOps = _query.foiOps;
	} else {
		res.status(errorMessages.NOFOIOPS.returnCode).send(errorMessages.NOFOIOPS.message);
		return;
	}
	params.fiwareService = '';
	if (_query.fiwareService != undefined) {
		params.fiwareService = _query.fiwareService;
	}
	params.fiwareServicePath = '';
	if (_query.fiwareServicePath != undefined) {
		params.fiwareServicePath = _query.fiwareServicePath;
	}

	params.format = '';
	if (_query.format != undefined) {
		params.format = _query.format;
	}

	var foiOps 							= params.foiOps;
	var tmpFoiOpsMembers 		= foiOps.split(',');
	var tmpFoiIds 					= tmpFoiOpsMembers[0].split(':');
	selection.foiId 				= tmpFoiIds[0];
	if (tmpFoiIds.length>1) {
		selection.foiIdAlias = tmpFoiIds[1];
	} else selection.foiIdAlias 		= tmpFoiIds[0];

	selection.ops = [];
	for (var j=1;j<tmpFoiOpsMembers.length;j++) {
		var tmpFoiOpsMember = tmpFoiOpsMembers[j].split(':');
		var _op = {};
		_op.opId 						= tmpFoiOpsMember[0];
		_op.opIdAlias 			= tmpFoiOpsMember[0];
		if (tmpFoiOpsMember.length==2) {
			_op.opIdAlias	= tmpFoiOpsMember[1];  // set alias equal to Id when not included
		}
		selection.ops.push(_op);
	}

	params.dateFrom = '';
	if (_query.dateFrom != undefined) {
		if (_query.dateFrom.substr(19,1)==' ') {   //1899-12-31T00:00:00 00:00  -> 1899-12-31T00:00:00+00:00
			params.dateFrom 			= _query.dateFrom.substr(0,19) + '+' + _query.dateFrom.substr(20);
		} else params.dateFrom	= _query.dateFrom;
	} else {
		var dateFromDate 				= new Date(new Date().getTime()-(24*60*60*1000));
		params.dateFrom					= dateFromDate.toISOString();
	}
	params.dateTo = '';
	if (_query.dateTo != undefined) {
		if (_query.dateTo.substr(19,1)==' ') {   //1899-12-31T00:00:00 00:00  -> 1899-12-31T00:00:00+00:00
			params.dateTo = _query.dateTo.substr(0,19) + '+' + _query.dateTo.substr(20);
		} else params.dateTo = _query.dateTo;
	} else {
		var dateToDate 					= new Date(new Date().getTime());
		params.dateTo						= dateToDate.toISOString();
	}

	params.aggregate = 'false';
	params.dateOrPeriod = 'dateObserved';
	if (_query.aggregate != undefined && _query.aggregate=='true') {
		params.aggregate = _query.aggregate;
		params.dateOrPeriod = 'period';
		log('Aggregate: '+params.aggregate);
	}

	params.selection = selection;

	if (selection.foiId) {
		if (params.format=='' || params.format == 'csv') {
			//start stream for response
			res.writeHead(200, {
		    'Content-Type': 'text/plain',
		    'Transfer-Encoding': 'chunked'
		  });

			// csv header
			if (params.opPerRow == 'false') {

				var dateOrPeriod =
				res.write(params.key+';'+params.dateOrPeriod+';count');
				for (var j=0;j<params.selection.ops.length;j++) {
					var opRow = params.selection.ops[j];
					res.write(';'+opRow.opIdAlias);
				}
				res.write('\n');
			} else {
				res.write(params.key+';'+params.dateOrPeriod+';count;sensorType;sensorValue\n');
			}
		}
		retrieveData(params, res);
	} else {
		res.send('[])'); // nothing asked, empty array returned.
	}

});

var initSelectionData = function(selectionData) {
	var _selectionData 				= selectionData;
	return _selectionData;
}

var retrieveData 	= function(params, res) {
	var thisParams	= params;
	var thisRes 		= res;

//	thisParams.foiIdsIndex++;  // next foi, first time will be index zero
//	if (thisParams.foiIdsIndex<thisParams.foiIds.length) {
	var contextBrokerPromise = new Promise(
		// The resolver function is called with the ability to resolve or
		// reject the promise
		function(resolve, reject) {
			log('Start of callCB promise ' + thisParams.selection.foiId);
			var callCNPromise = new Promise(
				function(resolve, reject) {
					var urlParamsAttrs = "&attrs=";
					var seperator = '';
					log('foi alias: ' + thisParams.selection.foiIdAlias);
					for (var i=0;i<thisParams.selection.ops.length;i++) {
						urlParamsAttrs=urlParamsAttrs+seperator+thisParams.selection.ops[i].opId;
						seperator = ',';
					}
					//console.dir(thisParams.selection);
					var options = {};
					options.key							= thisParams.key;
					options.foiId						= thisParams.selection.foiId;
					options.foiIdAlias			= thisParams.selection.foiIdAlias;
					options.ops							= thisParams.selection.ops;
					options.urlParamsAttrs 	= urlParamsAttrs;
					options.format 					= thisParams.format;
					options.limit						= 1000;
					options.dateFrom 				= thisParams.dateFrom;
					options.dateFromDate		= new Date(options.dateFrom);
					options.dateTo 					= thisParams.dateTo;
					options.dateToDate			= new Date(options.dateTo);
					options.aggregate				= thisParams.aggregate;
					options.fiwareService 	= thisParams.fiwareService;
					options.fiwareServicePath = thisParams.fiwareServicePath;
					options.protocol				= _serviceTarget.protocol;
					options.host 						= _serviceTarget.host;
					options.port						= _serviceTarget.port;
					options.prefixPath			= _serviceTarget.prefixPath;
					options.protocol2				= _serviceTarget2.protocol;
					options.host2 					= _serviceTarget2.host;
					options.port2						= _serviceTarget2.port;
					options.prefixPath2			= _serviceTarget2.prefixPath;
					options.opPerRow				= thisParams.opPerRow;
					res.axiosResults = [];
					callAxios(options,res)
				}
			)
			callCNPromise.then(
				function() {
					log('End of callCB promise ' + thisParams.selection.foiId );
					resolve();
				}
			);
		}
	);  //end of promise
	// We define what to do when the promise is fulfilled
	contextBrokerPromise.then(
		function() {
			//retrieveData(thisParams, thisRes)	// Just log the message and a value
			thisRes.end();
			log('End of retrieveData promise '+thisParams.selection.foiId);
		}
	);

}

var callAxios = function(options,res) {
	var _options 	= options;
	var _res			= res;
	var urlParams					= _options.urlParamsAttrs+","+options.key+",dateObserved";
	urlParams							= urlParams+"&limit="+_options.limit+"&q="+options.key+"=='"+_options.foiId+"'";
	urlParams							= urlParams + ";dateObserved=='"+_options.dateFrom+"'..'"+_options.dateTo+"'";

	var url = '';
	if (options.aggregate=='true') {
		url = _options.protocol2+'://'+ _options.host2 +':'+_options.port2+ _options.prefixPath2 + urlParams+ '&aggregate=true';
	} else {
		url = _options.protocol+'://'+ _options.host +':'+_options.port+ _options.prefixPath + urlParams;
	}
	log(url);
	var headers = {
		 "Fiware-Service": _options.fiwareService?_options.fiwareService:_serviceTarget.FiwareService
			, "Fiware-ServicePath": _options.fiwareServicePath?_options.fiwareServicePath:_serviceTarget.FiwareServicePath
	};
//	console.dir(headers);

	axios.get(url,{ headers: headers })
	.then(response => {
		log("Records: "+response.data.length);
		if (options.format == 'json') {
		} else { // csv output
			var rec = '';
			for (var i=0;i<response.data.length;i++) {
				rec = response.data[i];
				console.dir(rec);
				var _dateOrPeriod = rec.dateObserved?rec.dateObserved:rec._id.period; // period in case of aggregation;
				var csvrec = '"'+_options.foiIdAlias+'";"'+_dateOrPeriod+'";'+rec.count;
				if (_options.opPerRow=='true') {
					for (var j=0;j<_options.ops.length;j++) {
						var op = _options.ops[j];
						//console.log('y'+rec[op.opId]+'x');
						//console.dir(rec[op.opId]);
						if (rec[op.opId]!=undefined) {
							if(rec[op.opId]!= 'NA' & rec[op.opId].value!= 'NA') {
								var _value = rec[op.opId];
								if (_value.value) {
									_value = _value.value;
								}
								res.write(csvrec+';'+op.opIdAlias+';'+_value+'\n');
							}
						}
					}
				} else {
					var valuesInd = false;
					for (var j=0;j<_options.ops.length;j++) {
						var opRow = _options.ops[j];
						if (rec[opRow.opId]!=undefined ) {
							if(rec[opRow.opId]!= 'NA' & rec[opRow.opId].value!= 'NA' ) {
								valuesInd = true;
								var _value = rec[opRow.opId];
								if (_value.value) {
									_value = _value.value;
								}
								csvrec=csvrec+';'+_value;
							} else {
								csvrec=csvrec+';'+'NA';
							}
						} else {
							csvrec=csvrec+';'+'NA';
						}
					}
					if (valuesInd) {
						res.write(csvrec+'\n');
					}
				}
				//_res.write(JSON.stringify(response.data[i]));
	//			_res.write('"'+rec.pm25+'";'+'"'+rec.pm25+'";'+));
			}
		}

		// more after limit?
		if (options.format == 'json') {
			res.contentType('application/json');
			res.send(response.data);
		} else {
			if ( response.data.length>0 & response.data.length>=_options.limit ) { // not all data retrieved
				//log(lastDateDate);
				//log(_options.dateToDate);
				var _lastRecord = response.data[response.data.length-1];
				var lastDate;
				// period in case of aggregation
				if (_lastRecord._id != undefined && _lastRecord._id.period != undefined) {
					lastDate = _lastRecord._id.period;
				} else lastDate = _lastRecord.dateObserved;
				var lastDateDate = new Date(lastDate);
				_options.dateFromDate = new Date(lastDateDate.getTime()+1);
				_options.dateFrom			= _options.dateFromDate.toISOString();
				callAxios(_options,_res);
			} else _res.end();
		}
//		log('end of read');
//      type: "stream" //,
      //chunk: count++
    //})+'\n')
//	    logDir(response.data);
	    //console.log(response.data.explanation);
	 })
	 .catch(error => {
	   log(error);
		 _res.end();
	 });
//	return axios.get(url,{ headers: headers });

}

app.get('/*', function(req, res) {
	log("Apri-Sensor-service request url error: " + req.url );
	var _message = errorMessages.URLERROR
	_message.message += " API error, wrong parameters?";
	//errorResult(res, _message);
	log('Error: %s - %s', _message.returnCode, _message.message );
	res.contentType('text/plain');
	res.status(_message.returnCode).send(_message.message);
	return;
});



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
