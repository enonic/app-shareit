const httpLib = require("/lib/http-client");
const portal = require("/lib/xp/portal");
const toolsLib = require("/lib/tools");
// const contextLib = require("/lib/xp/context");
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
exports.getKeyIndex = function (key) {
    for (let i = 0; states.length > i; i++) {
        if (states[i] == key) {
            return i;
        }
    }

    return -1;
};

// removes locally storred state
exports.removeStateIndex = function (index) {
    states.splice(index, 1);
};

// Lazy binding so getRepo works in all libs
exports.getRepo = toolsLib.getRepo;

/* ## User id */
/* exports.saveUserid = function (repo, id) {
    //Attempt to destory the old node
    repo.delete("/facebook/userid");

    let userNode = repo.create({
        _name: "userid",
        _parentPath: "/facebook",
        userId: id,
    });

    if (userNode == undefined || userNode == null) {
        return null;
    }

    return userNode;
}; */

/* exports.getUserid = getUserid;
function getUserid(repo) {
    if (repo == undefined) {
        repo = toolsLib.getRepo();
    }
    let node = repo.get("/facebook/userid");
    if (node == null || node.userId == undefined) {
        return null;
    } else {
        return node.userId;
    }
} */

// Saves all page data needed for the facebook api
exports.savePageData = function (repo, sitename, data) {
    toolsLib.createSiteRepo(repo, sitename);
    //Attempt to destory the old node
    repo.delete(`/${sitename}/facebook`);

    if (
        data.id == "undefined" ||
        data.token == "undefined" ||
        data.name == "undefined"
    ) {
        throw "Data parameter missing on create page node";
    }

    let pageNode = repo.create({
        _name: "facebook",
        _parentPath: `/${sitename}`,
        pageId: data.id,
        token: data.token,
        name: data.name,
    });

    if (pageNode == undefined || pageNode == null) {
        return null;
    }

    return pageNode;
};

exports.getPageData = getPageData;
function getPageData(repo, sitename) {
    let node = repo.get(`/${sitename}/facebook`);

    if (node == false) {
        return null;
    }

    return {
        pageId: node.pageId,
        token: node.token,
        name: node.name,
    };
}

// check if facebook page is authenticated or not
// TODO probablity just check for pagetoken
exports.isAuthenticated = function (siteName, repo) {
    if (repo == undefined) {
        repo = toolsLib.getRepo();
    }
    let facebookNode = repo.exists(`/${siteName}/facebook`);
    if (facebookNode == false) {
        return false;
    }
    let pageNode = getPageData(repo, siteName);
    if (pageNode && pageNode.token) {
        return true;
    } else {
        return false;
    }
};

/* ## AccessTokens */
// user access token, should be renames
/* exports.createUserToken = createUserToken;
function createUserToken(repo, token) {
    //Attempt to destory the old node
    repo.delete("/facebook/userToken");

    let accessNode = repo.create({
        _name: "userToken",
        _parentPath: "/facebook",
        token
    });

    if (accessNode == undefined || accessNode == null) {
        return null;
    }

    return accessNode;
} */

//Checks to see if the current access token is valid
// ## user access token
/* exports.getUserToken = getUserToken;
function getUserToken(repo) {
    let node = repo.get("/facebook/userToken");
    if (node == null || !node.token) {
        return null;
    }

    // Its only used to create page token.
    // Can be two steps so needs to be saved.
    repo.delete("/facebook/userToken");

    return node.token;
} */

// ## General
/**
 * Makes a request to get accesstoken from facebook.
 * @param {String} code authorization code
 * @param {String} redirect redirect url used in the request
 * @returns {Object} request if the exchange call
 */
exports.exchangeAuthCode = function (code, redirect, siteConfig) {
    let response = httpLib.request({
        url: " https://graph.facebook.com/v6.0/oauth/access_token",
        method: "GET",
        params: {
            code: code,
            redirect_uri: redirect,
            client_id: siteConfig.facebook.app_id,
            client_secret: siteConfig.facebook.app_secret,
        },
    });

    return response;
};

/**
 * Post on a facebook feed with given message
 */
exports.postPageMessage = function (message, siteName) {
    const repo = toolsLib.getRepo();
    const data = getPageData(repo, siteName);
    const pageId = data.pageId;
    const pageToken = data.token;

    const response = httpLib.request({
        method: "POST",
        url: `https://graph.facebook.com/${pageId}/feed`,
        params: {
            message: message,
            access_token: pageToken,
        },
    });

    let postid = JSON.parse(response.body).id;

    if (!postid) {
        log.info("Could not find id");
        return {
            status: 500,
            message: "Error facebook lib",
        };
    }

    const postDataResponse = httpLib.request({
        method: "GET",
        url: `https://graph.facebook.com/${postid}/`,
        params: {
            fields: "permalink_url",
            message: message,
            access_token: pageToken,
        },
    });

    let permalink = JSON.parse(postDataResponse.body).permalink_url;

    if (permalink) {
        return {
            status: 201,
            body: JSON.stringify({
                url: permalink,
            }),
        };
    } else {
        log.info("Could not get permalink, message was still created!");
        return {
            status: 500,
            message: "Error facebook lib",
        };
    }
};

// The url that the user needs to login and approve
exports.createAuthenticationUrl = function (siteId, siteConfig) {
    let authService = portal.serviceUrl({
        service: "facebook-authorize",
        type: "absolute",
    });

    let pageId = siteConfig ? siteConfig.pageId : "";

    if (pageId == "" || pageId == undefined) {
        return null;
    }

    let redirect = encodeURIComponent(authService);
    let randomString = toolsLib.genRandomString(30);
    addState(randomString);
    let scope = encodeURIComponent("manage_pages publish_pages");
    let states = JSON.stringify({
        state: randomString,
        siteId: siteId,
    });

    logf(siteConfig);

    let authpage = toolsLib.createUrl(
        "https://www.facebook.com/v6.0/dialog/oauth",
        [
            { key: "response_type", value: "code" },
            { key: "client_id", value: siteConfig.facebook.app_id },
            { key: "redirect_uri", value: redirect },
            { key: "state", value: states },
            { key: "scope", value: scope },
        ]
    );

    return authpage;
};
