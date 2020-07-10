
POSTMAN_BASE_URL ?= http://localhost:8080
PROXY_TARGET ?= http://mock:4010

SPEC_FILE ?= DigitalOcean-public.v2.yaml

## TODO: This is an inital (temporary) collection 
## This file is generated through Postman from the spec (through the app)
## This will be replaced with an automated way to generate the collection in APICLI-401
COLLECTION_PATH ?= tests/DigitalOcean.postman_collection.json

NEWMAN_CMD = npx newman run ${COLLECTION_PATH}
DO_TOKEN ?= XXXXXX

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: start-mockedproxy
start-mockedproxy: ## Start a prism proxy (port 8080) targeting a local mock api (port 4010)
	PROXY_TARGET=$(PROXY_TARGET) docker-compose up -d

.PHONY: stop-services
stop-services: ## Stop the proxy with mock docker services
	docker-compose down

.PHONY: start-prodproxy
start-prodproxy: ## Start a proxy to the production 
	 PROXY_TARGET=https://api.digitalocean.com/v2 docker-compose up proxy

.PHONY: _sleep
_sleep:
	sleep 3

.PHONY: test
test: start-mockedproxy _sleep ## Run Postman collection against local proxy with validation
	@$(NEWMAN_CMD) \
		--env-var baseUrl=${POSTMAN_BASE_URL} \
		--env-var accessToken=${DO_TOKEN} \
		--reporters json,cli \
		--reporter-json-export newman-results.json

.PHONY: bundle-spec
bundle-spec:
	npx @redocly/openapi-cli bundle $(SPEC_FILE) -o DigitalOcean-public.v2.json
