const test = require('node:test');
const assert = require('node:assert/strict');
const { createStore, addDirective, deleteDirective, sanitizeDirective } = require('./mockStore');

test('adds a new directive to the store', () => {
  const store = createStore();
  const nextStore = addDirective(store, {
    title: 'New directive',
    code: 'NEW-001',
    summary: 'A test directive',
    status: 'Pending',
    severity: 'Medium',
    authority: { name: 'Test Authority', jurisdiction: 'US' },
    actionItems: [],
  });

  assert.equal(nextStore.length, store.length + 1);
  assert.equal(nextStore[nextStore.length - 1].title, 'New directive');
  assert.equal(nextStore[nextStore.length - 1].authority.name, 'Test Authority');
});

test('preserves in-progress status values', () => {
  const sanitized = sanitizeDirective({
    id: 'dir-test-001',
    title: 'Test directive',
    code: 'TEST-001',
    summary: 'A test directive',
    status: 'In Progress',
    severity: 'High',
    effectiveDate: null,
    rawText: null,
    authority: { name: 'Test Authority', jurisdiction: 'US' },
    actionItems: [{
      id: 'item-test-001',
      title: 'Review',
      description: 'Review this directive',
      status: 'In Progress',
      owner: null,
      dueDate: null,
      priority: 'Medium',
      flagged: false,
      flagReason: null,
    }],
  });

  assert.equal(sanitized.status, 'In Progress');
  assert.equal(sanitized.actionItems[0].status, 'In Progress');
});

test('deletes a directive from the store', () => {
  const store = createStore();
  const id = store[0].id;
  const nextStore = deleteDirective(store, id);

  assert.equal(nextStore.length, store.length - 1);
  assert.equal(nextStore.find((directive) => directive.id === id), undefined);
});
