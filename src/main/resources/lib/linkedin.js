const httpLib = require("/lib/http-client");
const portal = require("/lib/xp/portal");
const shareTool = require("/lib/share-tool");
const util = require("/lib/util");
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
    let token = data.access_token;
    //Expire is in seconds need to be in miliseconds.
    //Adding miliseconds onto getTime. (Will be off by request time)
    let expireUtc = new Date().getTime() + data.expires_in * 1000;

    //Attempt to destory the old node
    repo.delete("/linkedin/accesstoken");
    let expireDate = new Date();
    expireDate.setTime(expireUtc);

    let accessNode = repo.create({
        _name: "accesstoken",
        _parentPath: "/linkedin",
        token,
        expireUtc,
    });

    if (accessNode == undefined || accessNode == null) {
        return null;
    }

    return accessNode;
}

//Checks to see if the current access token is valid
exports.checkAccesstoken = function (repo) {
    if (repo == undefined) {
        repo = shareTool.getRepo();
    }
    let node = repo.get("/linkedin/accesstoken");
    if (node != null && node.token) {
        //removing 30 seconds from expire time on token so it gets refreshed
        let todayUtc = new Date().getTime() - 30 * 1000;

        if (node.expireUtc > todayUtc) {
            return true;
        }
    }

    return false;
};

exports.getAccessToken = getAccessToken;
function getAccessToken(repo) {
    let node = repo.get("/linkedin/accesstoken");
    if (node == null || node.token == undefined) {
        return null;
    } else {
        return node.token;
    }
}

// ## person id (urn) methods
exports.saveUserId = function (repo, id) {
    //Attempt to destory the old node
    repo.delete("/linkedin/userId");

    let userNode = repo.create({
        _name: "userId",
        _parentPath: "/linkedin",
        userId: id,
    });

    if (userNode == undefined || userNode == null) {
        return null;
    }

    return userNode;
};

// Gets the authenticated persons urn from app storrage
exports.getUserUrn = getUserUrn;
function getUserUrn(repo) {
    if (repo == undefined) {
        repo = shareTool.getRepo();
    }
    let node = repo.get("/linkedin/userId");
    if (node == null || node.userId == undefined) {
        return null;
    } else {
        return "urn:li:person:" + node.userId;
    }
}

// Gets the authenticated persons urn with linkedin api (id)
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
};

// ## General
/**
 * Makes a request to get accesstoken from linkedin.
 * @param {String} code authorization code
 * @param {String} redirect redirect url used in the request
 * @returns {Object} request if the exchange call
 */
exports.exchangeAuthCode = function (code, redirect) {
    let response = httpLib.request({
        url: "https://www.linkedin.com/oauth/v2/accessToken",
        method: "POST",
        contentType: "x-www-form-urlencoded",
        params: {
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirect,
            client_id: app.config["linkedin.client_id"],
            client_secret: app.config["linkedin.client_secret"],
        },
    });

    return response;
};

/**
 * Save organization id when passing in the url name of the organization page
 * @param {String} name Organization vanity name
 * @param {String} accessToken Token used for authentication 
 * @returns {Object} repo node that is saved or null
 */
exports.saveOrganizationIdByName = saveOrganizationIdByName;
function saveOrganizationIdByName(name, accessToken) {
    let repo = shareTool.getRepo();

    //TODO get organization id by
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

    // Test org/urn
    // urn:li:organization:2414183

    if (response.status != 200) {
        if (response.params) {
            log.info(response.params.error);
            log.info(response.params.error_description);
            log.info(`Could not get the organizationID when using ${name}`);
        } else {
            log.info("linkedin response");
            logf(response);
        }
        return null;
    }
    let result = JSON.parse(response.body);

    log.info("Vanityname search");
    logf(result);

    if (result.elements.length == 0) {
        log.info(`Could not find any organizations with name: ${name}`);
        return {
            body: `Could not find any organizations with name: ${name}`,
        };
    }

    //todo saveOrganizationId
    let saved = saveOrganizationId(result.elements[0].id, repo);
    if (saved) {
        return saved;
    } else {
        return null;
    }
}

/**
 * Saves the organization in app repo
 * @param {String} id
 * @param {RepoConnection} repo
 */
function saveOrganizationId(id, repo) {
    if (repo == undefined) {
        repo = shareTool.getRepo();
    }

    repo.delete("/linkedin/organization");

    const orgNode = repo.create({
        _name: "organization",
        _parentPath: "/linkedin",
        orgId: id,
    });

    if (orgNode == undefined || orgNode == null) {
        return null;
    }

    return orgNode;
}

// Get organization urn from
exports.getOrgUrn = getOrgUrn;
function getOrgUrn(repo) {
    const orgNode = repo.get("/linkedin/organization");

    if (orgNode) {
        return `urn:li:organization:${orgNode.orgId}`;
    } else {
        log.info("Could not find organization data");
        return null;
    }
}

/**
 * Uses the linkedin api to post a message to the feed of the user/organization
 * @param {String} token Linkedin authentication token
 * @param {string} message The message that gets posted
 * @returns {string} //TODO post id? Link to the created post
 */
exports.sendMessage = function (token, message) {
    //let userUrn = getUserUrn();

    /* if (userUrn == null) {
        log.info("Could not get user urn");
        return {
            status: 500,
        };
    } */

    let postBody = {
        owner: "urn:li:organization:2414183", //userUrn
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

    logf(response);

    let data = JSON.parse(response.body);

    if (response.status != 201) {
        if (response.params && response.params.error) {
            log.info(response.params.error);
            log.info(response.params.error_description);
        } else {
            log.info("Could not send linkedin message");
            return {
                status: 500,
                body: "Error response from linkedin",
            };
        }
    }

    let url = createActivityUrl(data.activity);

    log.info(url);

    return {
        status: 201,
        body: JSON.stringify({ url: url }),
    };

    function createActivityUrl(urn) {
        return `https://linkedin.com//feed/update/${urn}`;
    }
};

// Lazy binding so getRepo works in all libs
exports.getRepo = shareTool.getRepo;

/**
 * Creates an url that is used to create an access token to linkedin
 * @returns {String} url link
 */
exports.createAuthenticationUrl = function () {
    let authService = portal.serviceUrl({
        service: "linkedin-authorize",
        type: "absolute",
    });

    let redirect = encodeURIComponent(authService);
    let randomString = shareTool.genRandomString(30);
    addState(randomString);

    let scope = encodeURIComponent("w_member_social r_liteprofile w_organization_social r_organization_social rw_organization_admin");

    let authlink = shareTool.createUrl(
        "https://www.linkedin.com/oauth/v2/authorization",
        [
            { key: "response_type", value: "code" },
            { key: "client_id", value: app.config["linkedin.client_id"] },
            { key: "redirect_uri", value: redirect },
            { key: "state", value: randomString },
            { key: "scope", value: scope },
        ]
    );

    return authlink;
};
