# pylint: disable=too-many-lines
# coding=utf-8
# --------------------------------------------------------------------------
# Code generated by Microsoft (R) AutoRest Code Generator (autorest: 3.8.3, generator: @autorest/python@5.16.0)
# Changes may cause incorrect behavior and will be lost if the code is regenerated.
# --------------------------------------------------------------------------
from typing import Any, Callable, Dict, Optional, TypeVar, Union

from azure.core.exceptions import ClientAuthenticationError, HttpResponseError, ResourceExistsError, ResourceNotFoundError, map_error
from azure.core.pipeline import PipelineResponse
from azure.core.pipeline.transport import AsyncHttpResponse
from azure.core.rest import HttpRequest
from azure.core.tracing.decorator_async import distributed_trace_async
from azure.core.utils import case_insensitive_dict

from ... import models as _models
from ..._vendor import _convert_request
from ...operations._validate_operations import build_app_spec_request, build_registry_name_request
T = TypeVar('T')
ClsType = Optional[Callable[[PipelineResponse[HttpRequest, AsyncHttpResponse], T, Dict[str, Any]], Any]]

class ValidateOperations:
    """
    .. warning::
        **DO NOT** instantiate this class directly.

        Instead, you should access the following operations through
        :class:`~digital_ocean_api.aio.DigitalOceanAPI`'s
        :attr:`validate` attribute.
    """

    models = _models

    def __init__(self, *args, **kwargs) -> None:
        input_args = list(args)
        self._client = input_args.pop(0) if input_args else kwargs.pop("client")
        self._config = input_args.pop(0) if input_args else kwargs.pop("config")
        self._serialize = input_args.pop(0) if input_args else kwargs.pop("serializer")
        self._deserialize = input_args.pop(0) if input_args else kwargs.pop("deserializer")


    @distributed_trace_async
    async def app_spec(
        self,
        body: _models.AppPropose,
        **kwargs: Any
    ) -> Union[_models.AppProposeResponse, _models.Error]:
        """Propose an App Spec.

        To propose and validate a spec for a new or existing app, send a PUT request to the
        ``/v2/apps/propose`` endpoint. The request returns some information about the proposed app,
        including app cost and upgrade cost. If an existing app ID is specified, the app spec is
        treated as a proposed update to the existing app.

        :param body:
        :type body: ~digital_ocean_api.models.AppPropose
        :keyword callable cls: A custom type or function that will be passed the direct response
        :return: AppProposeResponse or Error, or the result of cls(response)
        :rtype: ~digital_ocean_api.models.AppProposeResponse or ~digital_ocean_api.models.Error
        :raises: ~azure.core.exceptions.HttpResponseError
        """
        error_map = {
            401: ClientAuthenticationError, 404: ResourceNotFoundError, 409: ResourceExistsError
        }
        error_map.update(kwargs.pop('error_map', {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type = kwargs.pop('content_type', _headers.pop('Content-Type', "application/json"))  # type: Optional[str]
        cls = kwargs.pop('cls', None)  # type: ClsType[Union[_models.AppProposeResponse, _models.Error]]

        _json = self._serialize.body(body, 'AppPropose')

        request = build_app_spec_request(
            content_type=content_type,
            json=_json,
            template_url=self.app_spec.metadata['url'],
            headers=_headers,
            params=_params,
        )
        request = _convert_request(request)
        request.url = self._client.format_url(request.url)  # type: ignore

        pipeline_response = await self._client._pipeline.run(  # type: ignore # pylint: disable=protected-access
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
            
            deserialized = self._deserialize('AppProposeResponse', pipeline_response)

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

    app_spec.metadata = {'url': "/v2/apps/propose"}  # type: ignore


    @distributed_trace_async
    async def registry_name(
        self,
        body: _models.ValidateRegistry,
        **kwargs: Any
    ) -> Optional[_models.Error]:
        """Validate a Container Registry Name.

        To validate that a container registry name is available for use, send a POST
        request to ``/v2/registry/validate-name``.

        If the name is both formatted correctly and available, the response code will
        be 204 and contain no body. If the name is already in use, the response will
        be a 409 Conflict.

        :param body:
        :type body: ~digital_ocean_api.models.ValidateRegistry
        :keyword callable cls: A custom type or function that will be passed the direct response
        :return: Error, or the result of cls(response)
        :rtype: ~digital_ocean_api.models.Error or None
        :raises: ~azure.core.exceptions.HttpResponseError
        """
        error_map = {
            401: ClientAuthenticationError, 404: ResourceNotFoundError, 409: ResourceExistsError
        }
        error_map.update(kwargs.pop('error_map', {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type = kwargs.pop('content_type', _headers.pop('Content-Type', "application/json"))  # type: Optional[str]
        cls = kwargs.pop('cls', None)  # type: ClsType[Optional[_models.Error]]

        _json = self._serialize.body(body, 'ValidateRegistry')

        request = build_registry_name_request(
            content_type=content_type,
            json=_json,
            template_url=self.registry_name.metadata['url'],
            headers=_headers,
            params=_params,
        )
        request = _convert_request(request)
        request.url = self._client.format_url(request.url)  # type: ignore

        pipeline_response = await self._client._pipeline.run(  # type: ignore # pylint: disable=protected-access
            request,
            stream=False,
            **kwargs
        )
        response = pipeline_response.http_response

        if response.status_code not in [204, 401, 409, 429, 500]:
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            error = self._deserialize.failsafe_deserialize(_models.Error, pipeline_response)
            raise HttpResponseError(response=response, model=error)

        deserialized = None
        response_headers = {}
        if response.status_code == 204:
            response_headers['ratelimit-limit']=self._deserialize('int', response.headers.get('ratelimit-limit'))
            response_headers['ratelimit-remaining']=self._deserialize('int', response.headers.get('ratelimit-remaining'))
            response_headers['ratelimit-reset']=self._deserialize('int', response.headers.get('ratelimit-reset'))
            

        if response.status_code == 401:
            response_headers['ratelimit-limit']=self._deserialize('int', response.headers.get('ratelimit-limit'))
            response_headers['ratelimit-remaining']=self._deserialize('int', response.headers.get('ratelimit-remaining'))
            response_headers['ratelimit-reset']=self._deserialize('int', response.headers.get('ratelimit-reset'))
            
            deserialized = self._deserialize('Error', pipeline_response)

        if response.status_code == 409:
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

    registry_name.metadata = {'url': "/v2/registry/validate-name"}  # type: ignore

