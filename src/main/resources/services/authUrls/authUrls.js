const facebookLib = require("/lib/facebook");
const linkinLib = require("lib/linkedin");

exports.get = function () {

    // Render a UI to select what site
    // Get authenticated with selected platform
    // Select to get site or default select the only one

    //Selected site config and ajax in the authentication url?
    let siteConfig = "";

    let page = `
     <a href="${facebookLib.createAuthenticationUrl(siteConfig)}"
    `;

    return {
        body: page,
    };
};