const repoLib = require("/lib/xp/repo");
const node = require("/lib/xp/node");
const contextLib = require("/lib/xp/context");

//Created the shareit repo and state node
(function start() {
    let context = {
        reposity: "com.enonic.app.shareit",
        branch: "master",
        user: {
            login: "su",
            idProvider: "system",
        },
        principal: ["role:system.admin"],
    };

    contextLib.run(context, runAll);

    function runAll() {
        createRepo();

        let connection = node.connect({
            repoId: "com.enonic.app.shareit",
            branch: "master",
        });

        createLinkedin(connection);
        createFacebook(connection);
    }

    function createRepo() {
        if (repoLib.get("com.enonic.app.shareit")) {
            return;
        }

        repoLib.create({
            id: "com.enonic.app.shareit",
            rootPermissions: [
                {
                    principal: "role:admin",
                    allow: [
                        "READ",
                        "CREATE",
                        "MODIFY",
                        "DELETE",
                        "PUBLISH",
                        "READ_PERMISSIONS",
                        "WRITE_PERMISSIONS",
                    ],
                    deny: [],
                },
            ],
        });
    }

    function createLinkedin(connection) {
        if (connection.get("/linkedin")) {
            return;
        }

        //linkedin storrage
        connection.create({
            _name: "linkedin",
            _parentPath: "/",
        });
    }

    function createFacebook(connection) {
        if (connection.get("/facebook")) {
            return;
        }

        connection.create({
            _name: "facebook",
            _parentPath: "/",
        });
    }

    function createTwitter(connection) {
        if (connection.get("/twitter")) {
            return;
        }

        connection.create({
            _name: "twitter",
            _parentPath: "/",
        });
    }
})();
