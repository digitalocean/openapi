
POSTMAN_BASE_URL ?= http://localhost:8000
PROXY_TARGET ?= http://mock:4010

SPEC_FILE ?= specification/DigitalOcean-public.v2.yaml
BUNDLE_PATH ?= tests/openapi-bundled.yaml
COLLECTION_PATH ?= tests/postman.json
TMP_COLLECTION_PATH ?= tests/postman-temp.json

DO_TOKEN ?= XXXXXX

# ORIGIN is used when testing release code
ORIGIN ?= origin
BUMP ?= patch

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: dev-dependencies
dev-dependencies: ## Install development tooling using npm
	npm install

.PHONY: start-mockedproxy
start-mockedproxy: ## Start a prism proxy (port 8000) targeting a local mock api (port 4010)
	PROXY_TARGET=$(PROXY_TARGET) docker-compose up -d

.PHONY: stop-services
stop-services: ## Stop the proxy with mock docker services
	docker-compose down

.PHONY: start-prodproxy
start-prodproxy: ## Start a proxy to the production
	 PROXY_TARGET=https://api.digitalocean.com docker-compose up proxy

.PHONY: _sleep
_sleep:
	sleep 3

.PHONY: test
test: dev-dependencies bundle collection start-mockedproxy _sleep ## Run Postman collection against local proxy with validation
	npm run newman -- ${COLLECTION_PATH} \
		--env-var baseUrl=${POSTMAN_BASE_URL} \
		--env-var accessToken=${DO_TOKEN} \
		--reporters json,cli \
		--reporter-json-export newman-results.json

.PHONY: lint
lint: dev-dependencies bundle ## Lint the OpenAPI spec using Spectral
	npm run lint -- ${SPEC_FILE}
	npm run lint -- --ruleset spectral/bundled.spectral.yml ${BUNDLE_PATH}

.PHONY: collection
collection: dev-dependencies bundle ## Use openapi-to-postmanv2 to generate a collection
	npm run collection -- -s ${BUNDLE_PATH} -o ${TMP_COLLECTION_PATH}
	jq --argjson authToken '{"bearer":[{"key":"token","value":"{{accessToken}}","type":"string"}]}' \
		'.auth += $$authToken' ${TMP_COLLECTION_PATH} > ${COLLECTION_PATH}
	rm -f ${TMP_COLLECTION_PATH}

.PHONY: bundle
bundle: dev-dependencies ## Use openapi-cli to bundle the spec
	npm run bundle -- ${SPEC_FILE} -o ${BUNDLE_PATH}

.PHONY: autorest-python
autorest-python: dev-dependencies bundle 
	npm run autorest -- auto.yaml --verbose --python --add-credential

.PHONY: autorest-typescript
autorest-typescript: dev-dependencies bundle 
	npm run autorest -- auto.yaml --verbose --typescript

.PHONY: preview
preview: dev-dependencies ## Launch the docs preview server (openapi) and watch for file changes
	SPEC_FILE=${SPEC_FILE} npm run preview

.PHONY: _install_sembump
_install_sembump:
	@echo "=> installing/updating sembump tool"
	@echo ""
	@GO111MODULE=off go get -u github.com/jessfraz/junk/sembump

.PHONY: tag
tag: _install_sembump
	@echo "==> BUMP=${BUMP} tag"
	@echo ""
	@ORIGIN=${ORIGIN} scripts/bumpversion.sh

.PHONY: _install_github_release_notes
_install_github_release_notes:
	GO111MODULE=off go get -u github.com/digitalocean/github-changelog-generator

.PHONY: changes
changes: _install_github_release_notes
	echo "==> list merged PRs since last release"
	echo ""
	changes=$(shell scripts/changelog.sh) && cat $$changes && rm -f $$changes