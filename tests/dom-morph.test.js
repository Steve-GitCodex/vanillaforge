import { describe, it, expect, beforeEach } from 'vitest';
import { morph } from '../src/core/dom-morph.js';

/** Mount a wrapper with the given inner HTML and return it. */
function mount(html) {
  const el = document.createElement('div');
  el.innerHTML = html;
  document.body.appendChild(el);
  return el;
}

describe('morph', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('updates changed text without replacing the node', () => {
    const el = mount('<p>Hello</p>');
    const p = el.querySelector('p');
    morph(el, '<p>Goodbye</p>');
    expect(el.querySelector('p')).toBe(p); // same node, patched in place
    expect(p.textContent).toBe('Goodbye');
  });

  it('adds, updates, and removes attributes', () => {
    const el = mount('<a href="/a" class="old" title="t">x</a>');
    morph(el, '<a href="/b" class="new">x</a>');
    const a = el.querySelector('a');
    expect(a.getAttribute('href')).toBe('/b');
    expect(a.getAttribute('class')).toBe('new');
    expect(a.hasAttribute('title')).toBe(false);
  });

  it('adds and removes child nodes', () => {
    const el = mount('<ul><li>1</li></ul>');
    morph(el, '<ul><li>1</li><li>2</li><li>3</li></ul>');
    expect(el.querySelectorAll('li')).toHaveLength(3);
    morph(el, '<ul><li>1</li></ul>');
    expect(el.querySelectorAll('li')).toHaveLength(1);
  });

  it('preserves focus and caret position of a focused text input', () => {
    const el = mount('<div><input type="text" value="" /></div>');
    const input = el.querySelector('input');
    input.focus();
    // Simulate the user having typed "hello" (controlled value mirrors state).
    input.value = 'hello';
    input.setSelectionRange(2, 2);

    // Re-render with the same value the state now holds.
    morph(el, '<div><input type="text" value="hello" /></div>');

    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('hello');
    expect(input.selectionStart).toBe(2);
  });

  it('clears a focused input when the new value is empty (intentional reset)', () => {
    const el = mount('<div><input type="text" value="draft" /></div>');
    const input = el.querySelector('input');
    input.focus();
    input.value = 'draft';

    morph(el, '<div><input type="text" value="" /></div>');
    expect(input.value).toBe('');
  });

  it('syncs checkbox checked state', () => {
    const el = mount('<input type="checkbox" />');
    const box = el.querySelector('input');
    expect(box.checked).toBe(false);
    morph(el, '<input type="checkbox" checked />');
    expect(box.checked).toBe(true);
  });

  it('reuses keyed list items across reorder instead of rebuilding', () => {
    const el = mount(
      '<ul><li data-key="a">A</li><li data-key="b">B</li><li data-key="c">C</li></ul>'
    );
    const liA = el.querySelector('[data-key="a"]');
    const liC = el.querySelector('[data-key="c"]');

    // Reorder: C, A, B
    morph(el, '<ul><li data-key="c">C</li><li data-key="a">A</li><li data-key="b">B</li></ul>');

    const items = el.querySelectorAll('li');
    expect(items[0]).toBe(liC); // same DOM node, moved
    expect(items[1]).toBe(liA);
    expect([...items].map((n) => n.getAttribute('data-key'))).toEqual(['c', 'a', 'b']);
  });

  it('removes a keyed item without disturbing the others', () => {
    const el = mount(
      '<ul><li data-key="a">A</li><li data-key="b">B</li><li data-key="c">C</li></ul>'
    );
    const liA = el.querySelector('[data-key="a"]');
    const liC = el.querySelector('[data-key="c"]');

    morph(el, '<ul><li data-key="a">A</li><li data-key="c">C</li></ul>');

    const items = el.querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(items[0]).toBe(liA);
    expect(items[1]).toBe(liC);
  });
});
