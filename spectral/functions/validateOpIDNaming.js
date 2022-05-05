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
              "recycle", "run", "retry", "validate", "assign", , "unassign"];
const PUT = ["update"];

const articles = ["_a_", "_an_", "_the_"]

module.exports = (endpoint, _, { given }) => {
  path = given[1];
  method = given[2];
  operationId = endpoint.operationId;
  suffix = operationId.split("_")[1];

  switch (method) {
    case "delete":
      if (!(DELETE.includes(suffix))) {
        return [{
          message:
            `${method.toUpperCase()} ${path} - ${operationId} should end with one of: ${DELETE.join(", ")}. Prefer 'delete'. Example OperationID: droplet_delete`
        }];
      }
      break;
    case "get":
      if (!(GET.includes(suffix))) {
        return [{
          message: `${method.toUpperCase()} ${path} - ${operationId} should end with one of: ${GET.join(", ")}. Prefer 'get' for retrieving a single object and 'list' for multiple objects. Example OperationID: get_droplet`
        }];
      }
      break;
    case "patch":
      if (!(PATCH.includes(suffix))) {
        return [{
          message: `${method.toUpperCase()} ${path} - ${operationId} should end with one of: ${PATCH.join(", ")}. Prefer 'patch'. Example OperationID: patch_droplet`
        }];
      }
      break;
    case "post":
      if (!(POST.includes(suffix))) {
        return [{
          message: `${method.toUpperCase()} ${path} - ${operationId} should end with one of: ${POST.join(", ")}. Prefer 'create' for new resources. Custom verbs may be acceptable for clarity. Example OperationID: create_droplet`
        }];
      }
      break;
    case "put":
      if (!(PUT.includes(suffix))) {
        return [{
          message: `${method.toUpperCase()} ${path} - ${operationId} should end with one of: ${PUT.join(", ")}. Prefer 'update'. Example OperationID: droplet_update` }];
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