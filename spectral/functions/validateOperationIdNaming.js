/*
 *
 * Validate that the operationId follows the naming conventions for method
 * in order to maintain consistency.
 *
 */

const DELETE = ["delete", "destroy", "remove", "purge", "untag"];
const GET = ["get", "list"];
const PATCH = ["patch"];
const POST = ["create", "post", "add", "tag", "install", "reset", "upgrade",
              "recycle", "run", "retry", "validate", "assign"];
const PUT = ["update"];

const articles = ["_a_", "_an_", "_the_"]

module.exports = (endpoint, _, { given }) => {
  path = given[1];
  method = given[2];
  operationId = endpoint.operationId;
  prefix = operationId.split("_")[0];

  switch (method) {
    case "delete":
      if (!(DELETE.includes(prefix))) {
        return [{
          message:
            `${method.toUpperCase()} ${path} - ${operationId} should start with one of: ${DELETE.join(", ")}. Prefer 'delete'.`
        }];
      }
      break;
    case "get":
      if (!(GET.includes(prefix))) {
        return [{
          message: `${method.toUpperCase()} ${path} - ${operationId} should start with one of: ${GET.join(", ")}. Prefer 'get' for retrieving a single object and 'list' for multiple objects.`
        }];
      }
      break;
    case "patch":
      if (!(PATCH.includes(prefix))) {
        return [{
          message: `${method.toUpperCase()} ${path} - ${operationId} should start with one of: ${PATCH.join(", ")}. Prefer 'patch'.`
        }];
      }
      break;
    case "post":
      if (!(POST.includes(prefix))) {
        return [{
          message: `${method.toUpperCase()} ${path} - ${operationId} should start with one of: ${POST.join(", ")}. Prefer 'create' for new resources. Custom verbs may be acceptable for clarity.`
        }];
      }
      break;
    case "put":
      if (!(PUT.includes(prefix))) {
        return [{
          message: `${method.toUpperCase()} ${path} - ${operationId} should start with one of: ${PUT.join(", ")}. Prefer 'update'.`
        }];
      }
      break;
    default:
      break;
  }

  for (i in articles) {
    if (operationId.includes(articles[i])) {
      return [{
        message: `${operationId} - operationId should not include an article (a, an, or the).`
      }];
    }
  }
}