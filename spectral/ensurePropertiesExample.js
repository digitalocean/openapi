/**
  * Ensure that examples exist for paramters/properties of
  * basic values
  *
  * Based on:
  * https://github.com/box/box-openapi/blob/default/src/spectral/ensurePropertiesExample.js
  */

module.exports =(item, _, paths) => {
  if (
      paths.target.join('.').includes('properties.properties') ||
      // skip if this is an example
      paths.target.includes('example') ||
      paths.target.includes('examples') ||
      // objects are not basic values
      item.type === 'object' ||
      // binary values are not basic values
      item.format === 'binary' ||
      // arrays can be skipped unless they are string arrays
      (item.type === 'array' && item.items && item.items.type !== 'string') ||
      // skip if the property as a reference
      item['$ref'] !== undefined ||
      item.allOf !== undefined ||
      // skip if this is a boolean; false is a valid example
      item.type === 'boolean' ||
      // allow an explicit example value of null
      item.example === null ) { return }

  // if the item does not have an example
  // throw an error
  if (!item.example) {
    return [
      {
        message: `${paths.target ? paths.target.join('.') : 'property'} does not include example`,
      }
    ]
  }
}