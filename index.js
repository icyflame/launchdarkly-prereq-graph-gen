require("dotenv").config()
const request = require("request");
const _ = require("lodash");
const fs = require('fs');

const options = {
    method: 'GET',
    url: 'https://app.launchdarkly.com/api/v2/flags/default',
    headers: {
        "Authorization": process.env.LD_API_KEY
    }
};

const transform_flag_name = flag_name => {
    flag_name = _.snakeCase(flag_name);
    if (flag_name.match(/^[0-9]/)) {
        flag_name = 'flag_' + flag_name
    }
    return flag_name
}

request(options, function (error, response, body) {
    if (error) throw new Error(error);

    if (response.statusCode !== 200) {
        throw new Error("Status code was not 200. Actual response status: " + response.statusCode)
    }

    const flags = JSON.parse(body)

    const full_mapping = flags.items.map(flag => {
        let key = flag.key
        let status = flag.environments.production.on
        let off_variation = flag.environments.production.offVariation

        return flag.environments.production.prerequisites.map(prereq => ({
            key: transform_flag_name(key),
            status,
            off_variation,
            depends_on: {
                key: transform_flag_name(prereq.key),
                variation: prereq.variation
            },
            variations: flag.variations
        }))
    })

    console.log("Full mapping length: " + full_mapping.length)
    let filtered_mapping = full_mapping.filter(e => !_.isEmpty(e))
    console.log("Filtered mapping length: " + filtered_mapping.length)

    let flat_mapping = _.flatten(filtered_mapping)
    console.log("Flat mapping length: " + flat_mapping.length)

    console.log(flat_mapping.length)
    console.log(flat_mapping[0])
    console.log(flat_mapping[flat_mapping.length-1])

    let dot_file = [ ]
    dot_file.push("digraph prereqs {")

    let label_lines = flags.items.map(flag => {
        return [
            transform_flag_name(flag.key),
            ' [ shape=box, label="',
            transform_flag_name(flag.key),
            ';',
            '", ',
            'color=',
            flag.environments.production.on ? 'green' : 'red',
            ', style=filled',
            ' ];'
        ].join('')
    })
    dot_file = _.concat(dot_file, label_lines)

    let flag_lines = flat_mapping.map(flag_with_dependency => {
        return [
            flag_with_dependency.key,
            ' -> ',
            flag_with_dependency.depends_on.key,
            ' [ label="',
            'variation ' + flag_with_dependency.depends_on.variation,
            '" ];'
        ].join('')
    })

    dot_file = _.concat(dot_file, flag_lines)

    dot_file.push("}")

    fs.writeFileSync("test.dot", dot_file.join('\n'))
})
