/*
 * Sample node.js code for AWS Lambda to upload the JSON documents
 * pushed from Kinesis to Amazon Elasticsearch.
 *
 *
 * Copyright 2015- Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at http://aws.amazon.com/asl/
 * or in the "license" file accompanying this file.  This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * express or implied.  See the License for the specific language governing
 * permissions and limitations under the License.
 */

/* == Imports == */
var AWS = require('aws-sdk');
var path = require('path');
var async = require('async');

/* == Globals == */
var esDomain = {
    region: process.env.SERVERLESS_REGION,
    endpoint: process.env.ELASTICSEARCH_ENDPOINT,
    index: process.env.ELASTICSEARCH_INDEX,
    doctype: process.env.ELASTICSEARCH_DOCTYPE
};
var endpoint = new AWS.Endpoint(esDomain.endpoint);
/*
 * The AWS credentials are picked up from the environment.
 * They belong to the IAM role assigned to the Lambda function.
 * Since the ES requests are signed using these credentials,
 * make sure to apply a policy that allows ES domain operations
 * to the role.
 */
var creds = new AWS.EnvironmentCredentials('AWS');


/* Lambda "main": Execution begins here */
module.exports.handler = function(event, context) {
    console.log(JSON.stringify(event, null, '  '));
    async.eachSeries(event.Records, function iterator(record, callback) {
        if (record.eventName=='INSERT'){
            // var jsonDoc = new Buffer(record.kinesis.data, 'base64');
            var jsonDoc = JSON.parse(record.dynamodb.NewImage.info.S);
            if (jsonDoc.Cantidad > 0){
                console.log(jsonDoc.Listado[0]);
                var doc = jsonDoc.Listado[0];
                doc['@timestamp']=jsonDoc.FechaCreacion;
                var serializedRecord = JSON.stringify(doc);
                console.log(serializedRecord);
                postToES(serializedRecord.toString(), callback);
            }else{
                callback(null, 'Lambda INSERT Cantidad no > 0');
            }
        }else{
            callback(null, 'Lambda no INSERT');
        }
    }, function done(err, results) {
        context.done(err, results);
    });
}


/*
 * Post the given document to Elasticsearch
 */
function postToES(doc, callback) {
    var req = new AWS.HttpRequest(endpoint);

    req.method = 'POST';
    req.path = path.join('/', esDomain.index, esDomain.doctype);
    req.region = esDomain.region;
    req.headers['presigned-expires'] = false;
    req.headers['Host'] = endpoint.host;
    req.body = doc;

    var signer = new AWS.Signers.V4(req , 'es');  // es: service code
    signer.addAuthorization(creds, new Date());

    var send = new AWS.NodeHttpClient();
    send.handleRequest(req, null, function(httpResp) {
        var respBody = '';
        httpResp.on('data', function (chunk) {
            respBody += chunk;
        });
        httpResp.on('end', function (chunk) {
            console.log('Response: ' + respBody);
            callback(null, 'Lambda added document ' + doc);
        });
    }, function(err) {
        console.log('Error: ' + err);
        callback(err, 'Lambda failed with error ' + err);
    });
}