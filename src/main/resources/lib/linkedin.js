const encoding = require('/lib/text-encoding');
const httpLib = require('/lib/http-client');
const node = require('/lib/xp/node');
const repo = require('/lib/xp/repo');
const shareTool = require('/lib/share-tool');
const util = require('/lib/util');
const logf = util.log;

//Global Authentication states
var states = [];

exports.addState = function (state) {
    if (states.length >= 10) {
        states.shift(); //remove first
    }
    states.push(state);
};

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

//Exchanges a authorization code for a 
exports.exchangeAuthCode = function (code) {

    let site = libContent.getSite({ key: content._id });
    let pathAppend = content._path.replace(site._path, "");

    //prepend siteconfig.domain
    let url = siteConfig.domain + '' + pathAppend;

    httpLib.request({
        url: "https://www.linkedin.com/oauth/v2/accessToken",
        method: "POST",
        contentType: "x-www-form-urlencoded",
        params: {
            code: code,
            redirectUri
        },
        client_id: app.config['linkedin.client_id'],
        client_secret: app.config['linkedin.client_secret'],
    });
};

//removes the given index
exports.removeState = function (index) {
    states.splice(index, 1);
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
 * Returns a connect to app storage
 * @returns {RepoConnection} 
 */
exports.getRepo = function () {
    return node.connect({
        repoId: 'com.enonic.app.shareit',
        branch: 'master',
        //Principals: current user
    });
};

exports.saveAuthCode = function (repo, state) {

};

// Checks storrage if auth exists
exports.getAuthCode = function (repoCon, state) {

};

// Deletes the current auth from app storage
exports.deleteAuthcode = function (repoCon, state) {

};

// Creates all thymeleaf variables for linkedin
exports.createAuthenticationUrl = function () {
    let authService = portal.serviceUrl({
        service: "linkedin-authorize",
        type: "absolute",
    });

    let redirect = encodeURIComponent(authService);
    let randomString = shareTool.genRandomString(30);
    linkedinLib.addState(randomString);

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

    return {
        authpage: authpage,
    };
};