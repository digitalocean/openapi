/**
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
