//var contentLib = require('lib/xpcontent');
const portal = require('/lib/xp/portal');
const thymleaf = require('/lib/thymeleaf');
const context = require('/lib/xp/context');
const libContent = require('/lib/xp/content');
const linkedinLib = require('/lib/linkedin');

const view = resolve('shareit.html');

exports.get = function (req) {
    let content = getContentId(req);
    if (content == null) return errorMessage("No content selected");

    //content selected in CS
    let siteConfig = libContent.getSiteConfig({
        key: content._id,
        applicationKey: app.name
    });

    if (!siteConfig.domain) return errorMessage("App not configured for this site");

    //Check for config file
    if (app.config && Object.keys(app.config).length === 0) {
        return errorMessage("Missing configuration file, application not enabled");
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
    let url = siteConfig.domain + '' + pathAppend;

    let sharingService = portal.serviceUrl({
        service: "share-message",
        type: "absolute"
    });

    let model = {
        //content to share/post
        url,
        name: content.displayName,

        //stylesheets
        stylesheet: portal.assetUrl({ path: "styles/main.css" }),

        //platforms
        twitter: {
            enable: isEnabled("twitter"),
            logoUrl: portal.assetUrl({ path: "images/TwitterWhite.svg" }),
        },
        linkedin: {
            enable: isEnabled("linkedin"),
            showAuthorization: linkedinLib.checkAccessToken(),
            authorizationUrl: linkedinLib.createAuthenticationUrl()
        },

        //service
        serviceUrl: sharingService,

        //Scripts
        communication: portal.assetUrl({ path: "script/communication.js" }),
    };

    return {
        contentType: 'text/html',
        body: thymleaf.render(view, model),
    };
};

// Checks if the given platform is enabled
function isEnabled(name) {
    let config = app.config;

    //hacky but config.twitter.enable throws error
    //config["twitter.enable"] is how it needs to be accessed
    let enableProperty = name + ".enable";
    let enable = config[enableProperty] || false;

    return enable;
}

// Content studio built in error message
function errorMessage(message) {
    return {
        contentType: 'text/html',
        body: `<widget class="error">${message}</widget>`
    };
}

//Widget set context so we need to get the content
function getContentId(req) {
    let current = portal.getContent();
    let contentId = req.params.contentId;
    //Set current if its missing from params
    if (!contentId && current) {
        contentId = current._id;
    }

    //Still missing? Nothing selected
    if (!contentId) {
        return null;
    }

    if (!current) {
        current = libContent.get({ key: contentId });
    }

    return current;
}