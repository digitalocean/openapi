const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const Ajv = require('ajv');

// godo, pydo and dots each copy agents/ and must pass testcases.json,
// so this reference matcher has to keep the semantics of their readers.
const dir = resolve(__dirname, '..', 'agents');
const load = (name) => JSON.parse(readFileSync(resolve(dir, name), 'utf8'));
const rules = load('agents.json');
const schema = load('agents.schema.json');
const cases = load('testcases.json');

const matches = (condition, env) => {
  const has = (name) => Object.hasOwn(env, name);
  switch (condition.type) {
    case 'anyOf':
      return condition.conditions.some((sub) => matches(sub, env));
    case 'allOf':
      return condition.conditions.every((sub) => matches(sub, env));
    case 'env_set':
      return has(condition.name) && env[condition.name] !== '';
    case 'env_value':
      return has(condition.name) && env[condition.name] === condition.value;
    default:
      return false;
  }
};

const detect = (env) => {
  const namePattern = new RegExp(rules.namePattern);
  if (Object.hasOwn(env, rules.aiAgentVar)) {
    const value = env[rules.aiAgentVar].trim();
    if (namePattern.test(value)) return value;
  }
  const agent = rules.agents.find((a) => matches(a.match, env));
  return agent ? agent.name : null;
};

test('agents.json matches agents.schema.json', () => {
  const validate = new Ajv({ allErrors: true }).compile(schema);
  assert.ok(validate(rules), JSON.stringify(validate.errors, null, 2));
});

test('agent names are unique', () => {
  const names = rules.agents.map((a) => a.name);
  assert.deepEqual(names.filter((n, i) => names.indexOf(n) !== i), []);
});

test('testcases.json is well formed', () => {
  assert.ok(Array.isArray(cases) && cases.length > 0);
  const names = new Set();
  for (const c of cases) {
    assert.equal(typeof c.name, 'string', JSON.stringify(c));
    assert.ok(!names.has(c.name), `duplicate test case name: ${c.name}`);
    names.add(c.name);
    assert.ok(c.env && typeof c.env === 'object' && !Array.isArray(c.env), c.name);
    for (const value of Object.values(c.env)) assert.equal(typeof value, 'string', c.name);
    assert.ok(c.expected === null || typeof c.expected === 'string', c.name);
  }
});

test('every agent is covered by a test case', () => {
  const expected = new Set(cases.map((c) => c.expected));
  for (const agent of rules.agents) assert.ok(expected.has(agent.name), `no test case expects ${agent.name}`);
});

for (const c of cases) {
  test(`testcase: ${c.name}`, () => {
    assert.equal(detect(c.env), c.expected);
  });
}
