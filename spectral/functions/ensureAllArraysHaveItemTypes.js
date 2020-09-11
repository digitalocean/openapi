/**
 * Ensures all arrays have item types
 *
 * Based on:
 * https://github.com/box/box-openapi/blob/main/src/spectral/ensureAllArraysHaveItemTypes.js
 */
module.exports = (param, _, paths) => {
  // if this is actually a property called properties, ignore
  if (paths.target.join('.').includes('properties.properties')) { return }

  // if this is a list, check if the first item matches instead
  if (param.items && param.items.oneOf) { return }

  // check if the param is an array
  if (param.type === 'array' &&
    // if the param has items, ensure it has a type, $ref, or properties
    !(param.items && (param.items.type || param.items['$ref']
    || param.items['anyOf'] || param.items['allOf']
    || param.items['properties']))) {
    return [
      {
        message: `${paths.target ? paths.target.join('.') : 'property'}; type array need an item type, $ref, or properties`
      }
    ]
  }
}