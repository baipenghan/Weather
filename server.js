var express = require('express');
var request = require('request');
var async = require('async');
var app = express();
var port = process.env.PORT || 8080;
var router = express.Router();

//A http request for the weather data on a single city
function singleRequest(place){
    var urlBase = 'http://api.wunderground.com/api/9845dd95c641c00a/conditions/q/';
    var asyncRequest = function(callback) {
       var url = urlBase + place + '.json';
       request(url, function(err, response, body) {
           if (!err && response.statusCode == 200) {
               var info = JSON.parse(body);
               if ('error' in info['response'] === false){
                   callback(null, {location: info['current_observation']['display_location']['full'],
                                    temp: info['current_observation']['temperature_string']});
               }
               else{
                   callback(null, null);
               }
           }
           else{
               callback(true);
           }
         });
   };
   return asyncRequest;
}

// route middleware that will happen on every request, before a request is processed, output the arguments to the console
router.use(function(req, res, next) {
    for (var para in req.query){
        console.log('%s = %s', para, req.query[para]);
    }
	next();
});

router.get('/weather', function(req, res){
    //input which cities we want to query
    var places = ['CA/Campbell', 'NE/Omaha', 'TX/Austin', 'MD/Timonium'];
    // A list that contains all function objects, each of which represents for a http request for a city
    var asyncFunctions = [];

    for (var i = 0; i < places.length; i++){
        var place = places[i];
        asyncFunctions.push(singleRequest(place));
    }

    //Send every request for each city in parallel, and wait until all the responses end.
    async.parallel(asyncFunctions, function(err, results){
        var html = '<!DOCTYPE html><html><body><table><tr><td>Location</td><td>Temperature</td><tr>';
        for (var i = 0; i < results.length; i++){
            data = results[i];
            if (data != null){
                html += '<tr><td>' + data.location + '</td><td>' + data.temp + '</td></tr>';
            }
        }
        html += '</table></body></html>';
        res.send(html);
    });
});

app.use(router);
app.listen(port);
