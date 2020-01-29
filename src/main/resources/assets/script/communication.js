//TODO add event listeners to each social media

selectBox();

var shareButton = document.getElementById("shareButton");
shareButton.addEventListener("click", function () {
    connectService();
});

function connectService() {
    var serviceUrl = document.getElementById("serviceUrl").dataset.serviceurl;
    var httpRequest = new XMLHttpRequest();
    var twitter = document.getElementById("twitter");

    httpRequest.addEventListener("load", function (event) {
        console.log(httpRequest.response);
        let successMessage = document.createElement("p");
        successMessage.className = "success";
        successMessage.innerText = "Posted a new tweet";
        twitter.append(successMessage);
    });
    httpRequest.addEventListener("error", function (event) {
        console.log(httpRequest.response);
        let errorMessage = document.createElement("p");
        errorMessage.className = "error";
        errorMessage.innerText = "Something went wrong";
        twitter.append(errorMessage);
    });

    httpRequest.open('POST', serviceUrl, true);
    httpRequest.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    httpRequest.send(JSON.stringify({ text: "foobar" }));
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