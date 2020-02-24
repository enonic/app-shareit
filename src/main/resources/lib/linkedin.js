const httpLib = require('/lib/http-client');
const node = require('/lib/xp/node');
const portal = require('/lib/xp/portal');
const shareTool = require('/lib/share-tool');
const util = require('/lib/util');
const logf = util.log;

//Global Authentication states
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
exports.getStateIndex = function (state) {
    for (let i = 0; states.length > i; i++) {
        if (states[i] == state) {
            return i;
        }
    }

    return -1;
};

// removes locally storred state
exports.removeStateIndex = function (index) {
    states.splice(index, 1);
};

/* ## AccessTokens */
exports.saveAccessToken = saveAccessToken;
function saveAccessToken(repo, data) {
    let token;
    token = data.token;
    //Expire is in seconds need to be in miliseconds.
    //Adding miliseconds onto getTime. (Will be off by request time)
    let expireUtc = new Date().getTime() + (data.expires_in * 1000);

    //Attempt to destory the old node
    repo.delete("/linkedin/accesstoken");
    let expireDate = new Date();
    expireDate.setTime(expireUtc);
    logf(`Now: ${new Date().toLocaleDateString()} \n Expire: ${expireDate.toLocaleDateString()}`);

    let accessToken = repo.create({
        _name: "accesstoken",
        _parentPath: "/linkedin",
        token: token,
        expireUtc,
    });

    if (accessToken == undefined || accessToken == null) {
        return null;
    }

    return accessToken;
}

//Checks to see if the current access token is valid
exports.checkAccessToken = function (repo) {
    if (repo == undefined) {
        repo = getRepo();
    }
    let token = getAccessToken(repo);
    if (token != null) {
        //Adding 10 sec so token is refreshed when getting close to expire.
        let todayUtc = new Date().getTime() - 10 * 1000;

        if (token.expireUtc > todayUtc) {
            return true;
        }
    }

    return false;
};

exports.getAccessToken = getAccessToken;
function getAccessToken(repo) {
    return repo.get("/linkedin/accesstoken");
}

// ## General
/**
 * Makes a request to get accesstoken from linkedin. 
 * @param {String} code authorization code
 * @param {String} redirect redirect url used in the request
 * @returns {Object} request if the exchange call
 */
exports.exchangeAuthCode = function (code, redirect) {

    let request = httpLib.request({
        url: "https://www.linkedin.com/oauth/v2/accessToken",
        method: "POST",
        contentType: "x-www-form-urlencoded",
        params: {
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirect,
            client_id: app.config['linkedin.client_id'],
            client_secret: app.config['linkedin.client_secret'],
        }
    });

    return request;
};

// Uses the linkedin api to post a message to the feed of the user/organization
exports.sendMessage = function (token, message) {
    
    let postBody = {
        author: "urn:li:organization:37831266",
        //clientApplication: "{App urn} 77urker4nda4ef"
        lifecycleState: "PUBLISHED",
        specificContent: {
            "com.linkedin.ugc.ShareContent": {
                media: {
                    title: message.title,
                },
                shareCommentary: {
                    text: message.text,
                }
            }
        }
    };


    httpLib.request({
       url: "https://api.linkedin.com/v2/ugcPosts",
       contentType: "application/json",
       headers: {
            "X-Restli-Protocol-Version": "2.0.0",
           "Authorization": `Bearer ${token}`,
       },
       body: JSON.stringify(postBody),
    });
    
    return {
        status: 500,
        message: "linkedin WIP"
    };
};

/**
 * Returns connection to app storage
 * @returns {RepoConnection} 
 */
exports.getRepo = getRepo;
function getRepo() {
    return node.connect({
        repoId: 'com.enonic.app.shareit',
        branch: 'master',
        //Principals: current user
    });
}

// Creates the authorization 
exports.createAuthenticationUrl = function () {
    let authService = portal.serviceUrl({
        service: "linkedin-authorize",
        type: "absolute",
    });

    let redirect = encodeURIComponent(authService);
    let randomString = shareTool.genRandomString(30);
    addState(randomString);

    let scope = encodeURIComponent("w_member_social"); //r_liteprofile

    let authpage = shareTool.createUrl(
        "https://www.linkedin.com/oauth/v2/authorization",
        [
            { key: "response_type", value: "code" },
            { key: "client_id", value: app.config['linkedin.client_id'] },
            { key: "redirect_uri", value: redirect },
            { key: "state", value: randomString },
            { key: "scope", value: scope }
        ]
    );

    return authpage;
};