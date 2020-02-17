const util = require("/lib/util");
const linkedinLib = require("/lib/linkedin");
const logf = util.log;

exports.get = function (req) {    

    let stateIndex = linkedinLib.getStateIndex(req.params.state);

    if (stateIndex > -1) {
        linkedinLib.removeState(stateIndex);
        logf(req.params);

        

    }
    else {
        //State not matching return unauthorized
        logf(req);
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

function getAccessToken() {
    const httpLib = require('/lib/http-client');
}