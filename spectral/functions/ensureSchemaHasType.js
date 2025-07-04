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
 * Ensures that every schema property has a type defined
 *
 * This function validates that all schema properties include a 'type' field,
 * unless they have other valid schema indicators like $ref, allOf, anyOf, oneOf
 */
export default (input, _, context) => {
	if (!input || typeof input !== "object") {
		return;
	}

	if (input["$ref"]) {
		return;
	}

	if (input["allOf"] || input["anyOf"] || input["oneOf"]) {
		return;
	}

	if (context.path.join(".").endsWith(".properties")) {
		return;
	}

	const pathString = context.path.join(".");
	if (pathString.includes(".items.") && !pathString.endsWith(".items")) {
		return;
	}

	const hasSchemaLikeProperties =
		input.description ||
		input.example ||
		input.items ||
		input.properties ||
		input.enum ||
		input.format ||
		input.minimum ||
		input.maximum ||
		input.minLength ||
		input.maxLength;

	if (hasSchemaLikeProperties && !input.type) {
		return [ {message: `Schema property is missing 'type' field. Path: ${context.path.join(".")}`,},];
	}
};
