let httpLib = require("/lib/http-client");
var util = require('/lib/util');
var encoding = require('/lib/text-encoding');
var node = require("/lib/xp/node");
var repo = require("/lib/xp/repo");

var logf = util.log;

//OAth2 send message
exports.senMessage = function() {



    return {
        status: 500,
        message: "linkedin WIP"
    };
};

exports.saveState = function(state) {
    let repoConnection = node.repoConnection({
        repoId: "app.shareit",
        branch: "master"
    });

    if (!repoConnection) {
        //Create repoConnection?

    }
};

exports.getState = function() {
    
};

exports.deleteState = function() {

};