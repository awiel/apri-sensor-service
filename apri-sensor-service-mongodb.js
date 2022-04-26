/*
** Module: apri-sensor-service-mongodb.js
**   ApriSensorService server
**   service to offer API for mongodb calls
**
**
*/

/*
example: aggregate
db.enities.aggregate([
                     { $match: { } },
                     { $group: { _id: "$attrs.sensorId.value", total: { $count: 1 } } },
                     { $sort: { _id: -1 } }
                   ])

db.entities.aggregate([{ '$match': {"attrs.sensorId.value":"SCNMDC4F22113934"} },{ '$group': { '_id': "$attrs.sensorId.value", 'total': { '$sum': 1 } } } ])

*/

// db.enities.aggregate([{ '$match': {"attrs.sensorId.value":"SCNMDC4F22113934"} },{ '$group': { '_id': {sensorId:"$attrs.sensorId.value",servicePath:"$_id.servicePath"}, 'total': { '$sum': 1 } } } ])

// db.entities.aggregate([{ '$match': {"attrs.sensorId.value":"SCNMDC4F22113934"} },{ '$group': { '_id': {sensorId:"$attrs.sensorId.value",servicePath:"$_id.servicePath"}, 'total': { '$sum': 1 },servicePath:{$max:"$_id.servicePath"},dateFrom:{$min:"$attrs.dateObserved.value"},dateTo:{$max:"$attrs.dateObserved.value"} } } ])

// Totaaltelling: sensorIds per servicePath met eerste en laatste datumtot
// db.entities.aggregate([{ '$match': {} },{ '$group': { '_id': {sensorId:"$attrs.sensorId.value",servicePath:"$_id.servicePath"}, 'total': { '$sum': 1 },servicePath:{$max:"$_id.servicePath"},dateFrom:{$min:"$attrs.dateObserved.value"},dateTo:{$max:"$attrs.dateObserved.value"} } },{ $sort: { sensorId: -1 } } ])





"use strict";

var log 										= function(message){
	console.log(new Date().toISOString()+' | '+message);
}
var logDir 									= function(object){
	console.log(object);
}

var service 								= 'apri-sensor-service-mongodb';
var modulePath 							= require('path').resolve(__dirname, '.');
console.log("Path: " + service);
console.log("Modulepath: " + modulePath);
var apriSensorServiceConfig	= require(modulePath + '/apri-sensor-service-config');
apriSensorServiceConfig.init(service);

var self = this;

// **********************************************************************************

// add module specific requires
var axios 									= require('axios');
var express 								= require('express');
//var bodyParser 							= require('body-parser');
//var mongodb 								= require('body-parser');
const MongoClient 					= require('mongodb').MongoClient;

var _systemCode 					= apriSensorServiceConfig.getSystemCode();
var _systemFolderParent		= apriSensorServiceConfig.getSystemFolderParent();
var _systemFolder					= apriSensorServiceConfig.getSystemFolder();
var _systemListenPort			= apriSensorServiceConfig.getSystemListenPort();
var _systemParameter			= apriSensorServiceConfig.getConfigParameter();
//var _serviceSource				= apriSensorServiceConfig.getConfigServiceSource();
var _serviceTarget				= apriSensorServiceConfig.getConfigServiceTarget();


var app = express();


//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));


// **********************************************************************************

// todo: see messages in OGC 06-121r3 Table 8
var errorMessages = {
	  NOQUERY 			: { "message": 'Query parameters missing'		, "returnCode": 501 }
	, NOSERVICE 		: { "message": 'SERVICE parameter missing'		, "returnCode": 501 }
	, NOFIWARESERVICE	: { "message": 'FIWARE service(path) header is missing'		, "returnCode": 501 }
	, NOREQUEST 		: { "message": 'REQUEST parameter missing'		, "returnCode": 501 }
	, UNKNOWNREQ 		: { "message": 'REQUEST parameter unknown'		, "returnCode": 501 }
	, UNKNOWNIDENTIFIER : { "message": 'IDENTIFIER parameter unknown'	, "returnCode": 501 }
	, URLERROR 			: { "message": 'URL incorrect'					, "returnCode": 501 }
	, NOSELECTIONID	: { "message": 'Selection ID missing'	, "returnCode": 501 }
	, NOFOIOPS 			: { "message": 'Observable properties missing'		, "returnCode": 501 }
	, NO_Q_PARAM 		: { "message": 'q parameter missing'		, "returnCode": 501 }
	, NO_SENSORID 	: { "message": 'sensorId missing'		, "returnCode": 501 }

}

var mongoDbFunction = {};


var targetUrl;
targetUrl = _serviceTarget.protocol + '://' +
	_serviceTarget.host + ':' +
	_serviceTarget.port +
	_serviceTarget.prefixPath +
	_serviceTarget.path;

console.log('Mongodb target: ' + targetUrl)
const mongoClient = new MongoClient(targetUrl,{ useNewUrlParser: true,useUnifiedTopology: true});

mongoClient.connect();


/*
	db.entities.aggregate([{$match:{"attrs.sensorId.value":"SCNMECFABC081A53","attrs.dateObserved.value":{$gt:"2019-03-20T18"},"attrs.dateObserved.value":{$lt:"2019-04-20T19:40"} } }
,{$group:{
_id:{id:"$attrs.sensorId.value",period:{$substr:["$attrs.dateObserved.value",0,7]}}
,pm25: {$avg: "$attrs.pm25.value"}
,pm10: {$avg: "$attrs.pm10.value"}
,datumvan:{$min:"$attrs.dateObserved.value"}
,datumtot:{$max:"$attrs.dateObserved.value"} } } ]);
*/


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

//app.get('/apri-sensor-service/v1/getSelectionData', function(req, res) {
app.get('/v2/entities', function(req, res) {
	console.log('/v2/entities');
	res.contentType('application/json');

	var params = {};
	var selection = {};
	var selectionData = {};

	var sensorCtrlDate = '';
	params.fiwareService = req.get('Fiware-Service');
	params.fiwareServicePath = req.get('Fiware-ServicePath');
	if (params.fiwareService == undefined | params.fiwareServicePath == undefined) {
  	res.status(errorMessages.NOFIWARESERVICE.returnCode).send(errorMessages.NOFIWARESERVICE.message);
		return;
	}
	var _query = req.query;
	//console.log(_query);
	if (_query == undefined) {
  	res.status(errorMessages.NOQUERY.returnCode).send(errorMessages.NOQUERY.message);
		return;
	}

	if (_query.aggregate == undefined & _query.latest == undefined & _query.first == undefined) {
		res.status(errorMessages.NOSELECTIONID.returnCode).send(errorMessages.NOSELECTIONID.message);
		return;
	}

	if (_query.q == undefined) {
		res.status(errorMessages.NO_Q_PARAM.returnCode).send(errorMessages.NO_Q_PARAM.message);
		return;
	}
  var fiwareConstraints =  _query.q.split(';');
	if (fiwareConstraints[0].substr(0,10) != 'sensorId==') {
		//console.log(fiwareConstraints[0].substr(0,10));
		//console.log(fiwareConstraints[0].substr(10));
		res.status(errorMessages.NO_SENSORID).send(errorMessages.NO_SENSORID);
		return;
	}
	params.sensorId = fiwareConstraints[0].substr(10).split('\'')[1]; // undo single quotes
	if (_query.latest == 'true') {
		params.latest = true
	} else {
		if (_query.first == 'true') {
			params.first = true
			var dates = fiwareConstraints[1].split("'");
			params.dateFrom = dates[1];
			params.dateTo = dates[3];
		} else {
			var dates = fiwareConstraints[1].split("'");
			params.dateFrom = dates[1];
			params.dateTo = dates[3];
		}
	}
	if (_query.limit != undefined) {
		params.limit = parseInt(_query.limit)
	}
	if (_query.aggregateLevel != undefined) {
		params.aggregateLevel = parseInt(_query.aggregateLevel)
	}
	//console.log(params.sensorId);

//	console.dir(req.query);

//	var headers = {
//		 "Fiware-Service": _options.fiwareService?_options.fiwareService:_serviceTarget.FiwareService
//			, "Fiware-ServicePath": _options.fiwareServicePath?_options.fiwareServicePath:_serviceTarget.FiwareServicePath
//	};

	params.query = req.query;

	retrieveData(params, res);

/*
	params.selectionId = '';
	if (_query.selectionId != undefined) {
		params.selectionId = _query.selectionId;
	} else {
		res.status(errorMessages.NOSELECTIONID.returnCode).send(errorMessages.NOSELECTIONID.message);
		return;
	}
*/

// /v2/entities?options=count,keyValues&attrs=pm25,sensorId,dateObserved&limit=1000&q=sensorId==%272019arbaairaqsensor1_2%27;dateObserved==%272019-05-07T20:06:25.792Z%27..%272019-05-08T20:06:25.792Z%27

/*
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
	  });
		// csv header
		if (params.opPerRow == 'false') {
			res.write(params.key+';dateObserved');
			for (var j=0;j<params.selection.ops.length;j++) {
				var opRow = params.selection.ops[j];
				res.write(';'+opRow.opIdAlias);
			}
			res.write('\n');
		} else {
			res.write(params.key+';dateObserved;sensorType;sensorValue\n');
		}
		retrieveData(params, res);
	} else {
		res.send('[])'); // nothing asked, empty array returned.
	}
	*/

});

var retrieveData 	= function(params, res) {
	var thisParams	= params;
	var thisRes 		= res;

	if (params.latest == true) {
		executeMongoTask('latest',thisParams,thisRes);
	}	else {
		if (params.first == true) {
			executeMongoTask('first',thisParams,thisRes);
		} else executeMongoTask('aggregate',thisParams,thisRes);
	}
	return;


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
					options.limit						= thisParams.limit
					options.dateFrom 				= thisParams.dateFrom;
					options.dateFromDate		= new Date(options.dateFrom);
					options.dateTo 					= thisParams.dateTo;
					options.dateToDate			= new Date(options.dateTo);
					options.fiwareService 	= thisParams.fiwareService;
					options.fiwareServicePath = thisParams.fiwareServicePath;
					options.host 						= _serviceTarget.host;
					options.prefixPath			= _serviceTarget.prefixPath;
					options.opPerRow				= thisParams.opPerRow;

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
	//console.log('callAxios')
	var _options 	= options;
	var _res			= res;
	var urlParams					= _options.urlParamsAttrs+","+options.key+",dateObserved";
	urlParams							= urlParams+"&limit="+_options.limit+"&q="+options.key+"=='"+_options.foiId+"'";
	urlParams							= urlParams + ";dateObserved=='"+_options.dateFrom+"'..'"+_options.dateTo+"'";

	var url = 'https://'+ _options.host + _options.prefixPath + urlParams;
	log(url);
	var headers = {
		 "Fiware-Service": _options.fiwareService?_options.fiwareService:_serviceTarget.FiwareService
			, "Fiware-ServicePath": _options.fiwareServicePath?_options.fiwareServicePath:_serviceTarget.FiwareServicePath
	};

	//console.dir(headers)
	axios.get(url,{ headers: headers })
	.then(response => {
		log("Records: "+response.data.length);
		var rec = '';
		for (var i=0;i<response.data.length;i++) {
			rec = response.data[i];
			var csvrec = _options.foiIdAlias+';'+rec.dateObserved;
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
	console.log('Error: Error in recieved url. %s - %s', _message.returnCode, _message.message );
	res.contentType('text/plain');
	res.status(_message.returnCode).send(_message.message);
	return;
});



var errorResult = function(res, message) {
	res.returncode = message.returnCode;
	res.contentType('text/plain');
	res.status(message.returnCode).send(message.message);
	console.log('Error: Error in recieved url. %s - %s', message.returnCode, message.message );
};


var startListen = function() {
	app.listen(_systemListenPort);
	console.log('listening to http://proxyintern: ' + _systemListenPort );
}


var executeMongoTask = function(functionName,params,res) {
	var _params = params;
	var _res = res;

	(async function() {
//	  // Connection URL
//	  const url = 'mongodb://localhost:27017/myproject';
//	  // Database Name
//	  const dbName = 'myproject';
//	  const client = new MongoClient(url);

	  try {
	    // Use connect method to connect to the Server
//	    await mongoClient.connect();
			//console.log(_serviceTarget.fiwareServicePrefix + _params.fiwareService)

			var fiwareServiceTarget
			if (_params.fiwareService=='') fiwareServiceTarget = 'orion'
			else fiwareServiceTarget = _serviceTarget.fiwareServicePrefix + _params.fiwareService
			console.log( 'fiwareServiceTarget: '+ fiwareServiceTarget)
	    const db = mongoClient.db(fiwareServiceTarget);

			const col = db.collection('entities');
			var results=''
			if (functionName == 'latest') {
//				console.log(_params)
				var latestFunction = mongoDbFunction.latest(_params);
				//console.log(latestFunction[0])
				//console.log(latestFunction[1])
				//console.dir(latestFunction[0])
				//console.dir(latestFunction[1])
				//return

			//	console.log('start find latest')
				col.find(latestFunction[0],latestFunction[1]) //  ,{"attrs.dateObserved.value":1}
				//col.find('{"attrs.sensorId.value":_params.sensorId,"_id.servicePath":_params.fiwareServicePath},{"attrs.dateObserved.value":1}, {"hint": {"attrs.sensorId.value" : 1,"attrs.dateObserved.value" : 1}}')
				.limit(1) // _params.limit)
			//	.hint("attrs.sensorId.value" : 1,"attrs.dateObserved.value" : -1)
				.toArray((err, results) => {
						if(err) throw err;
					        //results.forEach((value)=>{
					        //    console.log(value["_id"]);
					        //});
						//console.dir(results[0])
						//console.log('end find latest')
						_res.send(results);
						//mongoClient.close()
					  })
			}
			if (functionName == 'first') {
				//console.log(_params)
				var firstFunction = mongoDbFunction.first(_params);
				//console.log(firstFunction[0])
				//console.log(firstFunction[1])

				//console.log('start find first')
				col.find(firstFunction[0],firstFunction[1])
				.limit(_params.limit)
				//.hint({"attrs.sensorId.value" : 1,"attrs.dateObserved.value" : 1})
				.toArray((err, results) => {
						if(err) throw err;
						//console.log('end find first')
					        //results.forEach((value)=>{
					        //    console.log(value["_id"]);
					        //});
//						console.dir(results)
//						a=10/'a'
						_res.send(results);
						//mongoClient.close()
					  })
			}
			if (functionName == 'aggregate') {
				var aggregateFunction = mongoDbFunction.groupBy(_params);
				//console.dir(aggregateFunction)
				//results=[]
				results = await col.aggregate(aggregateFunction)
				.limit(_params.limit)
				.toArray();
				console.log(results)
				_res.send(results);
				//mongoClient.close()
			}


	  } catch (err) {
	    console.log(err.stack);
			_res.send(err)
	  }

	})();

}

mongoDbFunction.latest = function(params) {
	var _params = params;
	console.log('mongoDbFunction.latest');
  var dateLength = 13;  // 7=per maand  10=per dag   13=per uur
	var mongoQuery =[
//		{"attrs.sensorId.value":_params.sensorId,"_id.servicePath":_params.fiwareServicePath}
//		{"attrs.sensorId.value":_params.sensorId,"_id.servicePath":_params.fiwareServicePath},{"attrs.dateObserved.value":1}, {"hint": {"attrs.sensorId.value" : 1,"attrs.dateObserved.value" : 1}}'
		{"attrs.sensorId.value":_params.sensorId,"_id.servicePath":_params.fiwareServicePath}, //, {"hint": {"attrs.sensorId.value" : 1,"attrs.dateObserved.value" : -1}}'
		,{'hint':{"attrs.sensorId.value" : 1,"_id.servicePath":1,"attrs.dateObserved.value" : -1}} // desc
	];
//	,{ sort: {"attrs.dateObserved.value":-1}},{'hint':{"attrs.sensorId.value" : 1,"attrs.dateObserved.value" : -1}} // desc

		return mongoQuery;
}
mongoDbFunction.first = function(params) {
	var _params = params;
	console.log('mongoDbFunction.first');
  var dateLength = 13;  // 7=per maand  10=per dag   13=per uur
	var mongoQuery =[
		{"attrs.sensorId.value":_params.sensorId,"_id.servicePath":_params.fiwareServicePath,"attrs.dateObserved.value":{$gt:_params.dateFrom,$lt:_params.dateTo}}
		,{'hint':{"attrs.sensorId.value" : 1,"_id.servicePath":1,"attrs.dateObserved.value" : 1}} // desc
	];
//		,{ sort: {"attrs.dateObserved.value":1}},{'hint':{"attrs.sensorId.value" : 1,"attrs.dateObserved.value" : 1}} // asc

		return mongoQuery;
}


mongoDbFunction.groupBy = function(params) {
	var _params = params;
	console.log('mongoDbFunction.groupBy');

	var dateLength = 13  // 7=per maand  10=per dag   13=per uur  15=per 10 minuten
	var periodType = 'H'  // hour
	var aggregateServicePathSuffix = 'hour'
	if (params.aggregateLevel==60) {
		dateLength=13
		periodType='H'
		aggregateServicePathSuffix = 'hour'
	}

	var mongoQuery = [
		{$match:{ $and: [{"attrs.sensorId.value":_params.sensorId},{"attrs.dateObserved.value":{$gt:_params.dateFrom,$lt:_params.dateTo}},{"_id.servicePath":_params.fiwareServicePath}] } }
		, {$group:{
			_id:{id:"$attrs.sensorId.value",sensorType:"$attrs.sensorType.value",periodType: periodType,period:{$substr:["$attrs.dateObserved.value",0,dateLength]},servicePath:"$_id.servicePath"}
//			_id:{period:{$substr:["$attrs.dateObserved.value",0,dateLength]}}
	//		,period:{$substr:["$attrs.dateObserved.value",0,10]} //7=per maand  10=perdag

			,sensorId:{$max:"$attrs.sensorId.value"}
			,sensorType:{$max:"$attrs.sensorType.value"}
			,aggregateLevel: {$max:params.aggregateLevel}
			,aggregateServicePathSuffix: {$max:aggregateServicePathSuffix}
			,period:{$max:{$substr:["$attrs.dateObserved.value",0,dateLength]}}
//			,pm25: {$avg: "$attrs.pm25.value"}
//			,pm25_min: {$min: "$attrs.pm25.value"}
//			,pm25_max: {$max: "$attrs.pm25.value"}
//			,pm10: {$avg: "$attrs.pm10.value"}
			,dateObservedFrom:{$min:"$attrs.dateObserved.value"}
			,dateObservedTo:{$max:"$attrs.dateObserved.value"}
			,count: { $sum: 1 } } }
		, {$sort:	{
				_id: 1
				}
			}
		, {$limit:_params.limit}
		];
		//console.dir(mongoQuery);
		if (params.fiwareServicePath == '/bme280') {
			mongoQuery[1]['$group'].temperature = {$avg: "$attrs.temperature.value"};
			mongoQuery[1]['$group'].temperature_min = {$min: "$attrs.temperature.value"};
			mongoQuery[1]['$group'].temperature_max = {$max: "$attrs.temperature.value"};
			mongoQuery[1]['$group'].pressure = {$avg: "$attrs.pressure.value"};
			mongoQuery[1]['$group'].pressure_min = {$min: "$attrs.pressure.value"};
			mongoQuery[1]['$group'].pressure_max = {$max: "$attrs.pressure.value"};
			mongoQuery[1]['$group'].rHum = {$avg: "$attrs.rHum.value"};
			mongoQuery[1]['$group'].rHum_min = {$min: "$attrs.rHum.value"};
			mongoQuery[1]['$group'].rHum_max = {$max: "$attrs.rHum.value"};
		}
		if (params.fiwareServicePath == '/pmsa003') {
			mongoQuery[1]['$group'].pm1 = {$avg: "$attrs.pm1.value"};
			mongoQuery[1]['$group'].pm1_min = {$min: "$attrs.pm1.value"};
			mongoQuery[1]['$group'].pm1_max = {$max: "$attrs.pm1.value"};
			mongoQuery[1]['$group'].pm25 = {$avg: "$attrs.pm25.value"};
			mongoQuery[1]['$group'].pm25_min = {$min: "$attrs.pm25.value"};
			mongoQuery[1]['$group'].pm25_max = {$max: "$attrs.pm25.value"};
			mongoQuery[1]['$group'].pm10 = {$avg: "$attrs.pm10.value"};
			mongoQuery[1]['$group'].pm10_min = {$min: "$attrs.pm10.value"};
			mongoQuery[1]['$group'].pm10_max = {$max: "$attrs.pm10.value"};
			mongoQuery[1]['$group'].pm1amb = {$avg: "$attrs.pm1amb.value"};
			mongoQuery[1]['$group'].pm1amb_min = {$min: "$attrs.pm1amb.value"};
			mongoQuery[1]['$group'].pm1amb_max = {$max: "$attrs.pm1amb.value"};
			mongoQuery[1]['$group'].pm25amb = {$avg: "$attrs.pm25amb.value"};
			mongoQuery[1]['$group'].pm25amb_min = {$min: "$attrs.pm25amb.value"};
			mongoQuery[1]['$group'].pm25amb_max = {$max: "$attrs.pm25amb.value"};
			mongoQuery[1]['$group'].pm10amb = {$avg: "$attrs.pm10amb.value"};
			mongoQuery[1]['$group'].pm10amb_min = {$min: "$attrs.pm10amb.value"};
			mongoQuery[1]['$group'].pm10amb_max = {$max: "$attrs.pm10amb.value"};
			mongoQuery[1]['$group'].raw0_3 = {$avg: "$attrs.raw0_3.value"};
			mongoQuery[1]['$group'].raw0_3_min = {$min: "$attrs.raw0_3.value"};
			mongoQuery[1]['$group'].raw0_3_max = {$max: "$attrs.raw0_3.value"};
			mongoQuery[1]['$group'].raw0_5 = {$avg: "$attrs.raw0_5.value"};
			mongoQuery[1]['$group'].raw0_5_min = {$min: "$attrs.raw0_5.value"};
			mongoQuery[1]['$group'].raw0_5_max = {$max: "$attrs.raw0_5.value"};
			mongoQuery[1]['$group'].raw0_1 = {$avg: "$attrs.raw0_1.value"};
			mongoQuery[1]['$group'].raw0_1_min = {$min: "$attrs.raw0_1.value"};
			mongoQuery[1]['$group'].raw0_1_max = {$max: "$attrs.raw0_1.value"};
			mongoQuery[1]['$group'].raw1_0 = {$avg: "$attrs.raw1_0.value"};
			mongoQuery[1]['$group'].raw1_0_min = {$min: "$attrs.raw1_0.value"};
			mongoQuery[1]['$group'].raw1_0_max = {$max: "$attrs.raw1_0.value"};
			mongoQuery[1]['$group'].raw2_5 = {$avg: "$attrs.raw2_5.value"};
			mongoQuery[1]['$group'].raw2_5_min = {$min: "$attrs.raw2_5.value"};
			mongoQuery[1]['$group'].raw2_5_max = {$max: "$attrs.raw2_5.value"};
			mongoQuery[1]['$group'].raw5_0 = {$avg: "$attrs.raw5_0.value"};
			mongoQuery[1]['$group'].raw5_0_min = {$min: "$attrs.raw5_0.value"};
			mongoQuery[1]['$group'].raw5_0_max = {$max: "$attrs.raw5_0.value"};
			mongoQuery[1]['$group'].raw10_0 = {$avg: "$attrs.raw10_0.value"};
			mongoQuery[1]['$group'].raw10_0_min = {$min: "$attrs.raw10_0.value"};
			mongoQuery[1]['$group'].raw10_0_max = {$max: "$attrs.raw10_0.value"};
		}
		if (params.fiwareServicePath == '/ds18b20') {
			mongoQuery[1]['$group'].temperature = {$avg: "$attrs.temperature.value"};
			mongoQuery[1]['$group'].temperature_min = {$min: "$attrs.temperature.value"};
			mongoQuery[1]['$group'].temperature_max = {$max: "$attrs.temperature.value"};
		}
		if (params.fiwareServicePath == '/dylos') {
			mongoQuery[1]['$group'].raw0 = {$avg: "$attrs.raw0.value"};
			mongoQuery[1]['$group'].raw0_min = {$min: "$attrs.raw0.value"};
			mongoQuery[1]['$group'].raw0_max = {$max: "$attrs.raw0.value"};
			mongoQuery[1]['$group'].raw1 = {$avg: "$attrs.raw1.value"};
			mongoQuery[1]['$group'].raw1_min = {$min: "$attrs.raw1.value"};
			mongoQuery[1]['$group'].raw1_max = {$max: "$attrs.raw1.value"};
		}
		if (params.fiwareServicePath == '/tsi3007') {
			mongoQuery[1]['$group'].part = {$avg: "$attrs.part.value"};
			mongoQuery[1]['$group'].part_min = {$min: "$attrs.part.value"};
			mongoQuery[1]['$group'].part_max = {$max: "$attrs.part.value"};
		}
		if (params.fiwareServicePath == '/caire') {
			mongoQuery[1]['$group'].pm1 = {$avg: "$attrs.pm1.value"};
			mongoQuery[1]['$group'].pm1_min = {$min: "$attrs.pm1.value"};
			mongoQuery[1]['$group'].pm1_max = {$max: "$attrs.pm1.value"};
			mongoQuery[1]['$group'].pm25 = {$avg: "$attrs.pm25.value"};
			mongoQuery[1]['$group'].pm25_min = {$min: "$attrs.pm25.value"};
			mongoQuery[1]['$group'].pm25_max = {$max: "$attrs.pm25.value"};
			mongoQuery[1]['$group'].pm10 = {$avg: "$attrs.pm10.value"};
			mongoQuery[1]['$group'].pm10_min = {$min: "$attrs.pm10.value"};
			mongoQuery[1]['$group'].pm10_max = {$max: "$attrs.pm10.value"};
			mongoQuery[1]['$group'].temperature = {$avg: "$attrs.temperature.value"};
			mongoQuery[1]['$group'].temperature_min = {$min: "$attrs.temperature.value"};
			mongoQuery[1]['$group'].temperature_max = {$max: "$attrs.temperature.value"};
			mongoQuery[1]['$group'].rHum = {$avg: "$attrs.rHum.value"};
			mongoQuery[1]['$group'].rHum_min = {$min: "$attrs.rHum.value"};
			mongoQuery[1]['$group'].rHum_max = {$max: "$attrs.rHum.value"};
		}

		if (params.fiwareServicePath == '/tgs5204') {
			mongoQuery[1]['$group'].co = {$avg: "$attrs.co.value"};
			mongoQuery[1]['$group'].co_min = {$min: "$attrs.co.value"};
			mongoQuery[1]['$group'].co_max = {$max: "$attrs.co.value"};
		}
		if (params.fiwareServicePath == '/bme680') {
			mongoQuery[1]['$group'].temperature = {$avg: "$attrs.temperature.value"};
			mongoQuery[1]['$group'].temperature_min = {$min: "$attrs.temperature.value"};
			mongoQuery[1]['$group'].temperature_max = {$max: "$attrs.temperature.value"};
			mongoQuery[1]['$group'].pressure = {$avg: "$attrs.pressure.value"};
			mongoQuery[1]['$group'].pressure_min = {$min: "$attrs.pressure.value"};
			mongoQuery[1]['$group'].pressure_max = {$max: "$attrs.pressure.value"};
			mongoQuery[1]['$group'].rHum = {$avg: "$attrs.rHum.value"};
			mongoQuery[1]['$group'].rHum_min = {$min: "$attrs.rHum.value"};
			mongoQuery[1]['$group'].rHum_max = {$max: "$attrs.rHum.value"};
			mongoQuery[1]['$group'].gasResistance = {$avg: "$attrs.gasResistance.value"};
			mongoQuery[1]['$group'].gasResistance_min = {$min: "$attrs.gasResistance.value"};
			mongoQuery[1]['$group'].gasResistance_max = {$max: "$attrs.gasResistance.value"};
		}
		if (params.fiwareServicePath == '/sps30') {
			mongoQuery[1]['$group'].pm1 = {$avg: "$attrs.pm1.value"};
			mongoQuery[1]['$group'].pm1_min = {$min: "$attrs.pm1.value"};
			mongoQuery[1]['$group'].pm1_max = {$max: "$attrs.pm1.value"};
			mongoQuery[1]['$group'].pm25 = {$avg: "$attrs.pm25.value"};
			mongoQuery[1]['$group'].pm25_min = {$min: "$attrs.pm25.value"};
			mongoQuery[1]['$group'].pm25_max = {$max: "$attrs.pm25.value"};
			mongoQuery[1]['$group'].pm4 = {$avg: "$attrs.pm4.value"};
			mongoQuery[1]['$group'].pm4_min = {$min: "$attrs.pm4.value"};
			mongoQuery[1]['$group'].pm4_max = {$max: "$attrs.pm4.value"};
			mongoQuery[1]['$group'].pm10 = {$avg: "$attrs.pm10.value"};
			mongoQuery[1]['$group'].pm10_min = {$min: "$attrs.pm10.value"};
			mongoQuery[1]['$group'].pm10_max = {$max: "$attrs.pm10.value"};
			mongoQuery[1]['$group'].raw0_5 = {$avg: "$attrs.raw0_5.value"};
			mongoQuery[1]['$group'].raw0_5_min = {$min: "$attrs.raw0_5.value"};
			mongoQuery[1]['$group'].raw0_5_max = {$max: "$attrs.raw0_5.value"};
			mongoQuery[1]['$group'].raw1_0 = {$avg: "$attrs.raw1_0.value"};
			mongoQuery[1]['$group'].raw1_0_min = {$min: "$attrs.raw1_0.value"};
			mongoQuery[1]['$group'].raw1_0_max = {$max: "$attrs.raw1_0.value"};
			mongoQuery[1]['$group'].raw2_5 = {$avg: "$attrs.raw2_5.value"};
			mongoQuery[1]['$group'].raw2_5_min = {$min: "$attrs.raw2_5.value"};
			mongoQuery[1]['$group'].raw2_5_max = {$max: "$attrs.raw2_5.value"};
			mongoQuery[1]['$group'].raw4_0 = {$avg: "$attrs.raw4_0.value"};
			mongoQuery[1]['$group'].raw4_0_min = {$min: "$attrs.raw4_0.value"};
			mongoQuery[1]['$group'].raw4_0_max = {$max: "$attrs.raw4_0.value"};
			mongoQuery[1]['$group'].raw10_0 = {$avg: "$attrs.raw10_0.value"};
			mongoQuery[1]['$group'].raw10_0_min = {$min: "$attrs.raw10_0.value"};
			mongoQuery[1]['$group'].raw10_0_max = {$max: "$attrs.raw10_0.value"};
			mongoQuery[1]['$group'].tps = {$avg: "$attrs.tps.value"};
			mongoQuery[1]['$group'].tps_min = {$min: "$attrs.tps.value"};
			mongoQuery[1]['$group'].tps_max = {$max: "$attrs.tps.value"};
		}
		if (params.fiwareServicePath == '/ips7100') {
			mongoQuery[1]['$group'].pm01 = {$avg: "$attrs.pm01.value"};
			mongoQuery[1]['$group'].pm01_min = {$min: "$attrs.pm01.value"};
			mongoQuery[1]['$group'].pm01_max = {$max: "$attrs.pm01.value"};
			mongoQuery[1]['$group'].pm03 = {$avg: "$attrs.pm03.value"};
			mongoQuery[1]['$group'].pm03_min = {$min: "$attrs.pm03.value"};
			mongoQuery[1]['$group'].pm03_max = {$max: "$attrs.pm03.value"};
			mongoQuery[1]['$group'].pm05 = {$avg: "$attrs.pm05.value"};
			mongoQuery[1]['$group'].pm05_min = {$min: "$attrs.pm05.value"};
			mongoQuery[1]['$group'].pm05_max = {$max: "$attrs.pm05.value"};
			mongoQuery[1]['$group'].pm1 = {$avg: "$attrs.pm1.value"};
			mongoQuery[1]['$group'].pm1_min = {$min: "$attrs.pm1.value"};
			mongoQuery[1]['$group'].pm1_max = {$max: "$attrs.pm1.value"};
			mongoQuery[1]['$group'].pm25 = {$avg: "$attrs.pm25.value"};
			mongoQuery[1]['$group'].pm25_min = {$min: "$attrs.pm25.value"};
			mongoQuery[1]['$group'].pm25_max = {$max: "$attrs.pm25.value"};
			mongoQuery[1]['$group'].pm5 = {$avg: "$attrs.pm5.value"};
			mongoQuery[1]['$group'].pm5_min = {$min: "$attrs.pm5.value"};
			mongoQuery[1]['$group'].pm5_max = {$max: "$attrs.pm5.value"};
			mongoQuery[1]['$group'].pm10 = {$avg: "$attrs.pm10.value"};
			mongoQuery[1]['$group'].pm10_min = {$min: "$attrs.pm10.value"};
			mongoQuery[1]['$group'].pm10_max = {$max: "$attrs.pm10.value"};
			mongoQuery[1]['$group'].raw0_1 = {$avg: "$attrs.raw0_1.value"};
			mongoQuery[1]['$group'].raw0_1_min = {$min: "$attrs.raw0_1.value"};
			mongoQuery[1]['$group'].raw0_1_max = {$max: "$attrs.raw0_1.value"};
			mongoQuery[1]['$group'].raw0_3 = {$avg: "$attrs.raw0_3.value"};
			mongoQuery[1]['$group'].raw0_3_min = {$min: "$attrs.raw0_3.value"};
			mongoQuery[1]['$group'].raw0_3_max = {$max: "$attrs.raw0_3.value"};
			mongoQuery[1]['$group'].raw0_5 = {$avg: "$attrs.raw0_5.value"};
			mongoQuery[1]['$group'].raw0_5_min = {$min: "$attrs.raw0_5.value"};
			mongoQuery[1]['$group'].raw0_5_max = {$max: "$attrs.raw0_5.value"};
			mongoQuery[1]['$group'].raw1_0 = {$avg: "$attrs.raw1_0.value"};
			mongoQuery[1]['$group'].raw1_0_min = {$min: "$attrs.raw1_0.value"};
			mongoQuery[1]['$group'].raw1_0_max = {$max: "$attrs.raw1_0.value"};
			mongoQuery[1]['$group'].raw2_5 = {$avg: "$attrs.raw2_5.value"};
			mongoQuery[1]['$group'].raw2_5_min = {$min: "$attrs.raw2_5.value"};
			mongoQuery[1]['$group'].raw2_5_max = {$max: "$attrs.raw2_5.value"};
			mongoQuery[1]['$group'].raw5_0 = {$avg: "$attrs.raw5_0.value"};
			mongoQuery[1]['$group'].raw5_0_min = {$min: "$attrs.raw5_0.value"};
			mongoQuery[1]['$group'].raw5_0_max = {$max: "$attrs.raw5_0.value"};
			mongoQuery[1]['$group'].raw10_0 = {$avg: "$attrs.raw10_0.value"};
			mongoQuery[1]['$group'].raw10_0_min = {$min: "$attrs.raw10_0.value"};
			mongoQuery[1]['$group'].raw10_0_max = {$max: "$attrs.raw10_0.value"};
		}


/*
		// old sensors:
		if (params.fiwareServicePath == '/') {

			mongoQuery[1]['$group'].temperature = {$avg: "$attrs.apri-sensor-bme280-temperature.value"};
			mongoQuery[1]['$group'].temperature_min = {$min: "$attrs.apri-sensor-bme280-temperature.value"};
			mongoQuery[1]['$group'].temperature_max = {$max: "$attrs.apri-sensor-bme280-temperature.value"};
			mongoQuery[1]['$group'].pressure = {$avg: "$attrs.apri-sensor-bme280-pressure.value"};
			mongoQuery[1]['$group'].pressure_min = {$min: "$attrs.apri-sensor-bme280-pressure.value"};
			mongoQuery[1]['$group'].pressure_max = {$max: "$attrs.apri-sensor-bme280-pressure.value"};
			mongoQuery[1]['$group'].rHum = {$avg: "$attrs.apri-sensor-bme280-rHum.value"};
			mongoQuery[1]['$group'].rHum_min = {$min: "$attrs.apri-sensor-bme280-rHum.value"};
			mongoQuery[1]['$group'].rHum_max = {$max: "$attrs.apri-sensor-bme280-rHum.value"};

			mongoQuery[1]['$group'].pm1 = {$avg: "$attrs.pm1.value"};
			mongoQuery[1]['$group'].pm1_min = {$min: "$attrs.pm1.value"};
			mongoQuery[1]['$group'].pm1_max = {$max: "$attrs.pm1.value"};
			mongoQuery[1]['$group'].pm25 = {$avg: "$attrs.pm25.value"};
			mongoQuery[1]['$group'].pm25_min = {$min: "$attrs.pm25.value"};
			mongoQuery[1]['$group'].pm25_max = {$max: "$attrs.pm25.value"};
			mongoQuery[1]['$group'].pm10 = {$avg: "$attrs.pm10.value"};
			mongoQuery[1]['$group'].pm10_min = {$min: "$attrs.pm10.value"};
			mongoQuery[1]['$group'].pm10_max = {$max: "$attrs.pm10.value"};
			mongoQuery[1]['$group'].pm1amb = {$avg: "$attrs.pm1amb.value"};
			mongoQuery[1]['$group'].pm1amb_min = {$min: "$attrs.pm1amb.value"};
			mongoQuery[1]['$group'].pm1amb_max = {$max: "$attrs.pm1amb.value"};
			mongoQuery[1]['$group'].pm25amb = {$avg: "$attrs.pm25amb.value"};
			mongoQuery[1]['$group'].pm25amb_min = {$min: "$attrs.pm25amb.value"};
			mongoQuery[1]['$group'].pm25amb_max = {$max: "$attrs.pm25amb.value"};
			mongoQuery[1]['$group'].pm10amb = {$avg: "$attrs.pm10amb.value"};
			mongoQuery[1]['$group'].pm10amb_min = {$min: "$attrs.pm10amb.value"};
			mongoQuery[1]['$group'].pm10amb_max = {$max: "$attrs.pm10amb.value"};
			mongoQuery[1]['$group'].raw0_3 = {$avg: "$attrs.raw0_3.value"};
			mongoQuery[1]['$group'].raw0_3_min = {$min: "$attrs.raw0_3.value"};
			mongoQuery[1]['$group'].raw0_3_max = {$max: "$attrs.raw0_3.value"};
			mongoQuery[1]['$group'].raw0_5 = {$avg: "$attrs.raw0_5.value"};
			mongoQuery[1]['$group'].raw0_5_min = {$min: "$attrs.raw0_5.value"};
			mongoQuery[1]['$group'].raw0_5_max = {$max: "$attrs.raw0_5.value"};
			mongoQuery[1]['$group'].raw0_1 = {$avg: "$attrs.raw0_1.value"};
			mongoQuery[1]['$group'].raw0_1_min = {$min: "$attrs.raw0_1.value"};
			mongoQuery[1]['$group'].raw0_1_max = {$max: "$attrs.raw0_1.value"};
			mongoQuery[1]['$group'].raw1_0 = {$avg: "$attrs.raw1_0.value"};
			mongoQuery[1]['$group'].raw1_0_min = {$min: "$attrs.raw1_0.value"};
			mongoQuery[1]['$group'].raw1_0_max = {$max: "$attrs.raw1_0.value"};
			mongoQuery[1]['$group'].raw2_5 = {$avg: "$attrs.raw2_5.value"};
			mongoQuery[1]['$group'].raw2_5_min = {$min: "$attrs.raw2_5.value"};
			mongoQuery[1]['$group'].raw2_5_max = {$max: "$attrs.raw2_5.value"};
			mongoQuery[1]['$group'].raw5_0 = {$avg: "$attrs.raw5_0.value"};
			mongoQuery[1]['$group'].raw5_0_min = {$min: "$attrs.raw5_0.value"};
			mongoQuery[1]['$group'].raw5_0_max = {$max: "$attrs.raw5_0.value"};
			mongoQuery[1]['$group'].raw10_0 = {$avg: "$attrs.raw10_0.value"};
			mongoQuery[1]['$group'].raw10_0_min = {$min: "$attrs.raw10_0.value"};
			mongoQuery[1]['$group'].raw10_0_max = {$max: "$attrs.raw10_0.value"};

			mongoQuery[1]['$group'].temperature = {$avg: "$attrs.temperature.value"};
			mongoQuery[1]['$group'].temperature_min = {$min: "$attrs.temperature.value"};
			mongoQuery[1]['$group'].temperature_max = {$max: "$attrs.temperature.value"};
		}
*/

		//console.dir(mongoQuery[1]);
		//console.log('match')
		//console.dir(mongoQuery[0].$match.$and);

		return mongoQuery;
}


startListen();
