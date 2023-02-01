/*
 *
 * Validate that the operationId follows the naming conventions for method
 * in order to maintain consistency.
 *
 */

const DELETE = ["delete", "destroy", "remove", "purge", "untag", "unassign"];
const GET = ["get", "list"];
const PATCH = ["patch"];
const POST = ["create", "post", "add", "tag", "install", "reset", "upgrade",
  "recycle", "run", "retry", "validate", "assign", "unassign", "cancel",
  "destroy", "delete", "update", "attach", "revert", "commit"];
const PUT = ["update"];

const articles = ["_a_", "_an_", "_the_"]

const NAMING_DOCS = "https://github.com/digitalocean/openapi/blob/main/CONTRIBUTING.md#operationid-naming"

export default (input, _, context) => {
  if (context.path[0] == "paths") {
    var path = context.path[1];
    var method = context.path[2];
    var operationId = input.operationId;
    var opAlias = operationId.split("_")[1];

    switch (method) {
      case "delete":
        if (!(DELETE.includes(opAlias))) {
          return [{
            message:
              `${method.toUpperCase()} ${path} - ${operationId}: '${opAlias}' is an invalid {opAlias}: ${DELETE.join(", ")}. Prefer 'delete'. ${NAMING_DOCS}`
          }];
        }
        break;
      case "get":
        if (!(GET.includes(opAlias))) {
          return [{
            message: `${method.toUpperCase()} ${path} - ${operationId}: '${opAlias}' is an invalid {opAlias}: ${GET.join(", ")}. Prefer 'get' for retrieving a single object and 'list' for multiple objects. ${NAMING_DOCS}`
          }];
        }
        break;
      case "patch":
        if (!(PATCH.includes(opAlias))) {
          return [{
            message: `${method.toUpperCase()} ${path} - ${operationId}: '${opAlias}' is an invalid {opAlias}: ${PATCH.join(", ")}. Prefer 'patch'. ${NAMING_DOCS}`
          }];
        }
        break;
      case "post":
        if (!(POST.includes(opAlias))) {
          return [{
            message: `${method.toUpperCase()} ${path} - ${operationId}: '${opAlias}' is an invalid {opAlias}: ${POST.join(", ")}. Prefer 'create' for new resources. Custom verbs may be acceptable for clarity. ${NAMING_DOCS}`
          }];
        }
        break;
      case "put":
        if (!(PUT.includes(opAlias))) {
          return [{
            message: `${method.toUpperCase()} ${path} - ${operationId} is an invalid {opAlias}: ${PUT.join(", ")}. Prefer 'update'. ${NAMING_DOCS}`
          }];
        }
        break;
      default:
        break;
    }

    for (let i in articles) {
      if (operationId.includes(articles[i])) {
        return [{
          message: `${operationId} - operationId should not include an article (a, an, or the).`
        }];
      }
    }
  }
}
