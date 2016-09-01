'use strict';

console.log('Loading function');
var AWS = require("aws-sdk");
var kinesis = new AWS.Kinesis();
var async = require('async');

module.exports.handler = function(event, context) {
    console.info(JSON.stringify(event, null, '  '));

    async.eachSeries(event.Records, function iterator(record, callback) {
        if (record.eventName=='INSERT'){
            var arrays = [];
            var size = 500;

            var id = record.dynamodb.NewImage.id.S;
            var info = JSON.parse(record.dynamodb.NewImage.info.S);
            var a = info.Listado;
            while (a.length > 0)
                arrays.push(a.splice(0, size));

            async.eachSeries(arrays, function iterator(array, callback) {
                var params = { StreamName: 'detail' };
                params.Records = [];
                array.forEach(function(item) {
                    var record = {
                        Data: JSON.stringify({ id: id, info: item}),
                        PartitionKey: 'key_',
                        };
                    params.Records.push(record);
                });
                console.info(JSON.stringify(params, null, '  '));
                kinesis.putRecords(params, function (err, data) {
                    if (err) {
                        console.log(err);
                    }else{
                        console.log(data);
                    }
                    callback(err);
                });
            }, function done(err, results) {
                callback(err);
            });
        }else{
            callback();
        }

    }, function done(err, results) {
        context.done(err);
    });

};
