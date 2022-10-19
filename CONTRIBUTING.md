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

```
git clone git@github.com:digitalocean/apiv2-openapi.git
cd apiv2-openapi
make preview
```

The `make preview` command starts a local web server with the rendered API docs 
and watches the source files for changes. The rendered docs can be viewed in 
the browser at the address listed in the startup output (http://localhost:8080).

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
## Repository Structure

These files and directories contain the API specification broken down to 

```
├── specification
│   ├── DigitalOcean-public.v2.yaml:  Root YAML spec file
│   ├── resources/:  Contains directories for each top-level resource (referenced from the `paths` section in the root file)
│   │   ├── <resource_name>/:  Resource specific content
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

## Releasing

To cut a release, push a new tag (versioning discussed below).

### Tagging a release

##### Prerequisites

1. Run `make changes` to review the changes since the last
   release. Based on the changes, decide what kind of release you are
   doing (bugfix, feature or breaking).
   `digitalocean/openapi` follows [semantic versioning](https://semver.org), ask if you aren't sure.

2. Tag the release using `BUMP=(bugfix|feature|breaking) make tag`.
   (Bugfix, feature and breaking are aliases for semver's patch, minor and major.
   BUMP will also accept `patch`, `minor` and `major`, if you prefer). The command
   assumes you have a remote repository named `origin` pointing to this
   repository. If you'd prefer to specify a different remote repository, you can
   do so by setting `ORIGIN=(preferred remote name)`.

3. The release will trigger a workflow in [digitalocean/pydo](https://github.com/digitalocean/pydo) to update the DigitalOcean Python Client, Pydo, to ensure the spec changes are reflected in the client. The workflow will create a PR to be reviewed by the owners of the Pydo repo. 

The new tag triggers the release.