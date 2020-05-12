//var contentLib = require('lib/xpcontent');
const context = require("/lib/xp/context");
const facebookLib = require("/lib/facebook");
const libContent = require("/lib/xp/content");
const linkedinLib = require("/lib/linkedin");
const portal = require("/lib/xp/portal");
const thymleaf = require("/lib/thymeleaf");

const view = resolve("shareit.html");

exports.get = function (req) {
    let content = getContent(req);
    if (content == null) return errorMessage("No content selected");

    //content selected in CS
    let siteConfig = libContent.getSiteConfig({
        key: content._id,
        applicationKey: app.name,
    });

    if (!siteConfig.domain)
        return errorMessage("App not configured for this site");

    //Check for config file
    if (app.config && Object.keys(app.config).length === 0) {
        return errorMessage(
            "Missing configuration file, application not enabled"
        );
    }

    var published;

    //Check if its published
    context.run({ branch: "master" }, () => {
        published = libContent.exists({ key: content._id });
    });

    if (published == false) {
        return errorMessage("Item not published");
    }

    let site = libContent.getSite({ key: content._id });
    let pathAppend = content._path.replace(site._path, "");

    //prepend siteconfig.domain
    let url = siteConfig.domain + "" + pathAppend;

    let sharingService = portal.serviceUrl({
        service: "share-message",
        type: "absolute",
    });

    let model = {
        //content to share/post
        url,
        name: content.displayName,

        //stylesheets
        stylesheet: portal.assetUrl({ path: "styles/main.css" }),

        //platforms
        twitter: {
            enable: false,
            logoUrl: portal.assetUrl({ path: "images/TwitterWhite.svg" }),
        },
        linkedin: {
            enable: isLinkedinEnabled(siteConfig),
            logoUrl: portal.assetUrl({ path: "images/Linkedin.png" }),
            showAuthorization: linkedinLib.checkAccesstoken(),
            authorizationUrl: linkedinLib.createAuthenticationUrl(),
        },
        facebook: {
            enable: isFacebookEnabled(siteConfig),
            logoUrl: portal.assetUrl({ path: "images/f_logo.png" }),
            showAuthorization: facebookLib.isAuthenticated(site._name),
            pageId: site._id,
            authorizationUrl: facebookLib.createAuthenticationUrl(
                siteConfig,
                site._id
            ),
        },

        //service
        serviceUrl: sharingService,

        //Scripts
        communication: portal.assetUrl({ path: "script/communication.js" }),
    };

    return {
        contentType: "text/html",
        body: thymleaf.render(view, model),
    };
};

function isFacebookEnabled(siteConfig) {
    if (siteConfig.facebook != "undefined") {
        let settings = siteConfig.facebook;
        // Should be enabled at this point, but need to idiot proof.
        if (settings.app_secret && settings.app_id && settings.page_id) {
            return true;
        }
    }
    return false;
}

function isLinkedinEnabled(siteConfig) {
    if (siteConfig.linkedin != "undefined") {
        let settings = siteConfig.linkedin;
        if (settings.page_name && settings.app_id && settings.app_secret) {
            return true;
        }
    }

    return false;
}

// Content studio built in error message
function errorMessage(message) {
    return {
        contentType: "text/html",
        body: `<widget class="error">${message}</widget>`,
    };
}

//Widget set context so we need to get the content
function getContent(req) {
    /* let current = portal.getContent(); */
    let contentId = req.params.contentId;
    if (contentId) {
        return libContent.get({ key: contentId });
    } else {
        return null;
    }
}
