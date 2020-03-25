const httpLib = require("/lib/http-client");
const portal = require("/lib/xp/portal");
const shareTool = require("/lib/share-tool");
const util = require("/lib/util");
const logf = util.log;

//Global variable state
//Scoped to each file by design, so they don't mix
var states = [];

/* ## State functions */
exports.addState = addState;
function addState(state) {
    if (states.length >= 10) {
        states.shift(); //remove first
    }
    states.push(state);
}

//returns the index of the state or -1
exports.getStateIndex = function(state) {
    for (let i = 0; states.length > i; i++) {
        if (states[i] == state) {
            return i;
        }
    }

    return -1;
};

// removes locally storred state
exports.removeStateIndex = function(index) {
    states.splice(index, 1);
};

// Lazy binding so getRepo works in all libs
exports.getRepo = shareTool.getRepo;

/* ## User id */
exports.saveUserid = function(repo, id) {
    //Attempt to destory the old node
    repo.delete("/facebook/userid");

    let userNode = repo.create({
        _name: "userid",
        _parentPath: "/facebook",
        userId: id
    });

    if (userNode == undefined || userNode == null) {
        return null;
    }

    return userNode;
};

exports.getUserid = getUserid;
function getUserid(repo) {
    if (repo == undefined) {
        repo = shareTool.getRepo();
    }
    let node = repo.get("/facebook/userid");
    if (node == null || node.userId == undefined) {
        return null;
    } else {
        return node.userId;
    }
}

exports.savePageid = function(id) {
    //Attempt to destory the old node
    repo.delete("/facebook/pageid");

    let pageNode = repo.create({
        _name: "pageid",
        _parentPath: "/facebook",
        pageid: id
    });

    if (pageNode == undefined || pageNode == null) {
        return null;
    }

    return pageNode.pageid;
};

exports.getPageid = function(repo) {
    if (repo == undefined) {
        repo = shareTool.getRepo();
    }
    let node = repo.get("/facebook/pageid");
    if (node == null || node.pageid == undefined) {
        return null;
    } else {
        return node.pageid;
    }
};

/* ## AccessTokens */
exports.saveAccessToken = saveAccessToken;
function saveAccessToken(repo, data) {
    let token = data.access_token;
    //Expire is in seconds need to be in miliseconds.
    //Adding miliseconds onto getTime. (Will be off by request time)
    let expireUtc = new Date().getTime() + data.expires_in * 1000;

    //Attempt to destory the old node
    repo.delete("/facebook/accesstoken");
    let expireDate = new Date();
    expireDate.setTime(expireUtc);

    let accessNode = repo.create({
        _name: "accesstoken",
        _parentPath: "/facebook",
        token,
        expireUtc
    });

    if (accessNode == undefined || accessNode == null) {
        return null;
    }

    return accessNode;
}

//Checks to see if the current access token is valid
exports.checkAccessToken = function(repo) {
    if (repo == undefined) {
        repo = shareTool.getRepo();
    }
    let node = repo.get("/facebook/accesstoken");
    if (node != null && node.token) {
        return true;
    }

    return false;
};

exports.getAccessToken = getAccessToken;
function getAccessToken(repo) {
    let node = repo.get("/facebook/accesstoken");
    if (node == null || !node.token) {
        return null;
    }

    return node.token;
}

// ## General
/**
 * Makes a request to get accesstoken from linkedin.
 * @param {String} code authorization code
 * @param {String} redirect redirect url used in the request
 * @returns {Object} request if the exchange call
 */
exports.exchangeAuthCode = function(code, redirect) {
    let response = httpLib.request({
        url: " https://graph.facebook.com/v6.0/oauth/access_token",
        method: "GET",
        params: {
            code: code,
            redirect_uri: redirect,
            client_id: app.config["facebook.client_id"],
            client_secret: app.config["facebook.client_secret"]
        }
    });

    return response;
};

// Could create this into a shared function
// Switch case each one? or service, state params, clientid
// Creates the authorization
exports.createAuthenticationUrl = function() {
    let authService = portal.serviceUrl({
        service: "facebook-authorize",
        type: "absolute"
    });

    let redirect = encodeURIComponent(authService);
    let randomString = shareTool.genRandomString(30);
    addState(randomString);
    let scope = encodeURIComponent("manage_pages publish_pages");

    let authpage = shareTool.createUrl(
        "https://www.facebook.com/v6.0/dialog/oauth",
        [
            { key: "response_type", value: "code" },
            { key: "client_id", value: app.config["facebook.client_id"] },
            { key: "redirect_uri", value: redirect },
            { key: "state", value: randomString },
            { key: "scope", value: scope }
        ]
    );

    return authpage;
};
