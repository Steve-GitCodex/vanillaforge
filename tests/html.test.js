import { describe, it, expect } from 'vitest';
import { escapeHtml, raw, html, RawHtml } from '../src/utils/html.js';

describe('escapeHtml', () => {
  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('returns empty string for null', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  it('coerces numbers', () => {
    expect(escapeHtml(42)).toBe('42');
  });

  it('leaves safe text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});

describe('RawHtml', () => {
  it('toString returns the original string', () => {
    const r = new RawHtml('<b>bold</b>');
    expect(r.toString()).toBe('<b>bold</b>');
  });

  it('coerces to string via template literal', () => {
    const r = new RawHtml('<em>test</em>');
    expect(`${r}`).toBe('<em>test</em>');
  });
});

describe('raw', () => {
  it('returns a RawHtml instance', () => {
    expect(raw('<p>hi</p>')).toBeInstanceOf(RawHtml);
  });

  it('toString returns the original value', () => {
    expect(raw('<p>hi</p>').toString()).toBe('<p>hi</p>');
  });
});

describe('html tagged template', () => {
  it('passes through static text unchanged', () => {
    expect(html`<p>hello</p>`).toBe('<p>hello</p>');
  });

  it('escapes interpolated strings', () => {
    const input = '<img onerror="xss()">';
    expect(html`<p>${input}</p>`).toBe('<p>&lt;img onerror=&quot;xss()&quot;&gt;</p>');
  });

  it('does not escape RawHtml instances', () => {
    const trusted = raw('<strong>ok</strong>');
    expect(html`<div>${trusted}</div>`).toBe('<div><strong>ok</strong></div>');
  });

  it('escapes each element of an array', () => {
    const items = ['<a>', 'b&c'];
    expect(html`${items}`).toBe('&lt;a&gt;b&amp;c');
  });

  it('passes RawHtml elements of an array through', () => {
    const items = [raw('<li>one</li>'), raw('<li>two</li>')];
    expect(html`<ul>${items}</ul>`).toBe('<ul><li>one</li><li>two</li></ul>');
  });

  it('handles null and undefined interpolations', () => {
    expect(html`<p>${null}</p>`).toBe('<p></p>');
    expect(html`<p>${undefined}</p>`).toBe('<p></p>');
  });

  it('escapes numbers coerced to strings', () => {
    expect(html`<span>${42}</span>`).toBe('<span>42</span>');
  });

  it('handles multiple interpolations in one template', () => {
    const title = '<evil>';
    const body = '"quotes"';
    expect(html`<h1>${title}</h1><p>${body}</p>`)
      .toBe('<h1>&lt;evil&gt;</h1><p>&quot;quotes&quot;</p>');
  });

  it('icon()-style RawHtml is not double-escaped when used in html``', () => {
    const svg = raw('<svg><path d="M0 0"/></svg>');
    expect(html`<button>${svg}</button>`)
      .toBe('<button><svg><path d="M0 0"/></svg></button>');
  });
});
