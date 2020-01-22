//Social media 
//add event listeners to each social media
selectBox();

//var serviceUrl = $("#AuthService").val();

var httpRequest = new XMLHttpRequest();

httpRequest.onreadystatechange = function () {

};

var serviceUrl = document.getElementById("serviceUrl").data("serviceUrl");
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

function selectBox() {
    var platforms = document.querySelectorAll(".platform");
    for (let i = 0; i < platforms.length; i++) {
        let current = platforms[i];
        platforms[i].querySelector("input").addEventListener("change", function () {
            platformEvent(current, this);
        });
    }
}

function platformEvent(platform, target) {
    if (target.checked) {
        platform.className += " selected";
    } else {
        platform.className = platform.className.replace(" selected", "");
    }
    
}