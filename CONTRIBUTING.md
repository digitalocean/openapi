# Contributing

We welcome and encourage contributions from the community.
Keep in mind that this spec describes the current production API so changes
must reflect actual behavior of the API.

---

## Development

### Prerequisites

The following tools are required

* [`Git`](https://git-scm.com/): Interact with the source code
* [`Make`](https://www.gnu.org/software/make/manual/make.html): Used to maintain
  common commands for use in the development environment or build system
* [`Node.js`](https://nodejs.org/): For managing dependencies and running tools
* [`Docker`](https://www.docker.com/get-started): For running tools in isolation

### Installation

Once the prerequisites are installed, the source can be downloaded and the
dependencies can be installed:

```bash
git clone git@github.com:digitalocean/apiv2-openapi.git
cd apiv2-openapi
make preview
```

The `make preview` command starts a local web server with the rendered API docs
and watches the source files for changes. The rendered docs can be viewed in
the browser at the address listed in the startup output (<http://localhost:8080>).

### Tooling

The tooling chosen supports either authoring, validation, testing, or
publishing. Respective Make target

* [Spectral](https://stoplight.io/open-source/spectral/): JSON/YAML linter with
  support for OpenAPI v3, custom rules, built-in functions, and custom functions
* [Prism](https://stoplight.io/open-source/prism/): Set of packages to API
  mocking. Also provides a live validation proxy.
* [OpenAPI CLI](https://github.com/Redocly/openapi-cli): OpenAPI CLI toolbox
  with rich validation and bundling features.

In addition, the following tools are leveraged to facilitate authoring the spec.

#### Visual Studio Code Extensions

These are useful extensions when choosing to author OpenAPI spec using Visual
Studio Code.

* [Spectral](https://marketplace.visualstudio.com/items?itemName=stoplight.spectral):
  View linting violations inline
* [OpenAPI Preview](https://marketplace.visualstudio.com/items?itemName=zoellner.openapi-preview):
  Preview the API spec in SwaggerUI within the editor
* [YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml):
  Base YAML syntax validation
* [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker):
  View/Manage containers within the editor sidebar

---

## Conventions

This API documentation follows the
[OpenAPI Version 3](https://swagger.io/specification/) specification.

Additionally, some conventions are established for organization and naming
to enable consistency. While most are agnostic of upstream or downstream
tooling, certain cases are adopted to support specific tooling.

Validation of these conventions is implemnted, when possible, using
[spectral]([spectral](.spectral.yml)) rules and functions.

### Repository Structure

These files and directories contain the API specification broken down to

```text
├── specification
│   ├── DigitalOcean-public.v2.yaml:  Root YAML spec file
│   ├── resources/:  Contains directories for each top-level resource (referenced from the `paths` section in the root file)
│   │   ├── <resource_name>/:  Resource specific content
│   │   │   ├── examples/<lang>/<example-name>.yml:  Language specific (e.g. curl, go) request and response examples
│   │   │   ├── models/:  Request and response models 
│   │   │   ├── responses/:  Response definition to reference from respective request definition file
│   │   │   ├── <request_definition>.yml:  Request definition to be referenced from respective path section in root file
│   ├── shared/:  Generalized definitions referenced across the API spec
│   │   ├── headers.yml:  Header definition (separated by named keys)
│   │   ├── attributes/:  Collection of common attributes
│   │   │   ├── <attribute_name>.yml:  Individual attribute definition
│   │   ├── models/:  Collection of common models
│   │   │   ├── <model_name>.yml:  Individual model definition
│   │   ├── parameters.yml:  Parameter definition (separated by named keys)
│   │   └── responses/:  Response definitions
│   │   │   ├── <response_name>.yml:  Individual response definition
│   └── tests/:  Placeholder directory for test generation and output
```

### OperationID naming

This convention establishes a naming pattern for operationIDs. The pattern is
influenced by how the tool used to generate clients
([autorest](https://azure.github.io/autorest/generate/how-autorest-generates-code-from-openapi.html#generating-operation-classes)).
groups operations as methods of classes.

#### Pattern

`{resourceName}_{opAlias}[_{optionalOpDetails}]`

* `resourceName`:
  * The top-level product/resource (e.g. droplets, dropletActions)
  * If this section is comprised of two words (e.g. droplet actions), this
    part is camel-cased (e.g. dropletActions).
* `opAlias`:
  * The relative HTTP verb (e.g. get, put, post, delete)
  * Alternatively, one of the configured verb aliases. For example, a valid
    alternative for POST could be `create` or `add`. (e.g. `droplets_create`).
  * Custom verbs can be added to improve clarity.
  * See the validation function for the full list of allowed verb aliases.
* `optionalOpDetails`:
  * Any additional operation details (e.g. droplets_list_backups).
  * This section can contain multiple underscores.

The `opAlias` and `optionalOpDetails` ultimately become the
method name used in the generated client. So any separation by underscores or
camel casing is for readability.

Examples:

* `droplet_create`
* `droplets_list_backups`
* `firewalls_get`
* `firewalls_add_tags`
* `floatingIPs_list`
* `floatingIPsAction_list`
* `kubernetes_get_cluster`
* `kubernetes_destroy_associatedResourcesSelective` (note: this
  optionalOpDetails is currently camel cased)

#### Validation function

[validateOpIDNaming.js](spectral/functions/validateOpIDNaming.js)