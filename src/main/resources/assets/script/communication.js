
//Javascript front-end handles all data trafic.
//Not a fan of it, but i don't want content studio to reload on every post request.

//#twitter-message
$(function () {
    //console.log("rand", genRandomString());
    //genRandomString(32);
    //senderTwitter();

    var serviceUrl = $("#AuthService").val();
    console.log(serviceUrl);

    var httpRequest = new XMLHttpRequest();

    httpRequest.onreadystatechange = function() {

    };
    var serviceUrl = document.getElementById("social-widget").data("serviceUrl");
    httpRequest.open('GET', serviceUrl, true);
    

    request.fail(function (jqXHR, textStatus, err) {
        console.log("error: " + textStatus, err);
        $("#twitter-mesage").addClass("error").html(err);
    });

    request.done(function (data) {
        console.log(data);
        $("#twitter-mesage").addClass("success").html(data);
    });

    //sending twitter message
});

/*function senderTwitter() {

    var authorization = getAuthentication();

    var request = $.ajax({
        url: "",
        data: {
            status: "Human forced me to post a tweet.",
        },
        headers: {
            authorization: authorization,
        },
        contentType: "application/json",
    });

    //
    

    request.fail(function (err) {
        console.log("error");
        $("#twitter-mesage").addClass("error").text(err);
    });

    request.done(function (data) {
        $("#twitter-mesage").addClass("success").text(err);
    });
}

function getAuthentication() {
    var authorization = {
        oauth_consumer_key: "",
        oauth_nonce: "",
    };
}*/