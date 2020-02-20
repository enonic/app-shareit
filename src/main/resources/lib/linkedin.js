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
    logf(states);
    for (let i = 0; states.length > i; i++) {
        if (states[i] == state) {
            return i;
        }
    }

    return -1;
};

//removes the given index
exports.removeStateIndex = function (index) {
    states.splice(index, 1);
};

/* ## AccessTokens */
exports.saveAccessToken = saveAccessToken;
function saveAccessToken(repo, token, expires_in) {
    repo.create({
        _name: "token",
        _parentPath: "/linkedin/accesstoken",
        token: token,
        expires_in,
    });
}

exports.getAccessToken = function (repo) {
    let tokenNode = repo.get("/linkedin/accesstoken");
    if (tokenNode.id != undefined) {
        return null;
    }
    return tokenNode.token;
};

// ## General
//Exchanges a authorization code for a access token
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

    log.info("access header");
    logf(request);

    if (request.status == 200) {
        let data = JSON.parse(request.body);
        logf(data.access_token);
        logf(data.expires_in);
        let storrage = getRepo();
        saveAccessToken(storrage, data.access_token, data.expires_in);
    } else {
        return request;
    }
};

// OAth2 send message
exports.sendMessage = function () {
    //TODO
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

// Creates all thymeleaf variables for linkedin
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