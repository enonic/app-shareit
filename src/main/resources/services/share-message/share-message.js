//Import all social platforms here
var util = require("/lib/util");
var twitter = require("/lib/twitter");

var logf = util.log;

exports.post = function (req) {

    if (req.body) {
        let body = JSON.parse(req.body);
        if (body.message != undefined) {
            if (body.platform == "twitter" && body.message) {
                return twitter.sendMessage(body.message);
            }
            //Linkedin
            /* if (body.linkedin) {
                return api.sendMessage(body);  
            } */
        }
        return {
            status: 400,
            message: "No message was included",
        };
    }

    return {
        status: 400,
        message: "Share message service: header malformed"
    };
};