# Architecture Decision Record for Openapi

## Title: Having No Releases for DO Specification
## Date: 10/31/2022
## Description
We will not be supporting releases for the official DO Specification.
## Additional Context
Created a PR that supported adding releases to the specification (here)[https://github.com/digitalocean/openapi]. After much consideration, we've decided to not move forward with supporting releases. We originally thought to support it to easily associate the versioned specification to the generated python client, Pydo, but decided it was a bit of an overkill.  