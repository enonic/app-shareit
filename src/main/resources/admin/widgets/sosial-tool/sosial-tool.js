//var contentLib = require('lib/xpcontent');
var portal = require('/lib/xp/portal');
var thymleaf = require('/lib/xp/thymeleaf');

exports.get = function(req) {
    var view = resolve('sosial-tool.html');
    var model = {};

    return {
        contentType: 'text/html',
        body: thymleaf.render(view, model),
    };
};