var httpLib = require('/lib/http-client');
var util = require('/lib/util');
var encoding = require('/lib/text-encoding');

var logf = util.log;
var request = httpLib.request;

/**
 * The 7 keys of oath:
 *1 oath_consumer_key: //Get from config file. Application consumer key
 *2 oauth_once: unique token each time use genRandomSting
 *3 oath_signature: See creating signature
 *3 -
 *4 oauth_signature_method: HMAC-SHA1 (twitter uses this)
 *5 oauth_timestamp: number of seconds since unix epoch at request generation
 *6 oauth_token: //get from config file . UserAcces to application 
 *7 oauth_version: 1.0 (Twitter)
**/

//All communicatio with twitter
exports.post = function (req) {

    if (req.body && req.body) {
        let body = JSON.parse(req.body);
        logf(body);
        if (body.twitter) {
            let response = sendRequest(body.twitter);
            return response;
        }
    }

    return "Error, could not send twitter message";
};

function sendRequest(message) {
    let status = message;
    let oath = createOAuthObject();

    let encodedOath = encodeData(oath);

    //Include all body and query string parameters
    let extraData = [
        ["status", status],
        //["include_entities", true],
    ];

    let encodedExtraData = encodeData(extraData);
    let encodedFinal = encodedOath.concat(encodedExtraData);

    //let encodedStatus = strictEncodeUri(status);

    let headerData = {
        url: "https://api.twitter.com/1.1/statuses/update.json",
        method: "POST",
        headers: {},
        params: {
            status: status
        },
        //contentType: "application/json"
    };

    let signature = createSignature(encodedFinal, headerData);
    let storedSign = [['oauth_signature', signature]];

    let encodedSignature = encodeData(storedSign);
    encodedOath = encodedOath.concat(encodedSignature);
    encodedOath.sort();

    headerData.headers.Authorization = buildAuthorization(encodedOath);

    logf(headerData);

    let response = request(headerData);

    logf(response);
}

//Initializes all possible oauth values. (signature is created later)
function createOAuthObject(status) {
    let random_token = genRandomString(42);
    let timestamp = Math.floor(new Date().getTime() / 1000);

    let oath = [
        ["oauth_consumer_key", app.config.twitter_consumer_key],
        ["oauth_nonce", random_token],
        ["oauth_signature_method", "HMAC-SHA1"],
        ["oauth_timestamp", timestamp],
        ["oauth_token", app.config.twitter_user_token],
        ["oauth_version", "1.0"],
    ];

    return oath;
}

/**
 * Encodes an double array with [key value]
 * @param {Map} oath 
 */
function encodeData(oath) {
    let encodedParams = [];

    for (let i = 0; i < oath.length; i++) {
        let pair = oath[i];
        let encodeKey = strictEncodeUri(pair[0]);
        let encodeValue = strictEncodeUri(pair[1]);

        encodedParams.push([encodeKey, encodeValue]);
    }

    return encodedParams;
}

/**
 * Creates the signing signature for the oauth1.0 
 * @param {*} oath 
 * @param {*} header 
 */
function createSignature(encodedParams, header) {
    let output = "";
    let param = "";

    //sort by key value
    encodedParams.sort();

    let paramLength = encodedParams.length;
    for (let i = 0; i < paramLength; i++) {
        let pair = encodedParams[i];
        param += pair[0] + '=' + pair[1];
        if (i != paramLength - 1) {
            param += '&';
        }
    }

    logf("parameter string");
    logf(param);

    let method = header.method.toUpperCase();
    output = method + '&' + strictEncodeUri(header.url);
    output += '&' + strictEncodeUri(param);

    logf("basestring");
    logf(output);

    let signingkey = strictEncodeUri(app.config.twitter_consumer_secret);
    signingkey += '&' + strictEncodeUri(app.config.twitter_user_secret);

    output = signing(signingkey, output);

    return output;
}

/**
 * Create the authorization header
 * Params is a double array with single (key value) pair
 * @param {Array} params 
 */
function buildAuthorization(params) {
    let output = 'OAuth ';

    let size = params.length;
    for (let i = 0; i < size; i++) {
        let pair = params[i];
        output += pair[0] + '=';
        output += '"' + pair[1] + '"';
        if (i != size - 1) {
            output += ', ';
        }
    }

    logf("Auth header params");
    logf(output);

    return output;
}

/**
 * Uses the key to sign a payloud.
 * Uses hmacsha1 to convert it to hex, and return the base 64 value.
 * @param {String} key 
 * @param {String} payload 
 */
function signing(key, payload) {
    let hexKey = encoding.hexEncode(key);
    let stream = encoding.hmacSha1AsStream(payload, hexKey);

    return encoding.base64Encode(stream);
}

function strictEncodeUri(str) {
    if (typeof str != String) {
        str = str.toString();
    }
    let encodedStr = encodeURIComponent(str);
    //Need to be more strict to adhere RFC 3986 
    let strictUri = encodedStr.replace(/[!'()*]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16);
    });

    return strictUri;
}

function genRandomString(size) {
    var str = "";
    var alphaNum = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < size; i++) {
        str += alphaNum.charAt(Math.ceil(Math.random() * alphaNum.length));
    }

    return str;
}
