var less = require('less');
var fs = require('fs');

console.info("Compiling less");
let fileData;
fs.readFile(__dirname + "/../src/main/resources/assets/styles/main.less", function (error, data) {
    if (!error) {
        fileData = data.toString();
    } else {
        console.info(error);
        fileData = "";
        return;
    }

    less.render(fileData,
        {
            paths: [
                "src/main/resources/assets/styles*",
                "node_modules/*"
            ]
        }, function (error, result) {
            if (error) {
                console.info(error);
                return;
            }

            fs.writeFile(__dirname + "/../build/resources/main/assets/styles/main.css", result.css, function (err) {
                if (err) {
                    console.info("could not create file main.css");
                    throw err;
                }

                console.info("Created main.css");
            });

            fs.unlink(__dirname + "/../build/resources/main/assets/styles/main.less", function (err) {
                if (err) {
                    console.info("could not remove file");
                    throw err;
                }
                console.info("Removed main.less from build");
            });
        });
});