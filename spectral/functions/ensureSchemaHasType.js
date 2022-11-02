/*
 * Ensures all schemas have a type defined
 *
 * Based on:
 * https://github.com/box/box-openapi/blob/184889a4b5b6156e0e2719bd513d93f994c6c50e/src/spectral/ensureSchemaHasType.js
 */

function hasTypeOrRef(contentType) {
    const allowed = ['type', '$ref', 'anyOf', 'allOf', 'oneOf'];
    for (const key in allowed) {
        if (schema.hasOwnProperty(key)) {
            return true;
        }
    }
    return false;
}

module.exports = (contentType, _, context) => {
    let path = context.path.join('.')
    if (!contentType.schema) {
        return [{
            message: `missing schema for ${path}`
        }]
    }
    let schema = contentType.schema;
    if (schema.oneOf || schema.allOf || schema.anyOf) { return };
    if (!schema.type && !schema['$ref']) {
        return [{
            message: `schema must have 'type' or '$ref': ${path}`
        }]
    }
}