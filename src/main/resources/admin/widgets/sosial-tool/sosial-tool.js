//var contentLib = require('lib/xpcontent');
const portal = require('/lib/xp/portal');
const thymleaf = require('/lib/thymeleaf');
const context = require('/lib/xp/context');
const libContent = require('/lib/xp/content');

const view = resolve('sosial-tool.html');

exports.get = function (req) {

    let sharingService = portal.serviceUrl({
        service: "share-message",
        type: "absolute"
    });

    let current = portal.getContent();

    let contentId = req.params.contentId;
    //Set current if its missing from params
    if (!contentId && current) {
        contentId = current._id;
    }

    //Still missing? Nothing selected
    if (!contentId) {
        return errorMessage("No content selected");
    }

    if (!current) {
        current = libContent.get({ key: contentId });
    }

    //content selected in CS
    let siteConfig = libContent.getSiteConfig({
        key: contentId,
        applicationKey: app.name
    });

    if (!siteConfig.domain) {
        return errorMessage("App not configured for this site");
    }

    //Check for config file
    //log.info(JSON.stringify(app.config, null, 4));
    if (app.config) {
        //Check empty object
        if (Object.keys(app.config).length === 0) {
            return errorMessage("Missing configuration file, application not enabled");
        }
    }

    var site = libContent.getSite({ key: contentId });
    var pathAppend = current._path.replace(site._path, "");

    //prepend siteconfig.domain
    var url = siteConfig.domain + '' + pathAppend;

    var published;

    //Check if its published
    context.run({ branch: "master" }, () => {
        published = libContent.exists({ key: contentId });
    });
    if (published == false) {
        return errorMessage("Item not published");
    }

    var model = {
        //content to share/post
        url,
        name: current.displayName,

        //stylesheets
        stylesheet: portal.assetUrl({ path: "styles/main.css" }),

        //images
        twitterLogoUrl: portal.assetUrl({ path: "images/TwitterWhite.svg" }),

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

function errorMessage(message) {
    return {
        contentType: 'text/html',
        body: `<widget class="error">${message}</widget>`
    };
}