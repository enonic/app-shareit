const linkedinLib = require("/lib/linkedin");
const portal = require("/lib/xp/portal");
const util = require("/lib/util");
const logf = util.log;

// Service to authenticate the user
// Also requests the user id from linkedin (URN)
exports.get = function (req) {
    if ( req.params.error != undefined) {
        logf(req);
        return notAuthorized('Error returned from linkedin');
    }

    let stateIndex = linkedinLib.getStateIndex(req.params.state);

    if (stateIndex < -1) {
        return notAuthorized(`Invalid or not found state`);
    }

    linkedinLib.removeStateIndex(stateIndex);

    let authService = portal.serviceUrl({
        service: "linkedin-authorize",
        type: "absolute",
    });

    let request = linkedinLib.exchangeAuthCode(req.params.code, authService);
    let accessTokenData = JSON.parse(request.body);
    let repo = linkedinLib.getRepo();
    let accessToken = accessTokenData.access_token;

    //TODO lookup and save organization id
    let node = linkedinLib.saveOrganizationIdByName("devtestco", accessToken);
    if (node == null) {
        return notAuthorized("Could not save organization id");
    }

    //Cant save access token before organization lookup since it can fail.
    //Authentication is successful if the accessToken gets saved
    let accessNode = linkedinLib.saveAccessToken(repo, accessTokenData);
    if (accessNode == null || accessNode == undefined) {
        return serverError("Could not save accesstoken");
    }

    log.info("Linkedin authorized");

    return {
        status: 200,
        body: "Application authorized",
    };
};

function notAuthorized(message) {
    log.info(message);
    return {
        status: 400,
        body: "Could not authorize the app",
    };
}

function serverError(message) {
    log.info(message);
    return {
        status: 500,
        body: "Server error, api error",
    };
}
