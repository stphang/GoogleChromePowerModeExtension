const test = require('node:test');
const assert = require('node:assert/strict');
const { createEditTracker } = require('../src/edit-tracker.js');

class FakeDocument {
  constructor() {
    this.listeners = new Map();
    this.activeElement = null;
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    this.listeners.set(type, (this.listeners.get(type) || []).filter((item) => item !== listener));
  }

  dispatch(type, properties = {}) {
    const event = {
      type,
      isTrusted: true,
      defaultPrevented: false,
      ...properties,
    };
    for (const listener of this.listeners.get(type) || []) listener(event);
  }
}

function makeEditor(tagName = 'input', type = 'text') {
  return {
    tagName: tagName.toUpperCase(),
    type,
    isContentEditable: tagName === 'div',
    value: '',
    textContent: '',
    selectionStart: 0,
    selectionEnd: 0,
    getBoundingClientRect: () => ({ left: 10, top: 10, width: 200, height: 24 }),
  };
}

function key(document, editor, keyValue, modifiers = {}) {
  document.dispatch('keydown', { target: editor, key: keyValue, ...modifiers });
}

function edit(document, editor, inputType, text) {
  if (editor.tagName === 'INPUT' || editor.tagName === 'TEXTAREA') editor.value += text;
  else editor.textContent += text;
  document.dispatch('input', { target: editor, inputType, data: text });
}

test('counts confirmed keyboard edits once and resets when changing editors', async () => {
  const document = new FakeDocument();
  const hits = [];
  const resets = [];
  const tracker = createEditTracker(document, {
    onHit: (hit) => hits.push(hit),
    onReset: () => resets.push(true),
  });
  const input = makeEditor();
  const textarea = makeEditor('textarea');
  const password = makeEditor('input', 'password');
  const editable = makeEditor('div');

  document.activeElement = input;
  key(document, input, 'a');
  edit(document, input, 'insertText', 'a');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].combo, 1);

  key(document, input, 'b', { ctrlKey: true });
  edit(document, input, 'insertFromPaste', 'b');
  key(document, input, 'c');
  input.value += 'c';
  document.dispatch('input', { target: input, inputType: 'insertText', data: 'c', isTrusted: false });
  assert.equal(hits.length, 1);

  key(document, input, 'Process');
  document.dispatch('compositionstart', { target: input });
  edit(document, input, 'insertCompositionText', 'に');
  document.dispatch('compositionend', { target: input, data: 'に' });
  document.dispatch('input', { target: input, inputType: 'insertText', data: 'に' });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(hits.length, 2);
  assert.equal(hits[1].combo, 2);

  document.activeElement = password;
  key(document, password, 'x');
  edit(document, password, 'insertText', 'x');
  document.dispatch('focusin', { target: password });
  assert.equal(hits.length, 2);

  document.activeElement = textarea;
  document.dispatch('focusin', { target: textarea });
  key(document, textarea, 'Enter');
  edit(document, textarea, 'insertLineBreak', '\n');
  assert.equal(hits.length, 3);
  assert.equal(hits[2].combo, 1);
  assert.equal(resets.length, 1);

  document.activeElement = editable;
  document.dispatch('focusin', { target: editable });
  key(document, editable, 'k');
  edit(document, editable, 'insertText', 'k');
  assert.equal(hits.length, 4);

  tracker.destroy();
  document.activeElement = input;
  key(document, input, 'z');
  edit(document, input, 'insertText', 'z');
  assert.equal(hits.length, 4);
});

test('resets a combo after 1.5 seconds without confirmed edits', async () => {
  const document = new FakeDocument();
  const resets = [];
  createEditTracker(document, {
    onHit: () => {},
    onReset: (event) => resets.push(event.reason),
  });
  const input = makeEditor();
  key(document, input, 'a');
  edit(document, input, 'insertText', 'a');

  await new Promise((resolve) => setTimeout(resolve, 1550));
  assert.deepEqual(resets, ['inactivity']);
});

test('does not count a composition that ends after focus moves to another editor', async () => {
  const document = new FakeDocument();
  const hits = [];
  createEditTracker(document, { onHit: (hit) => hits.push(hit), onReset: () => {} });
  const input = makeEditor();
  const textarea = makeEditor('textarea');

  document.dispatch('compositionstart', { target: input });
  edit(document, input, 'insertCompositionText', '語');
  document.dispatch('compositionend', { target: input });
  document.dispatch('focusin', { target: textarea });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(hits.length, 0);
});
