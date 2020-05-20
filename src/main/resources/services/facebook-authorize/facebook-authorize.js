const facebookLib = require("/lib/facebook");
const portal = require("/lib/xp/portal");
//const context = require("/lib/xp/context");
const contentLib = require("/lib/xp/content");
const util = require("/lib/util");
const logf = util.log;
const httpLib = require("/lib/http-client");

// Service to create the page token
exports.get = function (req) {
    const repo = facebookLib.getRepo();

    if (req.params && req.params.error != undefined) {
        logf(req.params);
        return notAuthorized("Facebook error returned");
    }

    const stateData = JSON.parse(req.params.state);
    let stateIndex = facebookLib.getKeyIndex(stateData.state);
    let siteId = stateData.siteId;

    if (stateIndex > -1) {
        facebookLib.removeStateIndex(stateIndex);
    } else {
        return notAuthorized("Invalid state or state not found facebook");
    }

    if (!siteId) {
        return notAuthorized("Missing pageId from state param");
    }

    let authService = portal.serviceUrl({
        service: "facebook-authorize",
        type: "absolute",
    });

    let site = contentLib.getSite({
        key: siteId,
    });

    let siteConfig;
    // tools function candidate
    let configs = site.data.siteConfig;
    for (let i = 0; i < configs.length; i++) {
        if (configs[i].applicationKey == app.name) {
            siteConfig = configs[i].config;
        }
    }

    // Get user access token
    let userTokenResponse = facebookLib.exchangeAuthCode(
        req.params.code,
        authService,
        siteConfig
    );

    if (checkFacebookResponse(userTokenResponse)) {
        return facebookError(
            userTokenResponse,
            "Could not get user access token"
        );
    }

    // Not saving the user token since its only used once (page token)
    let data = JSON.parse(userTokenResponse.body);
    const userToken = data.access_token;

    // Get user id
    let userIdRes = httpLib.request({
        method: "GET",
        url: "https://graph.facebook.com/me",
        params: {
            fields: "id",
            access_token: userToken,
        },
    });

    if (checkFacebookResponse(userIdRes)) {
        return facebookError(userIdRes, "Could not get user id");
    }

    const resData = JSON.parse(userIdRes.body);
    let userid = resData.id;

    // Get users linked permissions, accounts
    let userAccountsRes = httpLib.request({
        method: "GET",
        url: `https://graph.facebook.com/${userid}/accounts`,
        params: {
            access_token: userToken,
        },
    });

    if (checkFacebookResponse(userAccountsRes)) {
        return facebookError(userAccountsRes, "Could not get user accounts");
    }

    const accounts = JSON.parse(userAccountsRes.body);

    let responsePageData;

    for (let i = 0; accounts.data.length; i++) {
        if (accounts.data[i].id == siteConfig.facebook.page_id) {
            responsePageData = requestPageData(userToken, accounts.data[i].id);
            break;
        }
    }

    if (!responsePageData || responsePageData == null) {
        return notAuthorized("User needs correct access to the page");
    }

    // Save the data we need about the page
    let pageNode = facebookLib.savePageData(repo, site._name, {
        // Response gives the page token
        token: responsePageData.access_token,
        name: responsePageData.name,
        id: responsePageData.id,
    });

    log.info(`Facebook authorization: Can now post to ${pageNode.name}`);
    if (!pageNode) {
        return serverError("pageid could not be saved");
    }
    return {
        status: 200,
        body: `Facebook authorized. You can now post messages on the ${pageNode.name} facebookpage.`,
    };
};

/**
 * Request a page access token from facebook
 * Saves the page access token in app repo
 * @param {String} accesstoken UserAccess token
 * @param {NumericString} pageid pageid
 * @returns {Object} saves repo node
 */
function requestPageData(accesstoken, pageid) {
    if (pageid == undefined || pageid == null) {
        return null;
    }

    let pageRes = httpLib.request({
        method: "GET",
        url: `https://graph.facebook.com/${pageid}`,
        params: {
            fields: "access_token,name",
            access_token: accesstoken,
        },
    });

    if (checkFacebookResponse(pageRes)) {
        log.info(`Facebook response error ${pageid}`);
        return null;
    }

    return JSON.parse(pageRes.body);
}

function checkFacebookResponse(res) {
    if (res.status != 200 && res.status != 201) {
        return true;
    }
    return false;
}

function facebookError(res, message) {
    log.info(message);
    return {
        status: 500,
        body: "Facebook integration error",
    };
}

function notAuthorized(message) {
    log.info(message);
    return {
        status: 400,
        body: "Could not authorize facebook",
    };
}

function serverError(message) {
    log.info(message);
    return {
        status: 500,
        body: "Server error, api error",
    };
}
