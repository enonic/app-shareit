const facebookLib = require("/lib/facebook");
const portal = require("/lib/xp/portal");
const util = require("/lib/util");
const logf = util.log;
const thymeleaf = require("/lib/thymeleaf");

const page = resolve("index.html");

// Service to authenticate the user
exports.get = function(req) {
    let repo = facebookLib.getRepo();

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

            /* Saving the access token before we have the userid can "brick" the authentication process.
             Preferably save the access token with userid or not at all */
            const accessNode = facebookLib.saveAccessToken(repo, data);
            const accesstoken = facebookLib.getAccessToken(repo);
            if (accessNode == null || accessNode == undefined) {
                serverError("Could not save facebook accesstoken");
            }

            const httpLib = require("/lib/http-client");
            let useridRes = httpLib.request({
                method: "GET",
                url: "https://graph.facebook.com/me",
                params: {
                    fields: "id",
                    access_token: accesstoken
                }
            });

            const resData = JSON.parse(useridRes.body);
            facebookLib.saveUserid(repo, resData.id);
            if (resData.id) serverError("Could not get user id");

        } else {
            return notAuthorized("Invalid state or state not found facebook");
        }
    } else {
        logf(req.params);
        return notAuthorized("");
    }

    //Debug section
    const accesstoken = facebookLib.getAccessToken(repo);

    logf(resData);

    let userid = facebookLib.getUserid(repo);

    let account = httpLib.request({
        method: "GET",
        url: `https://graph.facebook.com/${userid}/accounts`,
        params: {
            access_token: accesstoken
        }
    });

    logf("Accounts: ");
    logf(useraccounts);

    let model = {
        message: "Facebook authorized",
        pages: account.data
    };

    //If everything is sucessful, render the pages choise
    //Don't know how to handle multiple pages
    return {
        body: thymeleaf.render(view, model)
    };
};

exports.post = function(req) {
    if (req.params.pageid){
        //test page id (Should sanitize it so it does not contain "/" or "?" and other mischief )
    } else {

    }
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
