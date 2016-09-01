'use strict';

/**
 * @fileOverview A processor Lambda function definition.
 */

var AWS = require('aws-sdk');
var request = require('request');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('mmmmm');

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
      id: data.date_key,
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
    TableName: process.env.LIST_TABLE,
    Item: {
      id:     { S: user.id },
      created:  { S: user.created },
      updated:  { S: user.updated },
      info: { S: user.info },
    },
    // ConditionExpression: 'attribute_not_exists (id)'
  });
}

var download = function(date_key, url, context){
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
        date_key: date_key,
        info: body,
      };

      validateInput(data)
        .then(createList)
        .then(storeList)
        .then(function(result) {
            context.done(null, result);
        })
        .error(function(error) {
            context.done(error, null);
        });
    }else{
      if(error){
        context.done(error, 'request failed');
      }else{
        context.done('error response.statusCode ' + response.statusCode, 'request failed');
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
module.exports.handler = function (event, context) {
  // Processing is this case is nothing more exciting than logging the event
  // JSON.
  // console.info(JSON.stringify(event, null, '  '));
  var m = moment().utcOffset("-03:00");

  var date =
    ("0" + (m.date())).slice(-2) +
    ("0" + (m.month() + 1)).slice(-2) +
    m.year();

  var date_today_key =
    m.year() +
    ("0" + (m.month() + 1)).slice(-2) +
    ("0" + (m.date())).slice(-2);

  console.log(date_today_key);
  var ticket = process.env.MERCADOPUBLICO_TICKET;
  var url = 'http://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?fecha='+date+'&ticket='+ticket;
  console.log(url);

  download(date_today_key, url, context);

};