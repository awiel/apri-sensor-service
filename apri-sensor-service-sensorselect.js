logDir/*
** Module: apri-sensor-service-sensorselect.js
**   ApriSensorService server
**
**
**
*/
// test:
// http://localhost:5050/apri-sensor-service/v1/getSelectionData/?fiwareService=aprisensor_in&fiwareServicePath=/pmsa003&foiOps=SCNM5CCF7F2F62F3:SCNM5CCF7F2F62F3_alias,pm25:pm25_alias&dateFrom=2019-03-03T22:55:55.000Z&dateTo=2019-03-04T22:55:55.999Z
"use strict";

var log = function(message){
	console.log(new Date().toISOString()+' | '+message);
}
var logDir = function(object){
	console.log(object);
}

var service 		= 'apri-sensor-service-sensorselect';
	console.log("Path: " + service);
var modulePath = require('path').resolve(__dirname, '.');
	console.log("Modulepath: " + modulePath);
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

var _systemCode 					= apriSensorServiceConfig.getSystemCode();
var _systemFolderParent		= apriSensorServiceConfig.getSystemFolderParent();
var _systemFolder					= apriSensorServiceConfig.getSystemFolder();
var _systemListenPort			= apriSensorServiceConfig.getSystemListenPort();
var _systemParameter			= apriSensorServiceConfig.getConfigParameter();
var _serviceTarget				= apriSensorServiceConfig.getConfigServiceTarget();


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
	console.log("ApriSensorService testservice: " + req.url );

	res.contentType('text/plain');
	var result = 'testrun started';
 	res.send(result);

});



app.all('/*', function(req, res, next) {
	console.log("app.all/: " + req.url + " ; systemCode: " + _systemCode );
	next();
});

app.get('/apri-sensor-service/v1/getSelectionData', function(req, res) {
	console.log('/apri-sensor-service/v1/getSelectionData');
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

	params.selection = selection;

	if (selection.foiId) {
		//start stream for response
		res.writeHead(200, {
	    'Content-Type': 'text/plain',
	    'Transfer-Encoding': 'chunked'
	  })
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
					options.foiId					= thisParams.selection.foiId;
					options.foiIdAlias		= thisParams.selection.foiIdAlias;
					options.ops						= thisParams.selection.ops;
					options.urlParamsAttrs = urlParamsAttrs;
					options.limit					= 1000;
					options.dateFrom 			= thisParams.dateFrom;
					options.dateFromDate 	= new Date(options.dateFrom);
					options.dateTo 				= thisParams.dateTo;
					options.dateToDate 		= new Date(options.dateTo);
					options.fiwareService = thisParams.fiwareService;
					options.fiwareServicePath = thisParams.fiwareServicePath;
					options.host 					= _serviceTarget.host;
					options.prefixPath		= _serviceTarget.prefixPath;

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
	var urlParams					= _options.urlParamsAttrs+",sensorId,dateObserved";
	urlParams							= urlParams+"&limit="+_options.limit+"&q=sensorId=='"+_options.foiId+"'";
	urlParams							= urlParams + ";dateObserved=='"+_options.dateFrom+"'..'"+_options.dateTo+"'";

	var url = 'https://'+ _options.host + _options.prefixPath + urlParams;
	log(url);
	var headers = {
		 "Fiware-Service": _options.fiwareService?_options.fiwareService:_serviceTarget.FiwareService
			, "Fiware-ServicePath": _options.fiwareServicePath?_options.fiwareServicePath:_serviceTarget.FiwareServicePath
	};
	axios.get(url,{ headers: headers })
	.then(response => {
		log("Records: "+response.data.length);
		var rec = '';
		for (var i=0;i<response.data.length;i++) {
			rec = response.data[i];
			var csvrec = _options.foiIdAlias+';'+rec.dateObserved+';';
			for (var j=0;j<_options.ops.length;j++) {
				var op = _options.ops[j];
				res.write(csvrec+op.opIdAlias+';'+rec[op.opId]+'\n');
			}
			//_res.write(JSON.stringify(response.data[i]));
//			_res.write('"'+rec.pm25+'";'+'"'+rec.pm25+'";'+));
		}
		if ( response.data.length>0 & response.data.length>=_options.limit ) { // not all data retrieved
				//console.log(lastDateDate);
				//console.log(_options.dateToDate);
			var lastDate = response.data[response.data.length-1].dateObserved;
			var lastDateDate = new Date(lastDate);
			_options.dateFromDate = new Date(lastDateDate.getTime()+1);
			_options.dateFrom			= _options.dateFromDate.toISOString();
			callAxios(_options,_res);
		} else _res.end();
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
	console.log("Apri-Sensor-service request url error: " + req.url );
	var _message = errorMessages.URLERROR
	_message.message += " API error, wrong parameters?";
	//errorResult(res, _message);
	console.log('Error: %s - %s', _message.returnCode, _message.message );
	res.contentType('text/plain');
	res.status(_message.returnCode).send(_message.message);
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
