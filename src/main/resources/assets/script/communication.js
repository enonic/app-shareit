var shareButtons = document.querySelectorAll("button.submit");

for (let button of shareButtons) {
    button.addEventListener("click", function () {
        let platform = this.parentNode;
        let field = platform.querySelector(".field");
        let message = field.value;
        field.disabled = true;
        let messageType = messageName(platform.id);
        field.value = `Creating ${platform.id} ${messageType}`;

        serviceSend(platform, message);
    });
}

function serviceSend(platform, message) {
    let serviceUrl = document.getElementById("serviceUrl").dataset.serviceurl;
    let siteId = document.getElementById("siteId").dataset.siteid;
    let httpRequest = new XMLHttpRequest();
    let field = platform.querySelector(".field");

    let errorMessage = document.createElement("p");
    errorMessage.innerText = "Failed to post message to " + platform.id;

    function loaded() {
        let button = platform.querySelector(".submit");
        button.style.visibility = "hidden";
        //button.style.pointerEvents = "none";

        if (httpRequest.status == "200" || httpRequest.status == "201") {
            let info = document.createElement("p");
            info.innerText =
                "Success! Find the " + messageName(platform.id) + " here: ";
            let link = document.createElement("a");
            let data = JSON.parse(httpRequest.response);
            link.setAttribute("href", data.url);
            link.setAttribute("target", "_blank");
            link.innerText = "link";
            info.appendChild(link);
            platform.replaceChild(info, field);
        } else {
            console.log(httpRequest.statusText);
            console.log(httpRequest.response);
            let errorMessageCopy = errorMessage.cloneNode(true);
            errorMessageCopy.innerText =
                httpRequest.status + " " + errorMessageCopy.innerText;
            platform.replaceChild(errorMessageCopy, field);
        }
    }

    httpRequest.addEventListener("load", loaded);

    httpRequest.open("POST", serviceUrl, true);
    httpRequest.setRequestHeader(
        "Content-Type",
        "application/json;charset=UTF-8"
    );

    let block = {
        platform: platform.id,
        message: message,
    };

    if (siteId) {
        block.siteId = siteId;
    }
    // user context should be included. If not, need to add security.
    httpRequest.send(JSON.stringify(block));
}

function messageName(media) {
    switch (media) {
        case "linkedin":
            return "share";
        case "facebook":
            return "post";
        case "twitter":
            return "tweet";
        default:
            return "";
    }
}
