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
from ...operations._install_operations import build_kubernetes_request
T = TypeVar('T')
ClsType = Optional[Callable[[PipelineResponse[HttpRequest, AsyncHttpResponse], T, Dict[str, Any]], Any]]

class InstallOperations:
    """
    .. warning::
        **DO NOT** instantiate this class directly.

        Instead, you should access the following operations through
        :class:`~digital_ocean_api.aio.DigitalOceanAPI`'s
        :attr:`install` attribute.
    """

    models = _models

    def __init__(self, *args, **kwargs) -> None:
        args = list(args)
        self._client = args.pop(0) if args else kwargs.pop("client")
        self._config = args.pop(0) if args else kwargs.pop("config")
        self._serialize = args.pop(0) if args else kwargs.pop("serializer")
        self._deserialize = args.pop(0) if args else kwargs.pop("deserializer")


    @distributed_trace_async
    async def kubernetes(
        self,
        body: "_models.OneClickCreate",
        **kwargs: Any
    ) -> Union["_models.ComponentsCmdw3WResponses1ClickCreateContentApplicationJsonSchema", "_models.Error"]:
        """Install Kubernetes 1-Click Applications.

        To install a Kubernetes 1-Click application on a cluster, send a POST request to
        ``/v2/1-clicks/kubernetes``. The ``addon_slugs`` and ``cluster_uuid`` must be provided as body
        parameter in order to specify which 1-Click application(s) to install. To list all available
        1-Click Kubernetes applications, send a request to ``/v2/1-clicks?type=kubernetes``.

        :param body:
        :type body: ~digital_ocean_api.models.OneClickCreate
        :keyword callable cls: A custom type or function that will be passed the direct response
        :return: ComponentsCmdw3WResponses1ClickCreateContentApplicationJsonSchema or Error, or the
         result of cls(response)
        :rtype:
         ~digital_ocean_api.models.ComponentsCmdw3WResponses1ClickCreateContentApplicationJsonSchema or
         ~digital_ocean_api.models.Error
        :raises: ~azure.core.exceptions.HttpResponseError
        """
        cls = kwargs.pop('cls', None)  # type: ClsType[Union["_models.ComponentsCmdw3WResponses1ClickCreateContentApplicationJsonSchema", "_models.Error"]]
        error_map = {
            401: ClientAuthenticationError, 404: ResourceNotFoundError, 409: ResourceExistsError
        }
        error_map.update(kwargs.pop('error_map', {}))

        content_type = kwargs.pop('content_type', "application/json")  # type: Optional[str]

        _json = self._serialize.body(body, 'OneClickCreate')

        request = build_kubernetes_request(
            content_type=content_type,
            json=_json,
            template_url=self.kubernetes.metadata['url'],
        )
        request = _convert_request(request)
        request.url = self._client.format_url(request.url)

        pipeline_response = await self._client._pipeline.run(  # pylint: disable=protected-access
            request,
            stream=False,
            **kwargs
        )
        response = pipeline_response.http_response

        if response.status_code not in [200, 401, 429, 500]:
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = self._deserialize.failsafe_deserialize(_models.Error, pipeline_response)
            raise HttpResponseError(response=response, model=error)

        response_headers = {}
        if response.status_code == 200:
            response_headers['ratelimit-limit']=self._deserialize('int', response.headers.get('ratelimit-limit'))
            response_headers['ratelimit-remaining']=self._deserialize('int', response.headers.get('ratelimit-remaining'))
            response_headers['ratelimit-reset']=self._deserialize('int', response.headers.get('ratelimit-reset'))
            
            deserialized = self._deserialize('ComponentsCmdw3WResponses1ClickCreateContentApplicationJsonSchema', pipeline_response)

        if response.status_code == 401:
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

    kubernetes.metadata = {'url': "/v2/1-clicks/kubernetes"}  # type: ignore
