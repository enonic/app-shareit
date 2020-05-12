var shareButtons = document.querySelectorAll("button.submit");

for (let button of shareButtons) {
    button.addEventListener("click", function () {
        let platform = this.parentNode;
        let field = platform.querySelector(".field");
        let message = field.value;
        let pageId = null;
        if (this.dataset && this.dataset.pageid) {
            pageId = this.dataset.pageid;
        }
        field.disabled = true;
        field.value = "Creating facebook page post";

        serviceSend(platform, message, pageId);
    });
}

function serviceSend(platform, message, pageId) {
    let serviceUrl = document.getElementById("serviceUrl").dataset.serviceurl;
    let httpRequest = new XMLHttpRequest();
    let field = platform.querySelector(".field");

    let errorMessage = document.createElement("p");
    errorMessage.innerText = "Failed to post message to " + platform.id;

    function loaded() {
        platform.querySelector(".submit").disabled = true;
        if (httpRequest.status == "200" || httpRequest.status == "201") {
            let info = document.createElement("p");
            info.innerText =
                "Success! Find the " + messageName(platform.id) + " here: ";
            let link = document.createElement("a");
            let data = JSON.parse(httpRequest.response);
            link.setAttribute("href", data.url);
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
    
    if (pageId) {
        console.log("Added page id to sencd package");
        block.pageId = pageId;
    }
    // user context should be included. If not, need to add security.
    httpRequest.send(JSON.stringify(block));
}

function messageName(media) {
    console.log(media);
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
