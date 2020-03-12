const httpLib = require("/lib/http-client");
const node = require("/lib/xp/node");
const portal = require("/lib/xp/portal");
const shareTool = require("/lib/share-tool");
const util = require("/lib/util");
const logf = util.log;

// Creates the authorization 
exports.createAuthenticationUrl = function () {
    let authService = portal.serviceUrl({
        service: "facebook-authorize",
        type: "absolute",
    });

    let redirect = encodeURIComponent(authService);
    let stateValue = "{id, name, email}";

    let authpage = shareTool.createUrl(
        "https://www.facebook.com/v6.0/dialog/oauth",
        [
            { key: "client_id", value: app.config['facebook.client_id'] },
            { key: "redirect_uri", value: "{"+redirect+"}" },
            { key: "state", value: stateValue },
        ]
    );

    return authpage;
};