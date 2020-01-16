var request = require('/lib/http-client');
var encodingLib = require('/lib/text-encoding');

var counter = 0;

exports.get = function(req) {

  counter++;

  log.info("auth service:");
  prettyPrint(req);

  return {
    body: {
      time: new Date(),
      counter: counter
    },
    contentType: 'application/json'
  };

};

function genRandomString(size) {
  var str = "";
  var alphaNum = "abcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < size; i++) {
      str += alphaNum.charAt(Math.ceil(Math.random() * alphaNum.length));
  }
  console.log(str);
}

function prettyPrint(data) {
  log.info(JSON.stringify(data, null, 2));
}