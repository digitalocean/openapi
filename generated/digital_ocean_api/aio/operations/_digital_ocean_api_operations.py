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

from ... import models as _models
from ..._vendor import _convert_request
from ...operations._digital_ocean_api_operations import build_list_request
T = TypeVar('T')
ClsType = Optional[Callable[[PipelineResponse[HttpRequest, AsyncHttpResponse], T, Dict[str, Any]], Any]]

class DigitalOceanAPIOperationsMixin:

    @distributed_trace_async
    async def list(
        self,
        **kwargs: Any
    ) -> Union[_models.ComponentsG9R3Y8ResponsesAll1ClicksContentApplicationJsonSchema, _models.Error]:
        """List 1-Click Applications.

        To list all available 1-Click applications, send a GET request to ``/v2/1-clicks``. The
        ``type`` may
        be provided as query paramater in order to restrict results to a certain type of 1-Click, for
        example: ``/v2/1-clicks?type=droplet``. Current supported types are ``kubernetes`` and
        ``droplet``.

        The response will be a JSON object with a key called ``1_clicks``. This will be set to an array
        of
        1-Click application data, each of which will contain the the slug and type for the 1-Click.

        :keyword callable cls: A custom type or function that will be passed the direct response
        :return: ComponentsG9R3Y8ResponsesAll1ClicksContentApplicationJsonSchema or Error, or the
         result of cls(response)
        :rtype:
         ~digital_ocean_api.models.ComponentsG9R3Y8ResponsesAll1ClicksContentApplicationJsonSchema or
         ~digital_ocean_api.models.Error
        :raises: ~azure.core.exceptions.HttpResponseError
        """
        error_map = {
            401: ClientAuthenticationError, 404: ResourceNotFoundError, 409: ResourceExistsError
        }
        error_map.update(kwargs.pop('error_map', {}) or {})

        _headers = kwargs.pop("headers", {}) or {}
        _params = kwargs.pop("params", {}) or {}

        cls = kwargs.pop('cls', None)  # type: ClsType[Union[_models.ComponentsG9R3Y8ResponsesAll1ClicksContentApplicationJsonSchema, _models.Error]]

        
        request = build_list_request(
            type=self._config.type,
            template_url=self.list.metadata['url'],
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
            
            deserialized = self._deserialize('ComponentsG9R3Y8ResponsesAll1ClicksContentApplicationJsonSchema', pipeline_response)

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

    list.metadata = {'url': "/v2/1-clicks"}  # type: ignore
