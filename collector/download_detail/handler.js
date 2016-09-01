'use strict';

/**
 * @fileOverview A processor Lambda function definition.
 */

var AWS = require('aws-sdk');
var request = require('request');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('mmmmm');
var async = require('async');

AWS.config.region = process.env.SERVERLESS_REGION || 'us-east-1';

var dynamodb = new AWS.DynamoDB();
Promise.promisifyAll(Object.getPrototypeOf(dynamodb));

var validateInput = function(data) {
  return new Promise(function(resolve, reject) {
    resolve(data);
  });
}

var createList = function(data) {
  return new Promise(function(resolve, reject) {
    var user = {
      id: data.code,
      created:  moment().unix().toString(),
      updated:  moment().unix().toString(),
      info: data.info,
    }
    resolve(user);
  });
}

var storeList = function(user) {
  debug('Saving ' + JSON.stringify(user));
  return dynamodb.putItemAsync({
    TableName: process.env.DETAILS_TABLE,
    Item: {
      id:     { S: user.id },
      created:  { S: user.created },
      updated:  { S: user.updated },
      info: { S: user.info },
    },
    // ConditionExpression: 'attribute_not_exists (id)'
  });
}

var download = function(code, url, context){
  var options = {
    url: url,
    // headers: {
    //   'User-Agent': 'request'
    // }
  };

  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      var info = JSON.parse(body);
      // console.info(JSON.stringify(info, null, '  '));
      var data = {
        code: code,
        info: body,
      };

      validateInput(data)
        .then(createList)
        .then(storeList)
        .then(function(result) {
            context(null, result);
        })
        .error(function(error) {
            context(error, null);
        });
    }else{
      if(error){
        context(error, 'request failed');
      }else{
        context('error response.statusCode ' + response.statusCode, 'request failed');
      }
    }
  }

  request(options, callback);
}

/**
 * Process the provided event.
 *
 * @param {Object} event
 * @param {Object} context
 */
var handler = function (event, context) {
  // Processing is this case is nothing more exciting than logging the event
  // JSON.
  console.info(JSON.stringify(event, null, '  '));

  async.eachSeries(event.Records, function iterator(record, callback) {
    var payload = new Buffer(record.kinesis.data, 'base64').toString();
    console.info(payload);
    payload = JSON.parse(payload);
    var id = payload.id;
    var code = payload.info.CodigoExterno;

    var ticket = process.env.MERCADOPUBLICO_TICKET;
    var url = 'http://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo='+code+'&ticket='+ticket;
    console.log(url);
    download(code, url, callback);

  }, function done(err, results) {
        context.done(err);
  });

};


exports.validateInput = validateInput;
exports.storeList = storeList;
// exports.putRecordTokinesis = putRecordTokinesis;
exports.handler = handler;
