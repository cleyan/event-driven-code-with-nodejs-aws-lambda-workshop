'use strict';

console.log('Loading function');
var AWS = require("aws-sdk");
var kinesis = new AWS.Kinesis();
var async = require('async');
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
    var list = {
      id: data.id,
      // created:  moment().unix().toString(),
      // updated:  moment().unix().toString(),
      // info: data.info,
    }
    resolve(list);
  });
}

var storeList = function(list) {
  debug('Saving ' + JSON.stringify(list));
  return dynamodb.putItemAsync({
    TableName: process.env.DETAILS_UNIQUE_TABLE,
    Item: {
      id:     { S: list.id },
      // created:  { S: list.created },
      // updated:  { S: list.updated },
      // info: { S: list.info },
    },
    // ConditionExpression: 'attribute_not_exists (id)'
  });
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
                .then(createList)
                .then(storeList)
                .then(function(result) {
                    // context.done(null, result);
                    callback();
                })
                .error(function(error) {
                    // context.done(error, null);
                    callback(error);
                });
            // var info = JSON.parse(record.dynamodb.NewImage.info.S);
            // var a = info.Listado;
            // while (a.length > 0)
            //     arrays.push(a.splice(0, size));

            // async.eachSeries(arrays, function iterator(array, callback) {
            //     var params = { StreamName: 'detail' };
            //     params.Records = [];
            //     array.forEach(function(item) {
            //         var record = {
            //             Data: JSON.stringify({ id: id, info: item}),
            //             PartitionKey: 'key_',
            //             };
            //         params.Records.push(record);
            //     });
            //     console.info(JSON.stringify(params, null, '  '));
            //     kinesis.putRecords(params, function (err, data) {
            //         if (err) return console.log(err);
            //         console.log(data);
            //         callback();
            //     });
            // }, function done(err, results) {
                // callback();
            // });
        }else{
            callback();
        }

    }, function done(err, results) {
        context.done(err);
    });

};
