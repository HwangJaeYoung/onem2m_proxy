var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var requestForRedirect = require('request');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

// Receiving the all method and url information from the oneM2MTester
app.all('*', function (request, response) {

    var targetURL = "http://localhost:7579" + request.url; // SUT target url
    var body = request.body;

    // Check body status
    if(Object.keys(body).length === 0 && body.constructor === Object) {
        body = null;
        console.log("GET, DELETE request have no body");
    } else {
        body = JSON.stringify(body);
    }

    // Headers handling
    var headerToJSON = JSON.stringify(request.headers);
    var headersJSONObject = JSON.parse(headerToJSON);
    var keys = Object.keys(headersJSONObject);
    var headersForSending = {};

    for(var i = 0; i < keys.length; i++) {
        var headerKey = keys[i];

        if(headerKey == 'accept' || headerKey == 'x-m2m-ri' || headerKey == 'x-m2m-origin' || headerKey == 'content-type')
            headersForSending[headerKey] = headersJSONObject[headerKey];
    }

    // Request to SUT such as Mobius
    requestForRedirect({
        url: targetURL,
        method: request.method,
        headers: headersForSending,
        body: body
    }, function (error, oneM2MResponse, body) {
        if(typeof(oneM2MResponse) !== 'undefined') {
            var statusCode = oneM2MResponse.statusCode;
            headerHandling(oneM2MResponse.headers, response);
            response.status(statusCode).send(oneM2MResponse.body);
        } else { // For example, Request Timeout
            if(error.code === 'ETIMEDOUT') // request timeout
                callBackForResponse(408);
        }
    });
});

function headerHandling(headers, response) {
    var headerToJSON = JSON.stringify(headers);
    var headersJSONObject = JSON.parse(headerToJSON);
    var keys = Object.keys(headersJSONObject);

    for(var i = 0; i < keys.length; i++) {
        var headerKey = keys[i];
        response.setHeader(headerKey.toUpperCase(), headersJSONObject[headerKey]);
    }
}

// Server start!!
http.globalAgent.maxSockets = 1000000;
http.createServer(app).listen({port: 62590, agent: false}, function () {
    console.log('Server running at http://localhost:62590');
});