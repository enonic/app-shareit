//random string generator
exports.genRandomString = function (size) {
    var str = "";
    var alphaNum = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < size; i++) {
        str += alphaNum.charAt(Math.ceil(Math.random() * alphaNum.length));
    }

    return str;
};

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
            let prefix = i==0 ? '?' : '&';
            url += `${prefix}${pair.key}=${pair.value}`;
            
        }
    }
    return url;
};
