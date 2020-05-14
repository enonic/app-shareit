const node = require("/lib/xp/node");

//random string generator
exports.genRandomString = function (size) {
    var str = "";
    var alphaNum =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < size; i++) {
        str += alphaNum.charAt(Math.ceil(Math.random() * alphaNum.length));
    }

    return str;
};

exports.createSiteRepo = function (repo, siteName) {
    log.info(siteName);

    let result = repo.exists(`/${siteName}`);

    // Create only if it does not exist
    if (result == false) {
        repo.create({
            _name: `${siteName}`,
            _parentPath: "/",
        });
    }
};

/**
 * Returns connection to app storage
 * @returns {RepoConnection}
 */
exports.getRepo = getRepo;
function getRepo() {
    return node.connect({
        repoId: "com.enonic.app.shareit",
        branch: "master",
        //Principals: current user
    });
}

/**
 * Creates a valid url with appended optional params
 * @param {String} url The initial url to append the params to
 * @param {Array} params Array of key value objects
 * @returns
 */
exports.createUrl = function (url, params) {
    if (Array.isArray(params)) {
        for (let i = 0; i < params.length; i++) {
            let pair = params[i];
            //First param add ? or add &
            let prefix = i == 0 ? "?" : "&";
            url += `${prefix}${pair.key}=${pair.value}`;
        }
    }
    return url;
};
