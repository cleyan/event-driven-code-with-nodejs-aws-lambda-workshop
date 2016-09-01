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
        topicARN: process.env.DETECTOR_TOPIC_ARN
    }
}

var validateInput = function(data) {
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
      console.log('Sending notification ' + data.id)
      var message = "message " + data.id;
      var task = sendNotification(message, FILTER_CONFIG.sns.topicARN, '');
      return task;
}

module.exports.handler = function(event, context) {
    console.info(JSON.stringify(event, null, '  '));

    async.eachSeries(event.Records, function iterator(record, callback) {
        if (record.eventName=='INSERT'){
            // var arrays = [];
            // var size = 500;

            var id = record.dynamodb.Keys.id.S;
            console.log(id);
            var data = {
                id: id,
                // info: body,
              };
            validateInput(data)
                .then(notify)
                .then(function(result) {
                    // context.done(null, result);
                    callback();
                })
                .error(function(error) {
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
