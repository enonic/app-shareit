//TODO add event listeners to each social media

var shareButtons = document.querySelectorAll("button.submit");

for (let button of shareButtons) {
    button.addEventListener("click", function () {
        let platform = this.parentNode;
        let media = platform.id;
        let message = platform.querySelector(".field").value;

        serviceSend({
            platform: media,
            message: message
        }, platform);
    });
}

function serviceSend(dataBody, element) {
    let serviceUrl = document.getElementById("serviceUrl").dataset.serviceurl;
    let httpRequest = new XMLHttpRequest();
    let field = element.querySelector('.field');

    let successMessage = document.createElement("p");
    successMessage.innerText = "Successfully shared to " + element.id;
    let errorMessage = document.createElement("p");
    errorMessage.innerText = "Failed to post message to " + element.id;

    function loaded() {
        element.querySelector(".submit").setAttribute("disabled", true);
        if (httpRequest.status == "200") {
            element.replaceChild(successMessage, field);
        }
        else {
            console.log(httpRequest.statusText);
            console.log(httpRequest.response);
            let errorMessageCopy = errorMessage.cloneNode(true);
            errorMessageCopy.innerText = httpRequest.status + " " + errorMessageCopy.innerText;
            element.replaceChild(errorMessageCopy, field);
        }
    }

    httpRequest.addEventListener("load", loaded);

    httpRequest.open('POST', serviceUrl, true);
    httpRequest.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    httpRequest.send(JSON.stringify(dataBody));
}

//Open close on selected box (Each of twitter, facebook, social media widgets)
/* function selectBox() {
    var platforms = document.querySelectorAll(".platform");
    for (let i = 0; i < platforms.length; i++) {
        let current = platforms[i];
        platforms[i].querySelector("input").addEventListener("change", function () {
            platformEvent(current, this);
        });
    }
} */

/* function platformEvent(platform, target) {
    if (target.checked) {
        platform.className += " selected";
    } else {
        platform.className = platform.className.replace(" selected", "");
    }

} */