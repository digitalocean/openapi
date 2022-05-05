/*
 *
 * Ensures the the property is in snake_case and allows for digits.
 * A custom function is needed as the built-in Spectral rule does not
 * allow for leading digits.
 *
 */

module.exports = (param, _, paths) => {
    const re = RegExp('^(([A-Z0-9a-z]+([A-Z])*)(\.|_))+[A-Z0-9a-z]+$');

    if (re.test(param)) { return }

    return [{
        message: `${paths.target ? paths.target.join('.') : 'property'} is not snake_case`
    }]
}