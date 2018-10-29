var sass = require('node-sass');
var fs = require('fs');

console.info("Compiling sass");
sass.render({
    file: "src/main/resources/assets/styles/main.scss",
    options: [{
        includePaths: "src/main/resources/assets/styles*"
    }]
}, function (err, result) {
    if (err) {
        throw err;
    }
    fs.writeFile("build/resources/main/assets/styles/main.css", result.css, function (err) {
        if (err) {
            console.log("could not create file main.css");
            throw err;
        }

        console.info("Created main.css");
    });
    fs.unlink("build/resources/main/assets/styles/main.scss", function (err) {
        if (err) {
            console.log("could not remove file");
            throw err;
        }
        console.info("Removed main.scss from build");
    });
});