var util = require("/lib/util");

var logf = util.log;

exports.get = function(req) {
    logf("Authorize return service:");
    logf(req);

    //Check state

    //Save to repo
    return {
        body: "<p>You can now post with linkedin!</p>",
    };
};