/*
 *
 * Ensures the the property is in snake_case and allows for digits.
 * A custom function is needed as the built-in Spectral rule does not
 * allow for leading digits.
 *
 */

export default (input, _, context) => {
    const re = RegExp('^(([A-Z0-9a-z]+([A-Z])*)(\.|_)*)+[A-Z0-9a-z]+$');

    if (re.test(input)) { return }

    return [{
        message: `${context.path ? context.path : 'property'} is not snake_case`
    }]
}