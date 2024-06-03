# DigitalOcean OpenAPI Specification
![Spec Main](https://github.com/digitalocean/apiv2-openapi/workflows/Spec%20Main/badge.svg) ![Status](https://img.shields.io/badge/Status-Early%20Availability-blue)

The OpenAPI v3 specification for [DigitalOcean's public API v2](https://developers.digitalocean.com/documentation/v2/).

## What is OpenAPI?

From the [OpenAPI Specification](https://swagger.io/specification/):

> The OpenAPI Specification (OAS) defines a standard, language-agnostic interface to RESTful APIs which allows both humans and computers to discover and understand the capabilities of the service without access to source code, documentation, or through network traffic inspection. When properly defined, a consumer can understand and interact with the remote service with a minimal amount of implementation logic.

> An OpenAPI definition can then be used by documentation generation tools to display the API, code generation tools to generate servers and clients in various programming languages, testing tools, and many other use cases.

## Project Status

The DigitalOcean OpenAPI Specification is currently in **Early Availability**. While the specification should be accurate, it is under active development. The structure of this repository may continue to evolve. If you encounter any inaccuracies or have feedback on how it can better suite your use case, please [open an issue](https://github.com/digitalocean/apiv2-openapi/issues/new) to let us know.

## Specification

This repository contains the source files used to compile the specification. On each merge to `main`, a bundled version is generated containing the entire specification. A documentation preview using [Redoc](https://github.com/Redocly/redoc) is also provided.

[![Spec Download](https://img.shields.io/badge/Download-OpenAPI%20v3%20Spec-blue?style=for-the-badge&logo=digitalocean)](https://api-engineering.nyc3.digitaloceanspaces.com/spec-ci/DigitalOcean-public.v2.yaml) [![Docs Preview](https://img.shields.io/badge/Preview-OpenAPI%20Documentation-blue?style=for-the-badge&logo=digitalocean)](https://api-engineering.nyc3.digitaloceanspaces.com/spec-ci/redoc-index.html)

#### Postman Collection

In order to generate a collection that may be imported to Postman, run:

```sh
make collection
```

The results can be found in `tests/postman.json`.

## Development

To generate a bundled version of the specification locally, run:

```sh
make bundle
```

To preview the documentation locally, run:

```sh
make preview
```

The documentation will be available at: `http://127.0.0.1:8080`.

For more details on our development process and the structure of this repository, see [CONTRIBUTING.md](/CONTRIBUTING.md).

## License

This specification is licensed under the Apache License 2.0.