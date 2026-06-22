/**
 * DOM Morph
 *
 * A small, zero-dependency DOM-diffing utility. Given a live element and a new
 * HTML string, it patches only the parts of the DOM that actually changed
 * instead of replacing `innerHTML` wholesale. This is what makes VanillaForge
 * components "reactive" without a virtual DOM:
 *
 *  - Unchanged nodes are left untouched (no flicker, no lost scroll position).
 *  - Focused form fields keep their focus, value, and selection/cursor range.
 *  - Lists annotated with `data-key` are reconciled by key, so reordering or
 *    removing an item does not rebuild the whole list.
 *
 * Roadmap: fine-grained reactivity (signals) would remove the need to re-render
 * a component's full template on every change. See README "Roadmap".
 */

// Elements whose user-facing value lives in DOM properties, not attributes.
const FORM_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'OPTION']);

// Attributes handled explicitly via syncFormState (never copied blindly).
const FORM_STATE_ATTRS = new Set(['value', 'checked', 'selected']);

/**
 * Morph the children of `fromEl` to match `toHtml`.
 *
 * `fromEl` itself (the stable wrapper) is preserved — only its contents change.
 *
 * @param {HTMLElement} fromEl - Live element to patch in place.
 * @param {string} toHtml - New HTML for the element's contents.
 */
export function morph(fromEl, toHtml) {
  const template = document.createElement('template');
  template.innerHTML = typeof toHtml === 'string' ? toHtml : '';
  morphChildren(fromEl, template.content);
}

/**
 * Return a stable key for a node, or null if it has none.
 * @private
 */
function nodeKey(node) {
  if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('data-key')) {
    return node.getAttribute('data-key');
  }
  return null;
}

/**
 * Whether two nodes are "the same" for morphing purposes (can be patched in
 * place rather than replaced).
 * @private
 */
function isSameNode(a, b) {
  if (a.nodeType !== b.nodeType) return false;
  if (a.nodeType === Node.ELEMENT_NODE) {
    return a.tagName === b.tagName && nodeKey(a) === nodeKey(b);
  }
  return true; // text / comment nodes
}

/**
 * Reconcile the child nodes of `oldParent` to match `newParent`.
 * Handles keyed reuse (and moves) plus positional matching for unkeyed nodes.
 * @private
 */
function morphChildren(oldParent, newParent) {
  const newNodes = Array.from(newParent.childNodes);
  const oldNodes = Array.from(oldParent.childNodes);

  // Index keyed old nodes so they can be reused even if they moved.
  const keyedOld = new Map();
  for (const node of oldNodes) {
    const key = nodeKey(node);
    if (key != null) keyedOld.set(key, node);
  }

  const used = new Set();
  let cursor = 0; // pointer into oldNodes for positional (unkeyed) matching

  for (let i = 0; i < newNodes.length; i++) {
    const newNode = newNodes[i];
    const key = nodeKey(newNode);
    let reuse = null;

    if (key != null && keyedOld.has(key)) {
      // Keyed reuse: same logical item, possibly moved.
      reuse = keyedOld.get(key);
      keyedOld.delete(key);
      used.add(reuse);
    } else {
      // Positional reuse: first compatible, unused, unkeyed old node.
      while (cursor < oldNodes.length) {
        const candidate = oldNodes[cursor++];
        if (used.has(candidate)) continue;
        if (nodeKey(candidate) != null) continue; // keyed nodes only reused by key
        if (isSameNode(candidate, newNode)) {
          reuse = candidate;
          used.add(candidate);
        }
        break;
      }
    }

    const slot = oldParent.childNodes[i] || null;
    if (reuse) {
      morphNode(reuse, newNode);
      if (slot !== reuse) oldParent.insertBefore(reuse, slot);
    } else {
      oldParent.insertBefore(newNode.cloneNode(true), slot);
    }
  }

  // Drop any leftover old nodes that were pushed past the new length.
  while (oldParent.childNodes.length > newNodes.length) {
    oldParent.removeChild(oldParent.lastChild);
  }
}

/**
 * Patch a single node (and recurse into element children).
 * @private
 */
function morphNode(oldNode, newNode) {
  if (oldNode.nodeType === Node.TEXT_NODE || oldNode.nodeType === Node.COMMENT_NODE) {
    if (oldNode.nodeValue !== newNode.nodeValue) {
      oldNode.nodeValue = newNode.nodeValue;
    }
    return;
  }

  if (oldNode.nodeType !== Node.ELEMENT_NODE) return;

  morphAttributes(oldNode, newNode);

  if (FORM_TAGS.has(oldNode.tagName)) {
    syncFormState(oldNode, newNode);
  }

  // A textarea's value is its text content; syncFormState already handled it,
  // so don't let morphChildren clobber the live value while the user types.
  if (oldNode.tagName !== 'TEXTAREA') {
    morphChildren(oldNode, newNode);
  }
}

/**
 * Copy attributes from `newEl` onto `oldEl`, adding/updating/removing as needed.
 * Form-state attributes are skipped here and owned by syncFormState.
 * @private
 */
function morphAttributes(oldEl, newEl) {
  const isForm = FORM_TAGS.has(oldEl.tagName);

  for (const attr of Array.from(newEl.attributes)) {
    if (isForm && FORM_STATE_ATTRS.has(attr.name)) continue;
    if (oldEl.getAttribute(attr.name) !== attr.value) {
      oldEl.setAttribute(attr.name, attr.value);
    }
  }

  for (const attr of Array.from(oldEl.attributes)) {
    if (isForm && FORM_STATE_ATTRS.has(attr.name)) continue;
    if (!newEl.hasAttribute(attr.name)) {
      oldEl.removeAttribute(attr.name);
    }
  }
}

/**
 * Synchronise a form field's live value/checked state with the new template,
 * preserving the caret/selection of a focused text field so typing is not
 * interrupted by a re-render.
 * @private
 */
function syncFormState(oldEl, newEl) {
  const isActive = oldEl.ownerDocument.activeElement === oldEl;

  switch (oldEl.tagName) {
    case 'INPUT': {
      const type = (newEl.getAttribute('type') || 'text').toLowerCase();
      if (type === 'checkbox' || type === 'radio') {
        const next = newEl.hasAttribute('checked');
        if (oldEl.checked !== next) oldEl.checked = next;
      } else {
        setValuePreservingCaret(oldEl, newEl.getAttribute('value') ?? '', isActive);
      }
      break;
    }
    case 'TEXTAREA': {
      setValuePreservingCaret(oldEl, newEl.textContent ?? '', isActive);
      break;
    }
    case 'SELECT': {
      // Option `selected` attributes are reconciled by morphChildren; mirror the
      // resulting value onto the live property.
      const next = newEl.value;
      if (next != null && oldEl.value !== next) oldEl.value = next;
      break;
    }
    case 'OPTION': {
      const next = newEl.hasAttribute('selected');
      if (oldEl.selected !== next) oldEl.selected = next;
      break;
    }
  }
}

/**
 * Set an input/textarea value, restoring the selection range when the element
 * is focused so the user's caret position survives the update.
 * @private
 */
function setValuePreservingCaret(el, value, isActive) {
  if (el.value === value) return;
  if (isActive && typeof el.selectionStart === 'number') {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    el.value = value;
    try {
      el.setSelectionRange(Math.min(start, value.length), Math.min(end, value.length));
    } catch {
      /* selection not supported for this input type */
    }
  } else {
    el.value = value;
  }
}
