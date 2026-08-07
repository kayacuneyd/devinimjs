/**
 * Tests for the rule-based validator (ADR-0022) and its createForm integration.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../../src/core/validate.js';
import { createForm } from '../../src/core/form.js';

test('required rejects empty, whitespace and absent values', () => {
  assert.equal(validate({ a: '' }, { a: 'required' }).a, 'This field is required.');
  assert.equal(validate({ a: '   ' }, { a: 'required' }).a, 'This field is required.');
  assert.equal(validate({}, { a: 'required' }).a, 'This field is required.');
  assert.deepEqual(validate({ a: 'x' }, { a: 'required' }), {});
});

test('email, url and number rules accept and reject the right shapes', () => {
  assert.deepEqual(validate({ e: 'ada@example.com' }, { e: 'required|email' }), {});
  assert.ok(validate({ e: 'nope' }, { e: 'email' }).e);
  assert.deepEqual(validate({ u: 'https://example.com/x' }, { u: 'url' }), {});
  assert.ok(validate({ u: 'not a url' }, { u: 'url' }).u);
  assert.deepEqual(validate({ n: '42.5' }, { n: 'number' }), {});
  assert.ok(validate({ n: '4x' }, { n: 'number' }).n);
});

test('min/max compare numbers; minLength/maxLength measure strings', () => {
  const rules = { age: 'number|min:18|max:99', code: 'minLength:3|maxLength:5' };
  assert.deepEqual(validate({ age: '18', code: 'abcd' }, rules), {});
  assert.equal(validate({ age: '17', code: 'abcd' }, rules).age, 'Must be at least 18.');
  assert.equal(validate({ age: '100', code: 'abcd' }, rules).age, 'Must be at most 99.');
  assert.equal(validate({ age: '20', code: 'ab' }, rules).code, 'Must be at least 3 characters.');
  assert.equal(validate({ age: '20', code: 'abcdef' }, rules).code, 'Must be at most 5 characters.');
});

test('pattern anchors the expression; match compares against another field', () => {
  const rules = { slug: 'pattern:[a-z0-9-]+', confirm: 'match:password' };
  assert.deepEqual(validate({ slug: 'hello-world-2', confirm: 'a', password: 'a' }, rules), {});
  assert.equal(validate({ slug: 'Hello!', confirm: 'a', password: 'a' }, rules).slug, 'Invalid format.');
  assert.equal(
    validate({ slug: 'ok', confirm: 'b', password: 'a' }, rules).confirm,
    'Must match password.',
  );
});

test('optional empty fields skip their remaining rules', () => {
  assert.deepEqual(validate({ email: '' }, { email: 'email' }), {});
  assert.deepEqual(validate({}, { age: 'number|min:18' }), {});
  assert.ok(validate({ email: 'bad' }, { email: 'email' }).email);
});

test('only the first failing rule per field is reported', () => {
  const errors = validate({ age: 'abc' }, { age: 'required|number|min:18' });
  assert.equal(errors.age, 'Enter a valid number.');
});

test('message overrides resolve field.rule, then rule, then default', () => {
  const errors = validate({ email: '', name: '' }, { email: 'required', name: 'required' }, {
    'email.required': 'E-posta zorunludur.',
    required: 'Zorunlu alan.',
  });
  assert.equal(errors.email, 'E-posta zorunludur.');
  assert.equal(errors.name, 'Zorunlu alan.');
});

test('unknown rules warn and are skipped', () => {
  const warnings = [];
  const original = console.warn;
  console.warn = (msg) => warnings.push(String(msg));
  try {
    assert.deepEqual(validate({ a: 'x' }, { a: 'teleport' }), {});
  } finally {
    console.warn = original;
  }
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /unknown rule "teleport"/);
});

test('createForm.validate sets errors/status on failure and clears them on success', () => {
  const form = createForm({ email: '', age: '' });
  const rules = { email: 'required|email', age: 'required|number|min:18' };

  assert.equal(form.validate(rules), false);
  assert.equal(form.state.status, 'error');
  assert.equal(form.state.errors.email, 'This field is required.');
  assert.equal(form.state.errors.age, 'This field is required.');

  form.set('email', 'ada@example.com');
  form.set('age', '36');
  assert.equal(form.validate(rules), true);
  assert.deepEqual(form.state.errors, {});
});

test('submit handler is skipped by the caller when validate fails (roadmap flow)', async () => {
  const form = createForm({ email: 'bad' });
  let submitted = false;
  if (form.validate({ email: 'required|email' })) {
    await form.submit(async () => { submitted = true; });
  }
  assert.equal(submitted, false);
  assert.equal(form.state.errors.email, 'Enter a valid email address.');
});
