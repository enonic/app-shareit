const linkedinLib = require("/lib/linkedin");
const portal = require('/lib/xp/portal');
const util = require("/lib/util");
const logf = util.log;

// Service to authenticate the user
// Also requests the user id from linkedin (URN)
exports.get = function (req) {
    if (req.params && req.params.error == undefined) {
        let stateIndex = linkedinLib.getStateIndex(req.params.state);

        if (stateIndex > -1) {
            linkedinLib.removeStateIndex(stateIndex);

            let authService = portal.serviceUrl({
                service: "linkedin-authorize",
                type: "absolute",
            });

            let request = linkedinLib.exchangeAuthCode(req.params.code, authService);
            let data = JSON.parse(request.body);
            let repo = linkedinLib.getRepo();
            
            /* Saving the access token before we have the userid can "brick" the authentication process.
             Preferably save the access token with userid or not at all */
            let accessNode = linkedinLib.saveAccessToken(repo, data);
            if (accessNode == null || accessNode == undefined) {
                serverError("Could not save accesstoken");
            }

            //Fetch and save userID
            let userId = linkedinLib.requestUserId(accessNode.token);
            if (userId == null) {
                serverError("Could not get person id from linkedin api");
            }

            //Save user id
            let useridNode = linkedinLib.saveUserId(repo, userId);
            if (useridNode == null) {
                serverError("Could not save the userid");
            }

            //TODO get page/organization to post for

        } else {
            return notAuthorized("Invalid state or state not found");
        }
    } else {
        return notAuthorized(`${req.params.error_description}`);
    }

    log.info("Linkedin authorized");
    //Saved to repo
    return {
        status: 200,
        body: "Application authorized"
    };
};

function notAuthorized(message) {
    log.info(message);
    return {
        status: 400,
        body: "Could not authorize the app"
    };
}

function serverError(message) {
    log.info(message);
    return {
        status: 500,
        body: "Server error, api error"
    };
}
