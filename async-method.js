var url = require('url');

var express = require('express');

var request = require('request');

var cheerio = require('cheerio');

var async = require('async');

var app = express();

app.set('views', './views');
app.set('view engine', 'jade');

function makeValidUrl(url) {
    // make the url proper if it has missing protocol and www
    if(url.indexOf('www') < 0) {
        url = 'www.'.concat(url);
    }
    if(url.indexOf('http://') < 0) {
        url = 'http://'.concat(url);
    }
    return url;
}

function makeRequest(address, callback) {
    var proper_address = makeValidUrl(address);
    request(proper_address, function (error, response, html) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
            callback(null, {
                value: $('title').text(),
                address: address
            });
        } else {
            callback(null, {
                value: 'NO RESPONSE',
                address: address
            });
        }
    });
}

app.get('/I/want/title', function(req, res) {
    var functions = [];
    var addresses = req.query['address'];
    if(typeof addresses !== "undefined") {
        // check if no address is given
        if(Array.isArray(addresses)) {
            // multiple addresses come as array from req.query

            async.each(addresses, function(address, callback) {
                functions.push(function(callback) {
                    makeRequest(address, callback);
                });
            });
        } else {
            // single address come as an object from req.query
            functions.push(function(callback) {
                makeRequest(addresses, callback);
            })
        }
        async.parallel(functions,function(err, results){
            res.render('title', {
                titles: results
            });
        });
    } else {
        res.render('title');
    }
});

app.use(function(req, res, next) {
    var err = new Error('Page Not Found');
    err.status = 404;
    next(err);
});

app.listen(4040);