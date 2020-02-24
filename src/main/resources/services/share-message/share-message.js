//Import all social platforms here
var util = require("/lib/util");
var twitter = require("/lib/twitter");
const linkedin = require('/lib/linkedin');

var logf = util.log;

exports.post = function (req) {

    if (req.body) {
        let body = JSON.parse(req.body);
        let message = body.message;
        if (message != undefined && message != "") {
            switch (body.platform) {
                case "twitter":
                    return twitter.sendMessage(message);
                case "linkedin":
                    let repo = linkedin.getRepo();
                    let token = linkedin.getAccessToken(repo);
                    return linkedin.sendMessage(token, message);
                default:
                    logf(`No platform found with name: ${body.platform}`);
                    break;
            }
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