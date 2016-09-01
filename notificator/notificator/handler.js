'use strict';

console.log('Loading function');
var AWS = require("aws-sdk");
var kinesis = new AWS.Kinesis();
var async = require('async');
var Promise = require('bluebird');
var debug = require('debug')('mmmmm');

var FILTER_CONFIG = {
    sns:{
        region: process.env.SERVERLESS_REGION,
        topicARN: process.env.NOTIFICATOR_TOPIC_ARN
    },
    dynamodb:{
        region: process.env.SERVERLESS_REGION,
        tableName: process.env.TOPICS_TABLE
    }
}

var dynamodb = new AWS.DynamoDB({
        // apiVersion: '2010-03-31',
        region: FILTER_CONFIG.sns.region
    });
Promise.promisifyAll(Object.getPrototypeOf(dynamodb));

var validateInput = function(data) {
  debug('validateInput ' + JSON.stringify(data));
  return new Promise(function(resolve, reject) {
    resolve(data);
  });
}

var getTopic = function(data) {
  debug('getTopic ' + JSON.stringify(data));
  return dynamodb.getItemAsync({
    TableName: FILTER_CONFIG.dynamodb.tableName,
    Key: {
      id: { S: data.id }
    }
  }).then(function (result) {
    debug('getTopic then' + JSON.stringify(result));
    if (result && 'Item' in result) {
      return {
        topicARN: result.Item.topicARN.S,
        id: data.id,
        msg: data.msg
      };
    }else{
      return {
        topicARN: FILTER_CONFIG.sns.topicARN,
        id: data.id,
        msg: data.msg
      };
    }
  });
  // return dynamodb.scanAsync({ TableName: FILTER_CONFIG.dynamodb.tableName });
  // return new Promise(function(resolve, reject) {
  //   new_data = {
  //     data: data,
  //     topicARN:'arn:aws:sns:us-east-1:204694264232:message'
  //   }
  //   resolve(new_data);
  // });
}

var validateTopic = function(data) {
  debug('validateTopic ' + JSON.stringify(data));
  return new Promise(function(resolve, reject) {
    resolve(data);
  });
}

function sendNotification(msg, topicARN, endPointARN) {
  return new Promise(function(resolve, reject) {
    var sns = new AWS.SNS({
        apiVersion: '2010-03-31',
        region: FILTER_CONFIG.sns.region
    });

    var params = {}
    if (topicARN !== '') {
       params = {
         Message: msg,
         //MessageStructure: 'json',
         TopicArn: topicARN
       };
    } else {
      params = {
        Message: msg,
        //MessageStructure: 'json',
        TargetArn: endPointARN
      };
    }

    console.log(params);

    sns.publish(params, function(err,data) {
        if (err) {
          console.log(err, err.stack); // an error occurred
          reject(err);
        } else {
          console.log(data);           // successful response
          resolve(data);
        }
    });
  });
}

function notify(data) {
      debug('notify ' + JSON.stringify(data));
      var message = "message " + JSON.stringify(data.msg);
      var task = sendNotification(message, data.topicARN, '');
      return task;
}

module.exports.handler = function(event, context) {
    console.info(JSON.stringify(event, null, '  '));

    async.eachSeries(event.Records, function iterator(record, callback) {
        debug('record ' + JSON.stringify(record));
        // var payload = JSON.parse(event.Records[0].Sns.Message);
        if (record.Sns.Message.indexOf('message') > -1 ){
            // var arrays = [];
            // var size = 500;

            // var id = record.dynamodb.Keys.id.S;
            // console.log(id);
            var data = {
                id: 'message',
                msg: record.Sns.Message,
                  // info: body,
            };

            if (record.Sns.Message.indexOf('messageb') > -1 ){
              var data = {
                  id: 'messageb',
                  msg: record.Sns.Message,
                  // info: body,
                };
            }
            validateInput(data)
                .then(getTopic)
                .then(validateTopic)
                .then(notify)
                .then(function(result) {
                    debug('ok ' + JSON.stringify(result));
                    // context.done(null, result);
                    callback();
                })
                .error(function(error) {
                    debug('error ' + JSON.stringify(error));
                    // context.done(error, null);
                    callback(error);
                });
        }else{
            callback();
        }

    }, function done(err, results) {
        context.done(err);
    });

};
