const facebookLib = require("/lib/facebook");
const portal = require("/lib/xp/portal");
const util = require("/lib/util");
const logf = util.log;

// Service to authenticate the user
exports.get = function(req) {
    if (req.params && req.params.error == undefined) {
        let stateIndex = facebookLib.getStateIndex(req.params.state);

        if (stateIndex > -1) {
            facebookLib.removeStateIndex(stateIndex);

            let authService = portal.serviceUrl({
                service: "facebook-authorize",
                type: "absolute"
            });

            let request = facebookLib.exchangeAuthCode(
                req.params.code,
                authService
            );

            let data = JSON.parse(request.body);
            let repo = facebookLib.getRepo();

            /* Saving the access token before we have the userid can "brick" the authentication process.
             Preferably save the access token with userid or not at all */
            let accessNode = facebookLib.saveAccessToken(repo, data);
            if (accessNode == null || accessNode == undefined) {
                serverError("Could not save facebook accesstoken");
            }

            //TODO get page/organization to post for
        } else {
            return notAuthorized("Invalid state or state not found facebook");
        }
    } else {
        return notAuthorized(`${req.params}`);
    }

    log.info("Facebook authorized");
    //Saved to repo
    return {
        status: 200,
        body: "Facebook authorized"
    };
};

function notAuthorized(message) {
    log.info(message);
    return {
        status: 400,
        body: "Could not authorize facebook"
    };
}

function serverError(message) {
    log.info(message);
    return {
        status: 500,
        body: "Server error, api error"
    };
}
