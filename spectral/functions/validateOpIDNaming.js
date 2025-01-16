/*
 *
 * Validate that the operationId follows the naming conventions for method
 * in order to maintain consistency.
 *
 */

const DELETE = ["delete", "destroy", "remove", "purge", "untag", "unassign", "detach"];
const GET = ["get", "list"];
const PATCH = ["patch"];
const POST = ["create", "post", "add", "tag", "install", "reset", "upgrade",
  "recycle", "run", "retry", "validate", "assign", "unassign", "cancel", "list",
  "destroy", "delete", "update", "attach", "revert", "commit", "restart"];
const PUT = ["update", "promote", "install", "regenerate", "cancel"];

const articles = ["_a_", "_an_", "_the_"]

export default (input, _, context) => {
  if (context.path[0] == "paths") {
    var path = context.path[1];
    var method = context.path[2];
    var operationId = input.operationId;
    var suffix = operationId.split("_")[1];

    switch (method) {
      case "delete":
        if (!(DELETE.includes(suffix))) {
          return [{
            message:
              `${method.toUpperCase()} ${path} - ${operationId}: first segment after the namespace should start with one of: ${DELETE.join(", ")}. Prefer 'delete'. Example OperationID: droplet_delete`
          }];
        }
        break;
      case "get":
        if (!(GET.includes(suffix))) {
          return [{
            message: `${method.toUpperCase()} ${path} - ${operationId}: first segment after the namespace should start with one of: ${GET.join(", ")}. Prefer 'get' for retrieving a single object and 'list' for multiple objects. Example OperationID: droplet_get, droplets_list_firewalls`
          }];
        }
        break;
      case "patch":
        if (!(PATCH.includes(suffix))) {
          return [{
            message: `${method.toUpperCase()} ${path} - ${operationId}: first segment after the namespace should start with one of: ${PATCH.join(", ")}. Prefer 'patch'. Example OperationID: droplet_patch`
          }];
        }
        break;
      case "post":
        if (!(POST.includes(suffix))) {
          return [{
            message: `${method.toUpperCase()} ${path} - ${operationId}: first segment after the namespace should start with one of: ${POST.join(", ")}. Prefer 'create' for new resources. Custom verbs may be acceptable for clarity. Example OperationID: droplet_create`
          }];
        }
        break;
      case "put":
        if (!(PUT.includes(suffix))) {
          return [{
            message: `${method.toUpperCase()} ${path} - ${operationId}: first segment after the namespace should start with one of: ${PUT.join(", ")}. Prefer 'update'. Example OperationID: droplet_update`
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
