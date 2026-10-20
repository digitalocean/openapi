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
ajv.addSchema(spec, 'api');
const validate = (schema, value) => {
  const check = schema.$ref ? ajv.getSchema(`api${schema.$ref}`)
    : ajv.compile({ ...schema, components: spec.components });
  assert.ok(check(value), JSON.stringify(check.errors));
};
const checkModel = (name) => ajv.getSchema(`api#/components/schemas/${name}`);
const deref = (object) => object.$ref
  ? object.$ref.slice(2).split('/').reduce((value, key) => value[key.replace(/~1/g, '/').replace(/~0/g, '~')], spec)
  : object;
const prefix = '/v2/action-gateway';
const endpointId = examples.publish.value.endpoint.id;
const operations = [
  ['/endpoints', 'post', 'create'],
  ['/endpoints', 'get', 'read'],
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
    if (path.includes('{')) assert.ok(operation.responses['404']);
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

test('names, rename-only requests, and immutable version specs have the intended bounds', () => {
  const name = checkModel('endpoint_name');
  for (const value of ['support-agent', 'A._-09', 'a'.repeat(64)]) assert.ok(name(value));
  for (const value of ['', 'a'.repeat(65), 'has space', 'has/slash']) assert.equal(name(value), false);
  const create = checkModel('endpoint_create');
  assert.equal(create({ name: 'support-agent' }), false);
  assert.ok(create({ name: 'support-agent', version: {} }));
  const patch = checkModel('endpoint_patch');
  assert.equal(patch({ name: 'support-agent', actor_id: 'other' }), false);
  assert.equal(patch({}), false);
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
  const base = { id: endpointId + '.v1', endpoint_id: endpointId, version_number: 1 };
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
  const forbidden = /(^|_)(urn|session_id|run_id|row_id|database_id)$|^sessionUrn$|^agentUrn$/;
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
  for (const name of ['endpoint', 'endpoint_version', 'endpoint_publish_response', 'endpoints_response', 'endpoint_versions_response']) {
    visit(spec.components.schemas[name]);
  }
  const inspect = (value) => {
    if (!value || typeof value !== 'object') return;
    if (value.endpoint_id && value.version_number) {
      assert.equal(value.id, `${value.endpoint_id}.v${value.version_number}`);
    }
    if (value.head_version) {
      assert.equal(value.head_version.endpoint_id, value.id);
      assert.equal(value.head_version.version_number, value.head_version_number);
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
  Object.values(examples).forEach((example) => inspect(example.value));
  const fields = ['actor_id', 'policy', 'config', 'network', 'insights'];
  for (const field of fields) {
    assert.deepEqual(examples.publish.value.version[field], examples.endpoint_create.value.version[field]);
    assert.deepEqual(examples.promotion.value.version[field], examples.publish.value.version[field]);
  }
  assert.deepEqual(examples.promotion.value.version.tools, examples.publish.value.version.tools);
  assert.deepEqual(examples.publish_empty.value.version.tools, { references: [] });
  assert.deepEqual(examples.publish_empty.value.version.policy, {});
  assert.deepEqual(examples.publish_empty.value.version.config, {});
});

test('legacy paths, fields, pagination, and pinned URLs remain compatible', () => {
  for (const [path, method] of [['/sessions', 'post'], ['/sessions', 'get'], ['/sessions/search', 'get'], ['/sessions/{session_urn}', 'delete']]) {
    const operation = spec.paths[prefix + path][method];
    assert.equal(operation.deprecated, true);
    assert.ok(operation.responses['200']);
    if (method === 'post') {
      const gone = operation.responses['410'].content['application/json'];
      assert.equal(gone.example.id, 'session_creation_disabled');
      assert.match(gone.example.message, /POST \/v2\/action-gateway\/endpoints/);
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
  const listing = spec.paths[prefix + '/sessions'].get.parameters.map(deref);
  assert.deepEqual(listing.map((param) => param.name), ['end_user_id', 'page', 'per_page']);
  assert.ok(legacy.list_sessions_response.properties.pagination);
});
