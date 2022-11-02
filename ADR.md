# Architecture Decision Record for Openapi

## Title: Not supporting application/yaml as request content type.
## Date: 11/02/2022
## Description
We do not support adding `application/yaml` as a request content type.

There are two main reasons for this decision: 
* The content-typ causes failures with python client generation 
* Redoc does not properly render yaml examples as yaml content but rather as json.
## Additional Context

See [#738](https://github.com/digitalocean/openapi/pull/) for more details,
discussion, and suggested fixes.

---

## Title: Having No Releases for DO Specification
## Date: 10/31/2022
## Description
We will not be supporting releases for the official DO Specification.
## Additional Context
Created a PR that supported adding releases to the specification (here)[https://github.com/digitalocean/openapi]. After much consideration, we've decided to not move forward with supporting releases. We originally thought to support it to easily associate the versioned specification to the generated python client, Pydo, but decided it was a bit of an overkill.  