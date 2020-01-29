//Social media 
//add event listeners to each social media


//var serviceUrl = $("#AuthService").val();

var httpRequest = new XMLHttpRequest();

//run the different section
//AJAX api request
connectService();
//Visual
selectBox();

function connectService() {
    var serviceUrl = document.getElementById("serviceUrl").dataset.serviceurl;
    httpRequest.open('GET', serviceUrl, true);
    httpRequest.send();

    console.log(serviceUrl);

    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == XMLHttpRequest.DONE) {
            console.log(httpRequest.status);
            console.log(httpRequest.responseText);
        }
    };
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