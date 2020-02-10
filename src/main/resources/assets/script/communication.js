//TODO add event listeners to each social media

selectBox();

var shareButton = document.getElementById("shareButton");

shareButton.addEventListener("click", function () {
    let message = document.getElementById("shareUrl").dataset.message;
    let platforms = document.querySelectorAll(".platform");

    if (platforms.length > 0 && shareUrl != "") {
        let model = {};
        for (let i = 0; i < platforms.length; i++) {
            assignPlatform(platforms[i], model, message);
        }
        connectService(model);
    }
});

function assignPlatform(platform, model, message) {
    let socialMedia = platform.id;

    if (socialMedia) {
        switch (socialMedia) {
            case "twitter":
                model.twitter = message;
                break;
            default:
                console.log("could not find" + socialMedia);
                break;
        }
    }
    return;
}

function connectService(dataBody) {
    var serviceUrl = document.getElementById("serviceUrl").dataset.serviceurl;
    var httpRequest = new XMLHttpRequest();
    var twitter = document.getElementById("twitter");

    httpRequest.addEventListener("load", function (event) {
        let successMessage = document.createElement("p");
        successMessage.className = "success";
        successMessage.innerText = "Posted a new tweet";
        twitter.append(successMessage);
    });
    httpRequest.addEventListener("error", function (event) {
        let errorMessage = document.createElement("p");
        errorMessage.className = "error";
        errorMessage.innerText = "Something went wrong";
        twitter.append(errorMessage);
    });

    httpRequest.open('POST', serviceUrl, true);
    httpRequest.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    httpRequest.send(JSON.stringify(dataBody));
}

//Open close on selected box (Each of twitter, facebook, social media widgets)
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