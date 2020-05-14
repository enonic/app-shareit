var httpLib = require('/lib/http-client');
var util = require('/lib/util');
var encoding = require('/lib/text-encoding');
var toolsLib = require('/lib/tools');

var logf = util.log;
var request = httpLib.request;

exports.sendMessage = function (message) {

    let response = sendRequest(message);
    //TODO check response before returning it 401, 400, 500?
    if (response) {
        return response;
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
    ];

    let encodedExtraData = encodeData(extraData);
    let encodedFinal = encodedOath.concat(encodedExtraData);

    let headerData = {
        url: "https://api.twitter.com/1.1/statuses/update.json",
        method: "POST",
        headers: {},
        params: {
            status: status
        },
        contentType: "application/json"
    };

    let signature = createSignature(encodedFinal, headerData);
    let storedSign = [['oauth_signature', signature]];

    let encodedSignature = encodeData(storedSign);
    encodedOath = encodedOath.concat(encodedSignature);
    encodedOath.sort();

    headerData.headers.Authorization = buildAuthorization(encodedOath);

    let response = request(headerData);

    let tweetData = JSON.parse(response.body);
    let screenName = tweetData.user.screen_name;
    let id = tweetData.id_str;

    return {
        status: 201,
        body: JSON.stringify({
            url: `https://twitter.com/${screenName}/status/${id}`,
        }),
    };
}

//Initializes all possible oauth values. (signature is created later)
function createOAuthObject() {
    let random_token = toolsLib.genRandomString(42);
    let timestamp = Math.floor(new Date().getTime() / 1000);

    let oath = [
        ["oauth_consumer_key", app.config["twitter.consumer_key"]],
        ["oauth_nonce", random_token],
        ["oauth_signature_method", "HMAC-SHA1"],
        ["oauth_timestamp", timestamp],
        ["oauth_token", app.config["twitter.user_token"]],
        ["oauth_version", "1.0"],
    ];

    return oath;
}

/**
 * Encodes an double array with [key value]
 * @param {Object} oath 
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
 * @param {Object} oath 
 * @param {Object} header 
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

    let method = header.method.toUpperCase();
    output = method + '&' + strictEncodeUri(header.url);
    output += '&' + strictEncodeUri(param);

    let signingkey = strictEncodeUri(app.config["twitter.consumer_secret"]);
    signingkey += '&' + strictEncodeUri(app.config["twitter.user_secret"]);

    output = signing(signingkey, output);

    return output;
}

/**
 * Create the authorization header
 * Params is a double array with (key value) pair
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

//Encodes data to be URI friendly (" " -> "%20")
function strictEncodeUri(str) {
    if (typeof str != String) {
        str = str.toString();
    }
    let encodedStr = encodeURIComponent(str);
    //Need to be more strict to adhere to RFC 3986 
    let strictUri = encodedStr.replace(/[!'()*]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16);
    });

    return strictUri;
}

