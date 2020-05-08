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

    contextLib.run(context, createRepo);

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
})();
