const util = require("/lib/util");
const facebook = require("/lib/facebook");
const contentLib = require("/lib/xp/content");
const linkedin = require("/lib/linkedin");
const twitter = require("/lib/twitter");

const logf = util.log;

exports.post = function (req) {
    if (req.body) {
        let body = JSON.parse(req.body);
        let message = body.message;
        let pageId = body.pageId;
        let siteName = null;
        if (pageId) {
            siteName = contentLib.get({ key: pageId })._name;
        }

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
                    logf(pageId);
                    return facebook.postPageMessage(message, siteName);
                }
                default:
                    log.info(
                        `Share-messsage.js: No platform found with name: ${body.platform}`
                    );
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
