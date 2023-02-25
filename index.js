const request = require("../../helper/request.js")


module.exports = (info, logger, init) => {
    return init([
        "mdns",
        "devices",
        "endpoints"
    ], (scope, [
        C_MDNS,
        C_DEVICES,
        C_ENDPOINTS
    ]) => {

        require("./autodiscover.js")(logger, [
            C_MDNS,
            C_DEVICES
        ]);


        C_DEVICES.found({
            labels: [
                "manufacturer=shelly",
                "shelly=true"
            ]
        }, (device) => {

            let iface = device.interfaces[0];
            let { host, port } = iface.settings;

            let agent = iface.httpAgent();

            logger.debug("Handle shelly device", device);

            C_ENDPOINTS.found({
                device: device._id
            }, (endpoint) => {

                console.log("Handle endpoint", endpoint)

                endpoint.commands.forEach((command) => {
                    command.setHandler((cmd, iface, params, done) => {

                        let { host, port } = iface.settings;
                        let agent = iface.httpAgent();

                        request(`http://${host}:${port}/relay/${cmd.identifier}?turn=${cmd.alias}`, {
                            agent
                        }, (err, result) => {
                            if (err) {

                                done(err);

                            } else {

                                done(null, result.ison === (cmd.alias === "on"));

                            }
                        });

                    });
                });

            });

            iface.on("attached", async () => {
                try {

                    logger.debug(`Interface attacheed tcp://${host}:${port}`);

                    // fetch /shelly
                    let shelly = await new Promise((resolve, reject) => {
                        console.log("GET: ", `http://${host}:${port}/shelly`);
                        request(`http://${host}:${port}/shelly`, {
                            agent
                        }, (err, result) => {
                            if (err || result.status !== 200) {

                                logger.error(`Could not fetch device status for ${device._id}`, err || "Return status not 200");
                                reject(err || result.status);

                            } else {

                                console.log("Fetched shelly")
                                resolve(result.body);

                            }
                        });
                    });

                    // fetch: /status
                    let status = await new Promise((resolve, reject) => {
                        console.log("GET: ", `http://${host}:${port}/status`);
                        request(`http://${host}:${port}/status`, {
                            agent
                        }, (err, result) => {

                            if (err || result.status !== 200) {

                                logger.error(`Could not fetch device status for ${device._id}`, err || "Return status not 200");
                                reject(err || result.status);

                            } else {

                                console.log("Fetched status")
                                resolve(result.body);

                            }
                        });
                    });

                    console.log();
                    console.group(`Device: ${device.name}`);
                    console.log("/shelly", shelly);
                    console.log("/status", status);
                    console.groupEnd();


                    let endpoint = await C_ENDPOINTS.find({
                        device: device._id
                    });

                    if (endpoint) {
                        console.log("Endpoint exists for deivce");
                        return
                    }


                    status.relays?.forEach(async (relay, i) => {

                        let endpoint = await C_ENDPOINTS.add({
                            name: device.name,
                            device: device._id,
                            commands: [{
                                name: "On",
                                alias: "on",
                                identifier: `${i}`,
                                interface: iface._id
                            }, {
                                name: "Off",
                                alias: "off",
                                identifier: `${i}`,
                                interface: iface._id
                            }],
                            labels: [
                                `gen=${shelly?.gen + 1 || 1}`
                            ]
                        });

                        console.log("Endppoint added", endpoint)

                    });





                } catch (err) {
                    console.log("Could not fetch status or shelly", err);
                }
            });

        });
    });
};