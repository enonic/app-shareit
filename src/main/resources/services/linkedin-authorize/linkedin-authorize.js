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
        
        let request = linkedinLib.exchangeAuthCode(req.params.code, authService);
        let data = JSON.parse(request.body);
        let storrage = linkedinLib.getRepo();
        let result = linkedinLib.saveAccessToken(storrage, data);
        if (result == null || result == undefined) {
            return {
                status: 500,
                body: "Could not save accesstoken"
            };
        }
    }
    else {
        //State not matching return error
        return {
            status: 400,
            body: "Could not authorize the app"
        };
    }

    //Saved to repo
    return {
        status: 200,
        body: "Application authorized"
    };
};