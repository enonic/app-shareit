const linkedinLib = require("/lib/linkedin");
const portal = require("/lib/xp/portal");
const contentLib = require("/lib/xp/content");
const util = require("/lib/util");
const logf = util.log;

// Service to authenticate the user
// Also requests the user id from linkedin (URN)
exports.get = function (req) {
    if (req.params.error != undefined) {
        logf(req);
        return notAuthorized("Error returned from linkedin");
    }

    let state = JSON.parse(req.params.state);

    let stateIndex = linkedinLib.getStateIndex(state.rng);

    if (stateIndex < -1) {
        return notAuthorized(`Invalid or not found state`);
    }

    linkedinLib.removeStateIndex(stateIndex);

    let site = contentLib.getSite({
        key: state.id,
    });

    // Crashed on facebook? need a toolsLib shared function
    let siteConfig;
    // tools function candidate
    let configs = site.data.siteConfig;
    for (let i = 0; i < configs.length; i++) {
        if (configs[i].applicationKey == app.name) {
            siteConfig = configs[i].config;
        }
    }

    let authService = portal.serviceUrl({
        service: "linkedin-authorize",
        type: "absolute",
    });

    let accessTokenData = linkedinLib.exchangeAuthCode(
        req.params.code,
        authService,
        siteConfig
    );
    let repo = linkedinLib.getRepo();

    // Using the access token so we can get all the data we need to store
    let orgId = linkedinLib.getOrganizationId(siteConfig.linkedin.page_name, accessTokenData.access_token);
    if (orgId == null) {
        return notAuthorized("Could not find organization id");
    }

    let node = linkedinLib.saveInfo(orgId, accessTokenData, site._name, repo);

    if (node == null) {
        return notAuthorized("Could not save the info needed to authorize");
    }

    log.info("Linkedin authorized");

    return {
        status: 200,
        body: "Authorized linkedin, can create shares now",
    };
};

function notAuthorized(message) {
    log.info(message);
    return {
        status: 400,
        body: "Could not authorize the app",
    };
}

function serverError(message) {
    log.info(message);
    return {
        status: 500,
        body: "Server error, api error",
    };
}
