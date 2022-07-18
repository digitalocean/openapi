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

export default (input, _, context) => {
  if (
    context.path.join('.').includes('properties.properties') ||
    // skip if this is an example
    context.path.includes('example') ||
    context.path.includes('examples') ||
    // objects are not basic values
    input.type === 'object' ||
    // binary values are not basic values
    input.format === 'binary' ||
    // arrays can be skipped unless they are string arrays
    (input.type === 'array' && input.items && input.items.type !== 'string') ||
    // skip if the property as a reference
    input['$ref'] !== undefined ||
    input.allOf !== undefined ||
    // skip if this is a boolean; false is a valid example
    input.type === 'boolean' ||
    // allow an explicit example value of null
    input.example === null) { return }

  // if the item does not have an example
  // throw an error
  if (input.example == undefined) {
    return [
      {
        message: `${context.path ? context.path.join('.') : 'property'} does not include example`,
      }
    ]
  }
};
