const httpLib = require("/lib/http-client");
const portal = require("/lib/xp/portal");
const toolsLib = require("/lib/tools");
const util = require("/lib/util");
const logf = util.log;

//Global Authentication states
var states = [];

// Lazy binding so getRepo works in all libs
exports.getRepo = toolsLib.getRepo;

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

//Checks to see if the current access token is valid
exports.isAuthenticated = function (siteName, repo) {
    if (repo == undefined) {
        repo = toolsLib.getRepo();
    }

    let node = repo.get(`/${siteName}/linkedin`);
    if (node != null && node.token) {
        //removing 30 seconds from expire time on token so it gets refreshed
        let todayUtc = new Date().getTime() - 30 * 1000;

        if (node.expireUtc > todayUtc) {
            return true;
        }
    }

    return false;
};

// ## General
/**
 * Makes a request to get accesstoken from linkedin.
 * @param {String} code authorization code
 * @param {String} redirect redirect url used in the request
 * @returns {Object} request if the exchange call
 */
exports.exchangeAuthCode = function (code, redirect, siteConfig) {
    let response = httpLib.request({
        url: "https://www.linkedin.com/oauth/v2/accessToken",
        method: "POST",
        contentType: "x-www-form-urlencoded",
        params: {
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirect,
            client_id: siteConfig.linkedin.app_id,
            client_secret: siteConfig.linkedin.app_secret,
        },
    });

    return JSON.parse(response.body);
};

/**
 * Get organization id from the url organization name
 * @param {String} name vanity name of the organization
 * @param {Object} token accessToken for api calls
 **/
exports.getOrganizationId = function (name, accessToken) {
    let response = httpLib.request({
        contentType: "application/json",
        headers: {
            "X-Restli-Protocol-Version": "2.0.0",
            Authorization: `Bearer ${accessToken}`,
        },
        method: "GET",
        params: {
            q: "vanityName",
            vanityName: name,
        },
        url: "https://api.linkedin.com/v2/organizations",
    });

    if (response.status != 200) {
        logf(response.params);
        log.info("Linkedin api returned error on org lookup");
        return null;
    }

    let result = JSON.parse(response.body);

    if (result.elements.length == 0) {
        log.info(`Could not find any organizations with name: ${name}`);
        return null;
    }

    return result.elements[0].id;
};

/**
 * Save organization id when passing in the url name of the organization page
 * @param {String} orgId Linkedin organization id
 * @param {String} data All access_token data
 * @param {object} siteName Used for storring on site basis
 * @param {object} [repo] can pass in repo to use
 * @returns {Object} repo node that is saved or null
 */
exports.saveInfo = function (orgId, data, siteName, repo) {
    if (repo == "undefined") {
        repo = toolsLib.getRepo();
    }

    let token = data.access_token;
    let expireUtc = new Date().getTime() + data.expires_in * 1000;

    //Attempt to destory the old node
    let expireDate = new Date();
    expireDate.setTime(expireUtc);

    // Creates the site storrage if needed
    toolsLib.createSiteRepo(repo, siteName);

    repo.delete(`/${siteName}/linkedin`);

    const info = repo.create({
        _name: "linkedin",
        _parentPath: `/${siteName}`,
        orgId: orgId,
        token,
        expireUtc,
    });

    // Test org/urn
    // urn:li:organization:2414183

    return info;
};

/**
 * Gets the saved data from app repo
 * @param {RepoConnection} repo the repo to search for (app.repo)
 * @param {string} siteName the sitename that the data is saved under
 */
function getSavedInfo(repo, siteName) {
    let node = repo.get(`/${siteName}/linkedin`);

    return node;
}

// Create urn from organization from id
function organizationUrn(id) {
    if (id == null || id == "undefined") {
        return null;
    } else {
        return `urn:li:organization:${id}`;
    }
}

/**
 * Uses the linkedin api to post a message to the feed of the user/organization
 * @param {string} message The message that gets posted
 * @param {string} siteName Name of the site, used for getting data
 * @returns {Object} response with post url or error
 */
exports.sendMessage = function (message, siteName) {
    let repo = toolsLib.getRepo();
    let savedData = getSavedInfo(repo, siteName);

    let token = savedData.token;
    let urn = organizationUrn(savedData.orgId);

    // TODO Replace with proper verified company urn
    let postBody = {
        owner: "urn:li:organization:2414183",
        distribution: {
            linkedInDistributionTarget: {},
        },
        text: {
            text: message,
        },
    };

    let response = httpLib.request({
        body: JSON.stringify(postBody),
        contentType: "application/json",
        headers: {
            "X-Restli-Protocol-Version": "2.0.0",
            Authorization: `Bearer ${token}`,
        },
        method: "POST",
        url: "https://api.linkedin.com/v2/shares",
    });

    if (response.status != 201) {
        if (response.params && response.params.error) {
            log.info(response.params.error);
            log.info(response.params.error_description);
        } else {
            log.info("Could not send linkedin message");
            logf(response);
            return {
                status: 500,
                body: "Error response from linkedin",
            };
        }
    }

    let data = JSON.parse(response.body);

    // Hard coded linkedin url, taken from the docs
    let url = `https://linkedin.com//feed/update/${data.activity}`;

    return {
        status: 201,
        body: JSON.stringify({ url: url }),
    };
};

/**
 * Creates an url that is used to create an access token to linkedin
 * @param Siteid id to the current side the user is under.
 * @returns {String} url link
 */
exports.createAuthenticationUrl = function (siteId) {
    let authService = portal.serviceUrl({
        service: "linkedin-authorize",
        type: "absolute",
    });

    let redirect = encodeURIComponent(authService);
    let randomString = toolsLib.genRandomString(30);
    let state = encodeURIComponent(
        JSON.stringify({
            rng: randomString,
            id: siteId,
        })
    );
    addState(randomString);

    let scope = encodeURIComponent(
        "w_member_social r_liteprofile w_organization_social r_organization_social rw_organization_admin"
    );

    let authlink = toolsLib.createUrl(
        "https://www.linkedin.com/oauth/v2/authorization",
        [
            { key: "response_type", value: "code" },
            { key: "client_id", value: app.config["linkedin.client_id"] },
            { key: "redirect_uri", value: redirect },
            { key: "state", value: state },
            { key: "scope", value: scope },
        ]
    );

    return authlink;
};

/* ## AccessTokens */
/* exports.saveAccessToken = saveAccessToken;
function saveAccessToken(repo, data, siteName) {
    let token = data.access_token;
    //Expire is in seconds need to be in miliseconds.
    //Adding miliseconds onto getTime. (Will be off by request time)
    let expireUtc = new Date().getTime() + data.expires_in * 1000;

    //Attempt to destory the old node
    repo.delete(`${siteName}/linkedin/accesstoken`);
    let expireDate = new Date();
    expireDate.setTime(expireUtc);

    let accessNode = repo.create({
        _name: "accesstoken",
        _parentPath: `${siteName}/linkedin`,
        token,
        expireUtc,
    });

    if (accessNode == undefined || accessNode == null) {
        return null;
    }

    return accessNode;
} */

// ## person id (urn) methods
/* exports.saveUserId = function (repo, id, siteName) {
    //Attempt to destory the old node
    repo.delete(`/${siteName}/linkedin/userId`);

    let userNode = repo.create({
        _name: "userId",
        _parentPath: `/${siteName}/linkedin`,
        userId: id,
    });

    if (userNode == undefined || userNode == null) {
        return null;
    }

    return userNode;
}; */

// Gets the authenticated persons urn from app storrage
/* exports.getUserUrn = getUserUrn;
function getUserUrn(siteName, repo) {
    if (repo == undefined) {
        repo = toolsLib.getRepo();
    }
    let node = repo.get(`/${siteName}/linkedin/userId`);
    if (node == null || node.userId == undefined) {
        return null;
    } else {
        return "urn:li:person:" + node.userId;
    }
} */

/* // Gets the authenticated persons urn with linkedin api (id)
exports.requestUserId = function (token) {
    let response = httpLib.request({
        contentType: "application/json",
        headers: {
            "X-Restli-Protocol-Version": "2.0.0",
            Authorization: `Bearer ${token}`,
        },
        method: "GET",
        url: "https://api.linkedin.com/v2/me",
    });

    if (response && response.body != "") {
        let data = JSON.parse(response.body);
        if (data.id) {
            return data.id;
        }
    }
    if (response.params && response.params.error) {
        log.info(response.params.error);
        log.info(response.params.error_description);
    }
    return null;
}; */
