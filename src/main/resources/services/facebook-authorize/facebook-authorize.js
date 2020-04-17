const facebookLib = require("/lib/facebook");
const portal = require("/lib/xp/portal");
const context = require("/lib/xp/context");
const util = require("/lib/util");
const logf = util.log;
const httpLib = require("/lib/http-client");
const thymeleaf = require("/lib/thymeleaf");

// Service to create the page token
exports.get = function (req) {
    const repo = facebookLib.getRepo();
    let pageId;

    if (req.params && req.params.error != undefined) {
        logf(req.params);
        return notAuthorized("Facebook error returned");
    }

    const stateData = JSON.parse(req.params.state);
    let stateIndex = facebookLib.getStateIndex(stateData.state);
    pageId = stateData.pageId;

    if (stateIndex > -1) {
        facebookLib.removeStateIndex(stateIndex);
    } else {
        return notAuthorized("Invalid state or state not found facebook");
    }

    if (!pageId) {
        return notAuthorized("Missing pageId from state param");
    }

    let authService = portal.serviceUrl({
        service: "facebook-authorize",
        type: "absolute",
    });

    // Get user access token
    let userTokenResponse = facebookLib.exchangeAuthCode(
        req.params.code,
        authService
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

    // If the user grants access to more then one page
    // Render a page with option to choose page:
    const accounts = JSON.parse(userAccountsRes.body);

    logf(accounts);

    let pageToken;

    for (let i = 0; accounts.data.length; i++) {
        if (accounts.data[i].id == pageId) {
            pageToken = createPageToken(userToken, accounts.data[i].id);
            break;
        }
    }

    if (!pageToken || pageToken == null) {
        return notAuthorized("User needs correct access to the page");
    }

    let pageData = facebookLib.savePageData(repo, {
        token: pageToken,
        name: accounts.data[0].name,
        id: accounts.data[0].id,
    });
    log.info(`Facebook authorization: Can now post to ${pageData.name}`);
    if (!pageData) {
        return serverError("pageid could not be saved");
    }
    return {
        status: 200,
        body: `Facebook authorized. You can now post messages on the ${pageData.name} facebookpage.`,
    };
};

/**
 * Request a page access token from facebook
 * Saves the page access token in app repo
 * @param {String} accesstoken UserAccess token
 * @param {NumericString} pageid pageid
 * @returns {Object} saves repo node
 */
function createPageToken(accesstoken, pageid) {
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

    let resData = JSON.parse(pageRes.body);
    const repo = facebookLib.getRepo();

    const pageNode = facebookLib.savePageData(repo, {
        token: resData.access_token,
        name: resData.name,
        id: resData.id,
    });

    if (!pageNode) {
        log.info("could not save page token");
        return null;
    }

    return pageNode.token;
}

function checkFacebookResponse(res) {
    if (res.params && res.params.error) {
        return true;
    }
    return false;
}

function facebookError(res, message) {
    logf(res.params);
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
