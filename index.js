require("dotenv").config()
const request = require("request");
const _ = require("lodash");

const options = {
    method: 'GET',
    url: 'https://app.launchdarkly.com/api/v2/flags/projKey',
    headers: {
        "Authorization": process.env.LD_API_KEY
    }
};

request(options, function (error, response, body) {
    if (error) throw new Error(error);

    if (response.statusCode !== 200) {
        throw new Error("Status code was not 200. Actual response status: " + response.statusCode)
    }

    const flags = JSON.parse(body)

    const full_mapping = flags.items.map(flag => {
        let key = flag.key
        let is_on = flag.environments.production

        return flag.environments.production.prerequisites.map(prereq => ({
            base: key,
            base_status: status,
            depends_on: {
                key: prereq.key,
                variation: prereq.variation
            }
        }))
    })

    console.log(full_mapping)
});
