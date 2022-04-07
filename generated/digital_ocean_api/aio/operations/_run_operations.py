# pylint: disable=too-many-lines
# coding=utf-8
# --------------------------------------------------------------------------
# Code generated by Microsoft (R) AutoRest Code Generator (autorest: 3.8.3, generator: @autorest/python@5.14.0)
# Changes may cause incorrect behavior and will be lost if the code is regenerated.
# --------------------------------------------------------------------------
from typing import Any, Callable, Dict, Optional, TypeVar, Union

from azure.core.exceptions import ClientAuthenticationError, HttpResponseError, ResourceExistsError, ResourceNotFoundError, map_error
from azure.core.pipeline import PipelineResponse
from azure.core.pipeline.transport import AsyncHttpResponse
from azure.core.rest import HttpRequest
from azure.core.tracing.decorator_async import distributed_trace_async

from ... import models as _models
from ..._vendor import _convert_request
from ...operations._run_operations import build_clusterlint_request, build_garbage_collection_request
T = TypeVar('T')
ClsType = Optional[Callable[[PipelineResponse[HttpRequest, AsyncHttpResponse], T, Dict[str, Any]], Any]]

class RunOperations:
    """
    .. warning::
        **DO NOT** instantiate this class directly.

        Instead, you should access the following operations through
        :class:`~digital_ocean_api.aio.DigitalOceanAPI`'s
        :attr:`run` attribute.
    """

    models = _models

    def __init__(self, *args, **kwargs) -> None:
        args = list(args)
        self._client = args.pop(0) if args else kwargs.pop("client")
        self._config = args.pop(0) if args else kwargs.pop("config")
        self._serialize = args.pop(0) if args else kwargs.pop("serializer")
        self._deserialize = args.pop(0) if args else kwargs.pop("deserializer")


    @distributed_trace_async
    async def clusterlint(
        self,
        body: Optional["_models.ClusterlintRequest"] = None,
        **kwargs: Any
    ) -> Union["_models.ComponentsO4VmziResponsesClusterlintRunContentApplicationJsonSchema", "_models.Error"]:
        """Run Clusterlint Checks on a Kubernetes Cluster.

        Clusterlint helps operators conform to Kubernetes best practices around
        resources, security and reliability to avoid common problems while operating
        or upgrading the clusters.

        To request a clusterlint run on your cluster, send a POST request to
        ``/v2/kubernetes/clusters/$K8S_CLUSTER_ID/clusterlint``. This will run all
        checks present in the ``doks`` group by default, if a request body is not
        specified. Optionally specify the below attributes.

        For information about the available checks, please refer to
        `the clusterlint check documentation
        <https://github.com/digitalocean/clusterlint/blob/master/checks.md>`_.

        :param body:  Default value is None.
        :type body: ~digital_ocean_api.models.ClusterlintRequest
        :keyword callable cls: A custom type or function that will be passed the direct response
        :return: ComponentsO4VmziResponsesClusterlintRunContentApplicationJsonSchema or Error, or the
         result of cls(response)
        :rtype:
         ~digital_ocean_api.models.ComponentsO4VmziResponsesClusterlintRunContentApplicationJsonSchema
         or ~digital_ocean_api.models.Error
        :raises: ~azure.core.exceptions.HttpResponseError
        """
        cls = kwargs.pop('cls', None)  # type: ClsType[Union["_models.ComponentsO4VmziResponsesClusterlintRunContentApplicationJsonSchema", "_models.Error"]]
        error_map = {
            401: ClientAuthenticationError, 404: ResourceNotFoundError, 409: ResourceExistsError
        }
        error_map.update(kwargs.pop('error_map', {}))

        content_type = kwargs.pop('content_type', "application/json")  # type: Optional[str]

        if body is not None:
            _json = self._serialize.body(body, 'ClusterlintRequest')
        else:
            _json = None

        request = build_clusterlint_request(
            cluster_id=self._config.cluster_id,
            content_type=content_type,
            json=_json,
            template_url=self.clusterlint.metadata['url'],
        )
        request = _convert_request(request)
        request.url = self._client.format_url(request.url)

        pipeline_response = await self._client._pipeline.run(  # pylint: disable=protected-access
            request,
            stream=False,
            **kwargs
        )
        response = pipeline_response.http_response

        if response.status_code not in [202, 401, 404, 429, 500]:
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = self._deserialize.failsafe_deserialize(_models.Error, pipeline_response)
            raise HttpResponseError(response=response, model=error)

        response_headers = {}
        if response.status_code == 202:
            response_headers['ratelimit-limit']=self._deserialize('int', response.headers.get('ratelimit-limit'))
            response_headers['ratelimit-remaining']=self._deserialize('int', response.headers.get('ratelimit-remaining'))
            response_headers['ratelimit-reset']=self._deserialize('int', response.headers.get('ratelimit-reset'))
            
            deserialized = self._deserialize('ComponentsO4VmziResponsesClusterlintRunContentApplicationJsonSchema', pipeline_response)

        if response.status_code == 401:
            response_headers['ratelimit-limit']=self._deserialize('int', response.headers.get('ratelimit-limit'))
            response_headers['ratelimit-remaining']=self._deserialize('int', response.headers.get('ratelimit-remaining'))
            response_headers['ratelimit-reset']=self._deserialize('int', response.headers.get('ratelimit-reset'))
            
            deserialized = self._deserialize('Error', pipeline_response)

        if response.status_code == 404:
            response_headers['ratelimit-limit']=self._deserialize('int', response.headers.get('ratelimit-limit'))
            response_headers['ratelimit-remaining']=self._deserialize('int', response.headers.get('ratelimit-remaining'))
            response_headers['ratelimit-reset']=self._deserialize('int', response.headers.get('ratelimit-reset'))
            
            deserialized = self._deserialize('Error', pipeline_response)

        if response.status_code == 429:
            response_headers['ratelimit-limit']=self._deserialize('int', response.headers.get('ratelimit-limit'))
            response_headers['ratelimit-remaining']=self._deserialize('int', response.headers.get('ratelimit-remaining'))
            response_headers['ratelimit-reset']=self._deserialize('int', response.headers.get('ratelimit-reset'))
            
            deserialized = self._deserialize('Error', pipeline_response)

        if response.status_code == 500:
            response_headers['ratelimit-limit']=self._deserialize('int', response.headers.get('ratelimit-limit'))
            response_headers['ratelimit-remaining']=self._deserialize('int', response.headers.get('ratelimit-remaining'))
            response_headers['ratelimit-reset']=self._deserialize('int', response.headers.get('ratelimit-reset'))
            
            deserialized = self._deserialize('Error', pipeline_response)

        if cls:
            return cls(pipeline_response, deserialized, response_headers)

        return deserialized

    clusterlint.metadata = {'url': "/v2/kubernetes/clusters/{cluster_id}/clusterlint"}  # type: ignore


    @distributed_trace_async
    async def garbage_collection(
        self,
        **kwargs: Any
    ) -> Union["_models.ComponentsV728JgResponsesGarbageCollectionContentApplicationJsonSchema", "_models.Error"]:
        """Start Garbage Collection.

        Garbage collection enables users to clear out unreferenced blobs (layer &
        manifest data) after deleting one or more manifests from a repository. If
        there are no unreferenced blobs resulting from the deletion of one or more
        manifests, garbage collection is effectively a noop.
        `See here for more information
        <https://www.digitalocean.com/docs/container-registry/how-to/clean-up-container-registry/>`_
        about how and why you should clean up your container registry periodically.

        To request a garbage collection run on your registry, send a POST request to
        ``/v2/registry/$REGISTRY_NAME/garbage-collection``. This will initiate the
        following sequence of events on your registry.


        * Set the registry to read-only mode, meaning no further write-scoped
          JWTs will be issued to registry clients. Existing write-scoped JWTs will
          continue to work until they expire which can take up to 15 minutes.
        * Wait until all existing write-scoped JWTs have expired.
        * Scan all registry manifests to determine which blobs are unreferenced.
        * Delete all unreferenced blobs from the registry.
        * Record the number of blobs deleted and bytes freed, mark the garbage
          collection status as ``success``.
        * Remove the read-only mode restriction from the registry, meaning write-scoped
          JWTs will once again be issued to registry clients.

        :keyword callable cls: A custom type or function that will be passed the direct response
        :return: ComponentsV728JgResponsesGarbageCollectionContentApplicationJsonSchema or Error, or
         the result of cls(response)
        :rtype:
         ~digital_ocean_api.models.ComponentsV728JgResponsesGarbageCollectionContentApplicationJsonSchema
         or ~digital_ocean_api.models.Error
        :raises: ~azure.core.exceptions.HttpResponseError
        """
        cls = kwargs.pop('cls', None)  # type: ClsType[Union["_models.ComponentsV728JgResponsesGarbageCollectionContentApplicationJsonSchema", "_models.Error"]]
        error_map = {
            401: ClientAuthenticationError, 404: ResourceNotFoundError, 409: ResourceExistsError
        }
        error_map.update(kwargs.pop('error_map', {}))

        
        request = build_garbage_collection_request(
            registry_name=self._config.registry_name,
            template_url=self.garbage_collection.metadata['url'],
        )
        request = _convert_request(request)
        request.url = self._client.format_url(request.url)

        pipeline_response = await self._client._pipeline.run(  # pylint: disable=protected-access
            request,
            stream=False,
            **kwargs
        )
        response = pipeline_response.http_response

        if response.status_code not in [201, 401, 404, 429, 500]:
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = self._deserialize.failsafe_deserialize(_models.Error, pipeline_response)
            raise HttpResponseError(response=response, model=error)

        response_headers = {}
        if response.status_code == 201:
            response_headers['ratelimit-limit']=self._deserialize('int', response.headers.get('ratelimit-limit'))
            response_headers['ratelimit-remaining']=self._deserialize('int', response.headers.get('ratelimit-remaining'))
            response_headers['ratelimit-reset']=self._deserialize('int', response.headers.get('ratelimit-reset'))
            
            deserialized = self._deserialize('ComponentsV728JgResponsesGarbageCollectionContentApplicationJsonSchema', pipeline_response)

        if response.status_code == 401:
            response_headers['ratelimit-limit']=self._deserialize('int', response.headers.get('ratelimit-limit'))
            response_headers['ratelimit-remaining']=self._deserialize('int', response.headers.get('ratelimit-remaining'))
            response_headers['ratelimit-reset']=self._deserialize('int', response.headers.get('ratelimit-reset'))
            
            deserialized = self._deserialize('Error', pipeline_response)

        if response.status_code == 404:
            response_headers['ratelimit-limit']=self._deserialize('int', response.headers.get('ratelimit-limit'))
            response_headers['ratelimit-remaining']=self._deserialize('int', response.headers.get('ratelimit-remaining'))
            response_headers['ratelimit-reset']=self._deserialize('int', response.headers.get('ratelimit-reset'))
            
            deserialized = self._deserialize('Error', pipeline_response)

        if response.status_code == 429:
            response_headers['ratelimit-limit']=self._deserialize('int', response.headers.get('ratelimit-limit'))
            response_headers['ratelimit-remaining']=self._deserialize('int', response.headers.get('ratelimit-remaining'))
            response_headers['ratelimit-reset']=self._deserialize('int', response.headers.get('ratelimit-reset'))
            
            deserialized = self._deserialize('Error', pipeline_response)

        if response.status_code == 500:
            response_headers['ratelimit-limit']=self._deserialize('int', response.headers.get('ratelimit-limit'))
            response_headers['ratelimit-remaining']=self._deserialize('int', response.headers.get('ratelimit-remaining'))
            response_headers['ratelimit-reset']=self._deserialize('int', response.headers.get('ratelimit-reset'))
            
            deserialized = self._deserialize('Error', pipeline_response)

        if cls:
            return cls(pipeline_response, deserialized, response_headers)

        return deserialized

    garbage_collection.metadata = {'url': "/v2/registry/{registry_name}/garbage-collection"}  # type: ignore
