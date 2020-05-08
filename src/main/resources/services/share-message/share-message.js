const util = require('/lib/util');
const facebook = require('/lib/facebook');
const linkedin = require('/lib/linkedin');
const twitter = require('/lib/twitter');

const logf = util.log;

exports.post = function (req) {

    if (req.body) {
        log.info(req.body);
        let body = JSON.parse(req.body);
        let message = body.message;
        if (message != undefined && message != "") {
            switch (body.platform) {
                case "twitter":
                    return twitter.sendMessage(message);
                case "linkedin": {
                    let repo = linkedin.getRepo();
                    let token = linkedin.getAccessToken(repo);
                    return linkedin.sendMessage(token, message);
                }
                case "facebook": {
                    return facebook.postPageMessage(message);
                }
                default:
                    log.info(`Share-messsage.js: No platform found with name: ${body.platform}`);
                    break;
            }
        }
        log.info("Share-message.js: No message was included");
        return {
            status: 400,
        };
    }
    log.info("Share-message.js: header malformed");
    return {
        status: 400,
    };
};