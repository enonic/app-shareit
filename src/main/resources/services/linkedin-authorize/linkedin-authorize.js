const linkedinLib = require("/lib/linkedin");
const portal = require('/lib/xp/portal');
const util = require("/lib/util");
const logf = util.log;

exports.get = function (req) {    

    let stateIndex = linkedinLib.getStateIndex(req.params.state);

    if (stateIndex > -1) {
        linkedinLib.removeStateIndex(stateIndex);

        let authService = portal.serviceUrl({
            service: "linkedin-authorize",
            type: "absolute",
        });
        
        let accessToken = linkedinLib.exchangeAuthCode(req.params.code, authService);
    }
    else {
        //State not matching return error
        return {
            status: 400,
            body: "Could not authorize the app"
        };
    }

    //Save to repo
    return {
        status: 200,
        body: "Application authorized"
    };
};