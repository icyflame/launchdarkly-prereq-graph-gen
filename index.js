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
    const filtered_mapping = _.reject(full_mapping, _.isEmpty)

    const flat_mapping = _.flatten(filtered_mapping)
    console.log("Total number of pre-requisite relationships: " + flat_mapping.length)

    console.log(flat_mapping.length)
    console.log(flat_mapping[0])
    console.log(flat_mapping[flat_mapping.length-1])

    let dot_file = [ ]
    dot_file.push("digraph prereqs {")

    const non_uniq_flags_with_prereqs = _.flatten(flat_mapping.map(flag => ([flag.key, flag.depends_on.key])))
    const flags_with_prereqs = _.uniq(non_uniq_flags_with_prereqs)
    console.log("Total number of flags with at least one pre-requisite: " + flags_with_prereqs.length)

    let create_label_for_flag = {}

    _.reject(flags_with_prereqs, _.isEmpty).forEach(f => {
        create_label_for_flag[f] = true
    })

    const flag_items_with_prereqs = flags.items.filter(flag => create_label_for_flag[transform_flag_name(flag.key)])

    console.log("Flag items with at least one pre-requisite: " + flag_items_with_prereqs.length)

    let label_lines = flag_items_with_prereqs.map(flag => {
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
