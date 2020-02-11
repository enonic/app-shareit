//Import all social platforms here
var util = require("/lib/util");
var twitter = require("/lib/twitter");

var logf = util.log;

exports.get = function(req) {
    logf(req.params);

    if (req.body && req.body) {
        let body = JSON.parse(req.body);
        if (body.twitter) {
            twitter.sendMessage(body.twitter);
        }
    }
};