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
  *
  * Ensures all arrays have item types
  *
  * Based on:
  * https://github.com/box/box-openapi/blob/184889a4b5b6156e0e2719bd513d93f994c6c50e/src/spectral/ensureAllArraysHaveItemTypes.js
  */
export default (input, _, context) => {
  // if this is actually a property called properties, ignore
  if (context.path.join('.').includes('properties.properties')) { return }

  // if this is a list, check if the first item matches instead
  if (input.items && input.items.oneOf) { return }

  // check if the param is an array
  if (input.type === 'array' &&
    // if the param has items, ensure it has a type, $ref, or properties
    !(input.items && (input.items.type || input.items['$ref']
      || input.items['anyOf'] || input.items['allOf']
      || input.items['properties']))) {
    return [
      {
        message: `${context.path.target ? context.path.join('.') : 'property'}; type array need an item type, $ref, or properties`
      }
    ]
  }
}