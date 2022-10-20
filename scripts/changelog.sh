#!/usr/bin/env bash

set -o pipefail

tfile=$(mktemp /tmp/openapi-CHANGELOG-XXXXXX)
github-changelog-generator -org digitalocean -repo openapi >"$tfile"

GO111MODULE=on go mod tidy

echo "$tfile"