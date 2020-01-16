//var contentLib = require('lib/xpcontent');
const portal = require('/lib/xp/portal');
const thymleaf = require('/lib/thymeleaf');
const context = require('/lib/xp/context');
const libContent = require('/lib/xp/content');

const view = resolve('sosial-tool.html');

exports.get = function (req) {
    let twitterService = portal.serviceUrl({
        service: "auth",
    });

    let contentId = req.params.contentId;

    if (!contentId) {
        let current = portal.getContent();
        if (current) contentId = current._id;
    }

    //content selected in CS
    if (!contentId) {
        return errorMessage("No content selected");
    }

    //Check for config 
    //log.info(JSON.stringify(app.config, null, 4));
    if (app.config) {
        if (app.enable == false) {
            return errorMessage("App not configured for this site");
        }
    }

    var url;
    var published;

    //Check if its published
    context.run({ branch: "master" }, () => {
        published = libContent.exists({ key: contentId });
        //How does one get live url? //Thomas
        //url = libContent.get({ contentId });
    });
    if (published == false) {
        return errorMessage("Item not published");
    }

    var model = {
        //content to share/post
        url,

        //stylesheets
        stylesheet: portal.assetUrl({ path: "styles/main.css" }),

        //images
        twitterLogoUrl: portal.assetUrl({ path: "images/TwitterWhite.svg" }),

        //service
        serviceUrl: twitterService,

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