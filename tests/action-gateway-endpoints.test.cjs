const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Validate the generated bundle, including the references consumed by SDK generators.
const root = resolve(__dirname, '..');
const load = (path) => yaml.load(readFileSync(resolve(root, path), 'utf8'));
const spec = load('tests/openapi-bundled.yaml');
const models = load('specification/resources/action_gateway/models/endpoints.yml');
const examples = load('specification/resources/action_gateway/examples/endpoints.yml');
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
// OpenAPI 3.0 `nullable` admits null for a composed schema; Ajv applies allOf to null as well.
const nullableComposition = (node) => {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(nullableComposition);
  const out = Object.fromEntries(Object.entries(node).map(([key, child]) => [key, nullableComposition(child)]));
  if (out.nullable === true && out.allOf) {
    out.anyOf = [{ enum: [null] }, { allOf: out.allOf }];
    delete out.allOf;
  }
  return out;
};
ajv.addSchema(nullableComposition(spec), 'api');
const validate = (schema, value) => {
  const check = schema.$ref ? ajv.getSchema(`api${schema.$ref}`)
    : ajv.compile({ ...schema, components: spec.components });
  assert.ok(check(value), JSON.stringify(check.errors));
};
const checkModel = (name) => ajv.getSchema(`api#/components/schemas/${name}`);
const deref = (object) => object.$ref
  ? object.$ref.slice(2).split('/').reduce((value, key) => value[key.replace(/~1/g, '/').replace(/~0/g, '~')], spec)
  : object;
const requestExamples = new Set(['endpoint_create', 'endpoint_patch', 'endpoint_version_spec',
  'logs_disabled', 'traces_enabled', 'endpoint_promotion']);
const prefix = '/v2/action-gateway';
const endpointId = examples.publish.value.endpoint.id;
const operations = [
  ['/endpoints', 'post', 'create'],
  ['/endpoints', 'get', 'read'],
  ['/endpoints/search', 'get', 'read'],
  ['/endpoints/{endpoint_id}', 'get', 'read'],
  ['/endpoints/{endpoint_id}', 'patch', 'update'],
  ['/endpoints/{endpoint_id}', 'delete', 'delete'],
  ['/endpoints/{endpoint_id}/versions', 'post', 'create'],
  ['/endpoints/{endpoint_id}/versions', 'get', 'read'],
  ['/endpoints/{endpoint_id}/versions:promote', 'post', 'create'],
  ['/endpoint-versions/{version_id}', 'get', 'read'],
  ['/endpoint-versions/{version_id}', 'delete', 'delete'],
];

test('all lifecycle operations, scopes, status codes, and examples are bundled', () => {
  const ids = new Set();
  for (const [path, method, scope] of operations) {
    const operation = spec.paths[prefix + path][method];
    assert.ok(operation);
    assert.ok(!ids.has(operation.operationId));
    ids.add(operation.operationId);
    assert.deepEqual(operation.security, [{ bearer_auth: [`action_gateway:${scope}`] }]);
    const status = method === 'post' ? '201' : method === 'delete' ? '204' : '200';
    assert.ok(operation.responses[status]);
    if (status === '204') assert.equal(operation.responses[status].content, undefined);
    for (const code of ['400', '401', '429', '500']) assert.ok(operation.responses[code]);
    if (path.includes('{') && operation.operationId !== 'endpoints_delete') {
      assert.ok(operation.responses['404']);
    }
    const bodies = [operation.requestBody, ...Object.values(operation.responses)].filter(Boolean);
    for (const body of bodies) {
      for (const media of Object.values(deref(body).content || {})) {
        if (media.example !== undefined) validate(media.schema, media.example);
        for (const example of Object.values(media.examples || {})) {
          validate(media.schema, deref(example).value);
        }
      }
    }
  }
});

test('endpoint deletion documents a uniform empty outcome for missing and hidden resources', () => {
  const operation = spec.paths[prefix + '/endpoints/{endpoint_id}'].delete;
  assert.ok(operation.responses['204']);
  assert.equal(operation.responses['204'].content, undefined);
  assert.equal(operation.responses['404'], undefined);
  assert.match(operation.description, /Missing endpoints, endpoints outside your team, and otherwise invisible endpoints all return the same empty 204/);
  assert.match(operation.responses['204'].description, /empty in either case/);
});

test('endpoint deletion takes only the endpoint ID and preserves authorization', () => {
  const operation = spec.paths[prefix + '/endpoints/{endpoint_id}'].delete;
  assert.deepEqual(operation.parameters.map(deref).map((param) => param.name), ['endpoint_id']);
  assert.deepEqual(operation.security, [{ bearer_auth: ['action_gateway:delete'] }]);
  const versionDelete = spec.paths[prefix + '/endpoint-versions/{version_id}'].delete;
  assert.deepEqual(versionDelete.parameters.map(deref).map((param) => param.name), ['version_id']);
  for (const [path, method] of operations) {
    assert.equal(spec.paths[prefix + path][method].parameters?.map(deref)
      .some((param) => param.name === 'force') || false, false);
  }
});

test('version creation maps identity mismatch to 404 with the existing error shape', () => {
  const operation = spec.paths[prefix + '/endpoints/{endpoint_id}/versions'].post;
  assert.match(operation.description, /identity mismatch returns 404 endpoint_identity_mismatch/);
  const response = deref(operation.responses['404']);
  assert.match(response.description, /owner or actor differs/);
  const media = response.content['application/json'];
  for (const id of ['endpoint_not_found', 'endpoint_identity_mismatch']) {
    const example = deref(media.examples[id]).value;
    assert.equal(example.id, id);
    assert.deepEqual(Object.keys(example).sort(), ['id', 'message']);
    validate(media.schema, example);
  }
});

test('deletion contracts prohibit resurrection and require fresh identities for identical contents', () => {
  for (const path of ['/endpoints/{endpoint_id}', '/endpoint-versions/{version_id}']) {
    const text = spec.paths[prefix + path].delete.description;
    assert.match(text, /Deletion is final/);
    assert.match(text, /[Rr]etries, replays, and later writes cannot resurrect/);
    assert.match(text, /new version identity and (?:version )?number/);
  }
  assert.match(models.endpoint.description, /all cascaded version identities/);
  assert.match(models.endpoint.description, /new endpoint identity/);
  assert.match(models.endpoint_version.description, /Identical contents require a new version identity and number/);
  const promotion = examples.promotion.value.version;
  assert.notEqual(promotion.id, examples.publish.value.version.id);
  assert.ok(promotion.version_number > examples.publish.value.version.version_number);
  assert.equal(promotion.promoted_from_version_number, examples.publish.value.version.version_number);
});

test('creation and promotion document throttling and their applicable resource caps', () => {
  const cases = [
    ['/endpoints', 'endpoint_limit_exceeded', 'endpoint_limit', 50],
    ['/endpoints/{endpoint_id}/versions', 'endpoint_version_limit_exceeded', 'version_limit', 100],
    ['/endpoints/{endpoint_id}/versions:promote', 'endpoint_version_limit_exceeded', 'version_limit', 100],
  ];
  for (const [path, id, exampleName, limit] of cases) {
    const response = deref(spec.paths[prefix + path].post.responses['429']);
    const media = response.content['application/json'];
    assert.equal(deref(media.examples.rate_limit).value.id, 'too_many_requests');
    const error = deref(media.examples[exampleName]).value;
    assert.equal(error.id, id);
    assert.deepEqual(Object.keys(error).sort(), ['id', 'message']);
    validate(media.schema, error);
    if (id === 'endpoint_limit_exceeded') {
      assert.equal(error.message, `endpoint limit ${limit} reached (current count ${limit})`);
      assert.match(response.description, /message includes the limit and current count/);
      assert.match(response.description, /not a fixed limit for every team/);
      assert.match(response.description, /does not count each user's default endpoint, .*service-managed endpoints, or legacy sessions/);
    } else {
      assert.equal(error.message, 'live version limit reached; delete an older version');
      assert.match(response.description, /at most 100 live versions/);
      assert.match(response.description, /Creation and promotion both consume/);
    }
  }
});

test('VPC region is returned but rejected from version creation input', () => {
  const request = checkModel('endpoint_version_spec');
  const input = examples.endpoint_create.value.version.network;
  assert.ok(request({ network: input }));
  assert.equal(Object.hasOwn(input, 'region'), false);
  for (const region of ['nyc3', '', null]) {
    assert.equal(request({ network: { ...input, region } }), false);
    assert.equal(checkModel('endpoint_create')({
      name: 'support-agent', version: { network: { ...input, region } },
    }), false);
  }
  const networkSchema = deref(deref(spec.components.schemas.endpoint_version).properties.network);
  assert.equal(networkSchema.properties.region.readOnly, true);
  assert.equal(models.endpoint_network.properties.region, undefined);
  const output = examples.publish.value.version.network;
  assert.deepEqual(output, { ...input, region: 'nyc3' });
  validate({ $ref: '#/components/schemas/endpoint_version' }, examples.publish.value.version);
  assert.deepEqual(examples.promotion.value.version.network, output);
});

test('service-managed endpoints are indistinguishable from unknown IDs on every public route', () => {
  const text = models.endpoint.description;
  assert.match(text, /lists and search omit them/);
  assert.match(text, /every read or write of one returns the same 404 as an unknown ID/);
  assert.match(text, /deleting one returns the same 204 as deleting an unknown ID without changing it/);
  assert.doesNotMatch(text, /only public mutation allowed/);
  const remove = spec.paths[prefix + '/endpoints/{endpoint_id}'].delete;
  assert.match(remove.description, /service-managed endpoint is invisible: deleting its ID returns the same 204 as an unknown ID/);
  assert.match(remove.description, /Repeating a delete returns 204/);
  assert.match(spec.paths[prefix + '/endpoint-versions/{version_id}'].delete.description,
    /version of a service-managed endpoint, exactly as for an unknown ID/);
  assert.match(spec.paths[prefix + '/endpoints/search'].get.description, /Service-managed endpoints are never returned/);
});

test('endpoint and version IDs reject URNs, malformed forms, and uint32 overflow', () => {
  const endpoint = checkModel('endpoint_id');
  const version = checkModel('endpoint_version_id');
  assert.ok(endpoint(endpointId));
  for (const invalid of [endpointId.toUpperCase(), `do:example:${endpointId}`, '123', endpointId + '.v1', endpointId + '\n']) {
    assert.equal(endpoint(invalid), false, invalid);
  }
  const boundaries = [1, 9, 10, 999999999, 1000000000, 3999999999, 4000000000,
    4199999999, 4200000000, 4289999999, 4290000000, 4293999999, 4294000000,
    4294899999, 4294900000, 4294959999, 4294960000, 4294966999, 4294967000,
    4294967199, 4294967200, 4294967289, 4294967290, 4294967295];
  for (const number of boundaries) assert.ok(version(`${endpointId}.v${number}`), String(number));
  for (const suffix of ['0', '01', '-1', '+1', '1.0', '1e2', '4294967296', '9999999999', '10000000000', '1\n', '']) {
    assert.equal(version(`${endpointId}.v${suffix}`), false, suffix);
  }
  for (const invalid of [endpointId, `${endpointId.toUpperCase()}.v1`, `do:example:${endpointId}.v1`, `${endpointId}.V1`, `${endpointId}.v1.extra`]) {
    assert.equal(version(invalid), false, invalid);
  }
  const number = checkModel('version_number');
  for (const valid of [1, 4294967295]) assert.ok(number(valid));
  for (const invalid of [0, -1, 1.5, 4294967296, '1']) assert.equal(number(invalid), false);
});

test('cURL examples use the documented method, path, and request schema', () => {
  for (const [path, method] of operations) {
    const operation = spec.paths[prefix + path][method];
    const { source } = deref(operation['x-codeSamples'][0]);
    assert.match(source, new RegExp(`curl -X ${method.toUpperCase()}\\b`));
    const url = new URL(source.match(/"(https:\/\/[^"\n]+)"$/m)[1]);
    assert.equal(url.origin, 'https://api.digitalocean.com');
    assert.equal(url.pathname, prefix + path.replace('{endpoint_id}', endpointId).replace('{version_id}', endpointId + '.v1'));
    const body = source.match(/-d '([^']+)'/);
    if (operation.requestBody) {
      assert.ok(body);
      validate(operation.requestBody.content['application/json'].schema, JSON.parse(body[1]));
    } else {
      assert.equal(body, null);
    }
  }
});

test('names, partial endpoint updates, and immutable version specs have the intended bounds', () => {
  const name = checkModel('endpoint_name');
  for (const value of ['support-agent', 'A._-09', 'a'.repeat(64)]) assert.ok(name(value));
  for (const value of ['', 'a'.repeat(65), 'has space', 'has/slash']) assert.equal(name(value), false);
  const create = checkModel('endpoint_create');
  assert.equal(create({ name: 'support-agent' }), false);
  assert.ok(create({ name: 'support-agent', version: {} }));
  assert.ok(create({ name: 'support-agent', version: {}, insights: { logs: true } }));
  const patch = checkModel('endpoint_patch');
  assert.equal(models.endpoint_patch.required, undefined);
  assert.equal(models.endpoint_patch.additionalProperties, undefined);
  for (const value of [{ name: 'support-agent' }, { insights: { logs: false } }, { insights: { traces: true } },
    { insights: { metrics: true } }, { name: 'support-agent', insights: {} }, { name: 'support-agent', insights: { logs: true } }]) {
    assert.ok(patch(value), JSON.stringify(value));
  }
  for (const value of [{}, { name: '' }, { name: 'has space' }]) assert.equal(patch(value), false, JSON.stringify(value));
  assert.match(models.endpoint_patch.description, /only field is an empty insights object, returns 400 endpoint_update_empty/);
  assert.match(models.endpoint_patch.description, /An empty insights object next to a name is a rename/);
  const operation = spec.paths[prefix + '/endpoints/{endpoint_id}'].patch;
  assert.match(operation.description, /no name and no insights signal returns 400 endpoint_update_empty/);
  assert.match(operation.description, /omitted signal keeps its stored value/);
  const media = operation.requestBody.content['application/json'];
  assert.deepEqual(Object.keys(media.examples).sort(), ['logs_disabled', 'request', 'traces_enabled']);
});

test('omitted and empty nested selections remain distinct, without defaults', () => {
  const request = checkModel('endpoint_version_spec');
  for (const value of [{}, { tools: [] }, { policy: {} }, { config: {} },
    { actor_id: '' }, { insights: null }, examples.endpoint_create.value.version,
    examples.endpoint_version_spec.value]) {
    const before = structuredClone(value);
    assert.ok(request(value), JSON.stringify(request.errors));
    assert.deepEqual(value, before);
  }
  const version = checkModel('endpoint_version');
  const base = {
    id: endpointId + '.v1', endpoint_id: endpointId, version_number: 1, name: 'support-agent',
    actor_id: '', policy: null, created_at: '2026-10-15T14:00:00Z', updated_at: '2026-10-15T14:00:00Z',
  };
  for (const extra of [{}, { tools: { references: [] } }, { policy: {} }, { config: {} }]) {
    assert.ok(version({ ...base, ...extra }), JSON.stringify(version.errors));
  }
  assert.equal(request({ tools: {} }), false);
  assert.equal(version({ ...base, tools: [] }), false);
  const inspect = (schema) => {
    if (!schema || typeof schema !== 'object') return;
    assert.equal(Object.hasOwn(schema, 'default'), false);
    Object.values(schema).forEach(inspect);
  };
  inspect(models.endpoint_version_spec);
  inspect(models.endpoint_config);
  inspect(models.endpoint_policy);
});

test('the endpoint owns Insights consent with independent explicit updates and no omission resets', () => {
  const insights = deref(spec.components.schemas.endpoint_insights);
  assert.equal(insights.nullable, true);
  assert.equal(insights.required, undefined);
  assert.match(insights.description, /applies to every version of the endpoint, including pinned and older versions/);
  assert.match(insights.description, /latest explicit true enables and false disables/);
  assert.match(insights.description, /Omission preserves the existing value through updates, head replacement, and new-version creation/);
  assert.match(insights.description, /a stored choice cannot be cleared/);
  assert.match(insights.description, /Metrics defaults are unchanged/);
  assert.doesNotMatch(insights.description, /null leaves no stored choice/);
  const legacy = load('specification/resources/action_gateway/models/sessions.yml');
  for (const schema of ['endpoint', 'endpoint_create', 'endpoint_patch']) {
    assert.equal(models[schema].properties.insights.$ref, '#/endpoint_insights', schema);
  }
  const patch = checkModel('endpoint_patch');
  const request = checkModel('endpoint_version_spec');
  for (const logs of [undefined, true, false]) {
    for (const traces of [undefined, true, false]) {
      const value = { insights: {} };
      if (logs !== undefined) value.insights.logs = logs;
      if (traces !== undefined) value.insights.traces = traces;
      const before = structuredClone(value);
      assert.ok(patch(value), JSON.stringify(patch.errors));
      assert.ok(request(value), JSON.stringify(request.errors));
      assert.deepEqual(value, before);
    }
  }
  // Version-level insights stays accepted for old clients but is deprecated and points to the endpoint.
  const specInsights = models.endpoint_version_spec.properties.insights;
  assert.equal(specInsights.deprecated, true);
  assert.equal(specInsights.type, 'object');
  assert.match(specInsights.description, /Deprecated: accepted and ignored/);
  assert.match(specInsights.description, /PATCH \/v2\/action-gateway\/endpoints\/\{endpoint_id\}/);
  const versionInsights = models.endpoint_version.properties.insights;
  assert.equal(versionInsights.deprecated, true);
  assert.equal(versionInsights.type, 'object');
  assert.match(versionInsights.description, /Deprecated: always omitted/);
  assert.match(versionInsights.description, /read the endpoint's insights/);
  for (const key of ['version', 'publish', 'publish_empty', 'promotion', 'versions']) {
    const visit = (value) => {
      if (!value || typeof value !== 'object') return;
      if (value.endpoint_id && value.version_number) assert.equal(Object.hasOwn(value, 'insights'), false, key);
      Object.values(value).forEach(visit);
    };
    visit(examples[key].value);
  }
  assert.equal(Object.hasOwn(examples.endpoint_create.value.version, 'insights'), false);
  assert.deepEqual(examples.endpoint_create.value.insights, { logs: true, traces: false });
  assert.match(spec.paths[prefix + '/endpoints'].post.description, /version\.insights is deprecated and ignored/);
  assert.match(spec.paths[prefix + '/endpoints/{endpoint_id}/versions'].post.description,
    /insights field is deprecated and ignored, and the endpoint's consent applies to the new version/);
  assert.equal(spec.paths[prefix + '/endpoints/{endpoint_id}/versions'].post.requestBody.content['application/json'].examples.logs_disabled, undefined);
  for (const signal of ['logs', 'traces']) {
    const field = insights.properties[signal];
    assert.match(field.description, /Explicit true enables .* and false disables/);
    assert.match(field.description, /Omission preserves the existing choice without an implicit reset/);
    const shape = deref(field.allOf[0]);
    assert.deepEqual(shape, legacy.session_insights.properties[signal]);
    assert.equal(shape.nullable, true);
    assert.equal(shape.default, undefined);
  }
  assert.deepEqual(deref(insights.properties.metrics), legacy.session_insights.properties.metrics);
  assert.deepEqual(examples.logs_disabled.value, { insights: { logs: false } });
  assert.deepEqual(examples.traces_enabled.value, { insights: { traces: true } });
  assert.equal(Object.hasOwn(examples.endpoint_version_spec.value, 'insights'), false);
  assert.deepEqual(examples.publish_empty.value.endpoint.insights, examples.publish.value.endpoint.insights);
  assert.deepEqual(examples.promotion.value.endpoint.insights, examples.publish.value.endpoint.insights);
  for (const path of ['/endpoints/{endpoint_id}/versions', '/endpoints/{endpoint_id}/versions:promote']) {
    assert.match(spec.paths[prefix + path].post.description, /[Hh]ead replacement/);
    assert.match(spec.paths[prefix + path].post.description, /[Ii]dentical contents/);
  }
});

test('list contracts use bounded keyset pagination, never offsets or totals', () => {
  for (const path of ['/endpoints', '/endpoints/{endpoint_id}/versions']) {
    const operation = spec.paths[prefix + path].get;
    const params = operation.parameters.map(deref);
    assert.deepEqual(params.map((param) => param.name), path === '/endpoints'
      ? ['page_size', 'page_token', 'name', 'actor_id'] : ['endpoint_id', 'page_size', 'page_token']);
    const size = params.find((param) => param.name === 'page_size');
    assert.equal(size.schema.default, 20);
    const validSize = ajv.compile(size.schema);
    for (const value of [1, 20, 100]) assert.ok(validSize(value));
    for (const value of [0, -1, 101, 1.5]) assert.equal(validSize(value), false);
    const response = deref(operation.responses['200'].content['application/json'].schema);
    assert.deepEqual(response.required, [path === '/endpoints' ? 'endpoints' : 'versions', 'next_page_token']);
    assert.equal(response.properties.pagination, undefined);
    assert.equal(response.properties.total, undefined);
    const token = deref(response.properties.next_page_token);
    assert.equal(token.example, '');
    assert.match(token.description, /no full URNs or database row IDs/);
    assert.match(params.find((param) => param.name === 'page_token').description, /different team/);
  }
});

test('public responses expose no internal identity keys and examples agree across fields', () => {
  const forbidden = /(^|_)(urn|session_id|run_id|row_id|database_id)$|^(sessionUrn|agentUrn|team_id|teamId|owning_user_numeric_id|owningUserNumericId|staff_audit|staff_audit_fields|audit_metadata)$/i;
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    const value = deref(node);
    for (const [key, child] of Object.entries(value.properties || {})) {
      assert.equal(forbidden.test(key), false, key);
      visit(child);
    }
    if (value.items) visit(value.items);
    for (const part of value.allOf || []) visit(part);
  };
  for (const name of ['endpoint', 'endpoint_version', 'endpoint_publish_response', 'endpoints_response',
    'endpoint_search_response', 'endpoint_versions_response']) {
    visit(spec.components.schemas[name]);
  }
  for (const field of ['owning_user_id', 'head_version_number']) {
    assert.equal(models.endpoint.properties[field], undefined, field);
  }
  const inspect = (value) => {
    if (!value || typeof value !== 'object') return;
    if (value.endpoint_id && value.version_number) {
      assert.equal(value.id, `${value.endpoint_id}.v${value.version_number}`);
    }
    if (value.head_version) {
      assert.equal(value.head_version.endpoint_id, value.id);
    }
    if (value.version_mcp_url) {
      const tail = value.version_mcp_url.split('/').at(-1);
      assert.ok(checkModel('endpoint_id')(tail));
      assert.notEqual(tail, value.version.id);
      assert.notEqual(tail, value.endpoint.id);
    }
    for (const [key, child] of Object.entries(value)) {
      assert.equal(forbidden.test(key), false, key);
      if (typeof child === 'string') assert.equal(child.includes('do:'), false);
      inspect(child);
    }
  };
  Object.entries(examples).filter(([key]) => !requestExamples.has(key)).forEach(([, example]) => inspect(example.value));
  const fields = ['actor_id', 'policy', 'config'];
  for (const field of fields) {
    assert.deepEqual(examples.publish.value.version[field], examples.endpoint_create.value.version[field]);
    assert.deepEqual(examples.promotion.value.version[field], examples.publish.value.version[field]);
  }
  assert.deepEqual(examples.promotion.value.version.tools, examples.publish.value.version.tools);
  assert.deepEqual(examples.publish_empty.value.version.tools, { references: [] });
  assert.deepEqual(examples.publish_empty.value.version.policy, { defaultAction: 'SESSION_POLICY_ACTION_UNSPECIFIED', rules: [] });
  assert.deepEqual(examples.publish_empty.value.version.config, {});
});

test('legacy paths, fields, pagination, and pinned URLs remain compatible', () => {
  for (const [path, method] of [['/sessions', 'post'], ['/sessions', 'get'], ['/sessions/search', 'get'], ['/sessions/{session_urn}', 'delete']]) {
    const operation = spec.paths[prefix + path][method];
    assert.equal(operation.deprecated, true);
    assert.ok(operation.responses['200']);
    if (method === 'post') {
      // Legacy session creation stays available whether or not endpoints are enabled.
      assert.equal(operation.responses['410'], undefined);
      assert.match(operation.description, /Existing sessions and their\s+MCP URLs keep working/);
      assert.equal(deref(operation.responses['409']).content['application/json'].example.id, 'endpoint_name_taken');
      const limited = deref(operation.responses['429']).content['application/json'].examples;
      assert.equal(deref(limited.endpoint_limit).value.id, 'endpoint_limit_exceeded');
      assert.equal(deref(limited.rate_limit).value.id, 'too_many_requests');
      assert.match(operation.responses['200'].content['application/json'].example.mcpUrl, /\/mcp\/session\//);
    }
  }
  const legacy = load('specification/resources/action_gateway/models/sessions.yml');
  assert.deepEqual(Object.keys(legacy.session.properties).sort(), [
    'sessionUrn', 'name', 'actorId', 'policy', 'tools', 'config', 'network', 'insights',
    'agentUrn', 'agentName', 'createdAt', 'updatedAt', 'owning_user_id',
    'endpoint_id', 'endpoint_version_id', 'version_number',
  ].sort());
  assert.equal(legacy.session.required, undefined);
  const sessionSchema = deref(spec.paths[prefix + '/sessions'].get.responses['200'].content['application/json'].schema).properties.sessions.items;
  const legacyExample = spec.paths[prefix + '/sessions'].get.responses['200'].content['application/json'].example.sessions[0];
  validate(sessionSchema, legacyExample);
  validate(sessionSchema, {
    ...legacyExample,
    endpoint_id: endpointId,
    endpoint_version_id: endpointId + '.v1',
    version_number: 1,
  });
  assert.match(spec.paths[prefix + '/sessions/search'].get.description, /use GET \/v2\/action-gateway\/endpoints\/search/);
  const listing = spec.paths[prefix + '/sessions'].get.parameters.map(deref);
  assert.deepEqual(listing.map((param) => param.name), ['end_user_id', 'page', 'per_page']);
  assert.ok(legacy.list_sessions_response.properties.pagination);
});

test('endpoints and versions expose a read-only server-built mcp_url that matches create-response URLs', () => {
  const version = spec.components.schemas.endpoint_version.properties.mcp_url;
  const endpoint = spec.components.schemas.endpoint.properties.mcp_url;
  for (const property of [version, endpoint]) {
    assert.equal(property.type, 'string');
    assert.equal(property.format, 'uri');
    assert.equal(property.readOnly, true);
  }
  for (const name of ['endpoint', 'endpoint_version']) {
    assert.ok(!spec.components.schemas[name].required.includes('mcp_url'));
  }
  const base = /^https:\/\/[a-z0-9.-]+\/mcp\/endpoint\//;
  const live = (id) => new RegExp(`${base.source}${id}$`);
  const pinned = (id) => new RegExp(`${base.source}${id}/version/[0-9a-f-]{36}$`);
  const uuid = checkModel('endpoint_id');
  const seen = { endpoints: 0, versions: 0 };
  const check = (value) => {
    if (!value || typeof value !== 'object') return;
    if (value.endpoint_id && value.version_number) {
      assert.match(value.mcp_url, pinned(value.endpoint_id));
      assert.ok(uuid(value.mcp_url.split('/').at(-1)));
      assert.ok(!value.mcp_url.endsWith(value.id));
      seen.versions += 1;
    } else if (value.id && value.name && !value.endpoint_id && 'mcp_url' in value) {
      assert.match(value.mcp_url, live(value.id));
      seen.endpoints += 1;
    }
    Object.values(value).forEach(check);
  };
  for (const key of ['version', 'endpoint', 'empty_endpoint', 'publish', 'publish_empty', 'promotion', 'endpoints',
    'versions', 'endpoint_search']) {
    check(examples[key].value);
  }
  assert.ok(seen.endpoints >= 7 && seen.versions >= 10, JSON.stringify(seen));
  // Nested read objects equal the top-level create-response URLs for the same resource.
  for (const key of ['publish', 'publish_empty', 'promotion']) {
    const { endpoint: nested, version: pinnedVersion, mcp_url: url, version_mcp_url: versionUrl } = examples[key].value;
    assert.equal(nested.mcp_url, url);
    assert.equal(pinnedVersion.mcp_url, versionUrl);
    assert.equal(nested.head_version.mcp_url, versionUrl);
  }
  assert.equal(examples.endpoint.value.endpoint.mcp_url, examples.publish.value.mcp_url);
  assert.equal(examples.version.value.version.mcp_url, examples.publish.value.version_mcp_url);
  assert.match(
    examples.empty_endpoint.value.endpoint.mcp_url,
    live(examples.empty_endpoint.value.endpoint.id),
  );
  // Read responses, lists, and nested objects accept the new field; the backing UUID has no standalone field.
  validate(spec.components.schemas.endpoint_publish_response, examples.promotion.value);
  validate(spec.components.schemas.endpoints_response, examples.endpoints.value);
  validate(spec.components.schemas.endpoint_versions_response, examples.versions.value);
  assert.equal(Object.keys(spec.components.schemas.endpoint_version.properties).some((key) => /session/.test(key)), false);
});

test('endpoint search is ranked, keyset paged, and bound to its query', () => {
  const operation = spec.paths[prefix + '/endpoints/search'].get;
  const params = operation.parameters.map(deref);
  assert.deepEqual(params.map((param) => param.name), ['query', 'actor_id', 'page_size', 'page_token']);
  const query = params.find((param) => param.name === 'query');
  assert.equal(query.required, true);
  assert.equal(query.schema.minLength, 1);
  assert.match(query.description, /endpoint name, endpoint ID, actor_id, or agent name/);
  assert.match(query.description, /empty query returns 400 invalid_search_query/);
  assert.match(params.find((param) => param.name === 'actor_id').description, /Exact actor_id filter/);
  assert.match(operation.description, /exact matches first, then prefix matches, then substring matches, then by name/);
  assert.match(operation.description, /valid only with the same query and actor_id/);
  const response = deref(operation.responses['200'].content['application/json'].schema);
  assert.deepEqual(response.required, ['endpoints', 'next_page_token']);
  assert.equal(response.properties.total, undefined);
  assert.equal(deref(response.properties.endpoints.items), spec.components.schemas.endpoint);
  // The fixed segment must not be read as an endpoint ID.
  assert.equal(checkModel('endpoint_id')('search'), false);
});

test('an endpoint with no live version returns a null head_version', () => {
  assert.equal(models.endpoint.properties.head_version.nullable, true);
  assert.equal(models.endpoint.properties.head_version.type, 'object');
  const empty = examples.empty_endpoint.value;
  assert.equal(Object.hasOwn(empty.endpoint, 'head_version'), false);
  validate({ $ref: '#/components/schemas/endpoint_response' }, empty);
  validate({ $ref: '#/components/schemas/endpoint_response' }, { endpoint: { ...empty.endpoint, head_version: null } });
  assert.match(spec.paths[prefix + '/endpoints/{endpoint_id}'].get.description, /head_version is null/);
});
