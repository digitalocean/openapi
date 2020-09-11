/**
  * Copyright 2020 Box, Inc. All rights reserved.
  *
  * Licensed under the Apache License, Version 2.0 (the "License"); you may not
  * use this file except in compliance with the License. You may obtain a copy
  * of the License at http://www.apache.org/licenses/LICENSE-2.0.
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
  * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
  * License for the specific language governing permissions and limitations
  * under the License.
  *
  * Ensure that examples exist for paramters/properties of
  * basic values
  *
  * Based on:
  * https://github.com/box/box-openapi/blob/184889a4b5b6156e0e2719bd513d93f994c6c50e/src/spectral/ensurePropertiesExample.js
  *
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