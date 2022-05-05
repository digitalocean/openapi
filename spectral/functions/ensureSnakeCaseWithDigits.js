/*
 *
 * Ensures the the property is in snake_case (this may include camelCase) and allows for digits.
 * A custom function is needed as the built-in Spectral rule does not
 * allow for leading digits.
 *
 */

module.exports = (param, _, paths) => {
    const re = RegExp('^(([a-z]+([A-Z0-9a-z]+)*([A-Z])*)_)+[a-zA-Z0-9]+$');

    if (re.test(param)) { return }

    return [{
        message: `${paths.target ? paths.target.join('.') : 'property'} is not snake_case or camelCase`
    }]
}