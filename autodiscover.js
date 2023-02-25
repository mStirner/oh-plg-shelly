const { EventEmitter } = require("events");

module.exports = (logger, [
    C_MDNS,
    C_DEVICES
]) => {

    let events = new EventEmitter();

    events.on("found", async ({ name, host, port }) => {
        try {

            // TODO: fix #306 and use "find" method instead!
            /*
            let found = C_DEVICES.items.find(({ labels }) => {
                return C_DEVICES._labels(labels || [], [
                    "manufacturer=shelly",
                    "shelly=true",
                    `ip=${host}`
                ]);
            });
            */

            let query = {
                interfaces: [{
                    settings: {
                        host,
                        port
                    }
                }],
                labels: [
                    "manufacturer=shelly",
                    "shelly=true"
                ]
            };

            // see issue #306
            let found = await C_DEVICES.find(query);

            if (found) {
                logger.verbose("Device allready exists", found);
                return;
            }

            // NOTE, why does this not trigger the found function?!
            let device = await C_DEVICES.add({
                name,
                ...query
            });

            logger.info("Device added", device);

        } catch (err) {

            logger.error("Could not add device", err);

        }
    });


    C_MDNS.found({
        name: "shelly*.local",
        type: "A",
        labels: [
            "manufacturer=shelly",
            "shelly=true"
        ]
    }, (record) => {

        record.match(({ data, name }) => {

            logger.verbose("DNS Record published", record, data);

            events.emit("found", {
                name,
                host: data,
                port: 80
            });

        });

    }, async (filter) => {
        try {

            let record = await C_MDNS.add(filter);
            logger.verbose(`mdns recourd added`, record);

        } catch (err) {

            logger.error("Could not add mdns record", err);

        }
    });


};