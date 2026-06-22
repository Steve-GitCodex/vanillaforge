/**
 * Default icon set for VanillaForge.
 *
 * Each value is the inner content of an <svg> (everything inside the root tag).
 * The icons-plugin wraps them in a properly attributed <svg> element at render
 * time, so only path/shape data lives here.
 *
 * All paths are original geometric shapes — no third-party icon fonts or SVG
 * libraries are copied here.
 */
export const defaultIcons = {
  check: '<polyline points="4,12 9,17 20,6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

  close: '<line x1="5" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="19" y1="5" x2="5" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  trash: '<polyline points="4,6 20,6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 6V4h8v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="6" y="6" width="12" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  plus: '<line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  minus: '<line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  menu: '<line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  'chevron-right': '<polyline points="9,5 16,12 9,19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

  'chevron-left': '<polyline points="15,5 8,12 15,19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

  'chevron-down': '<polyline points="5,9 12,16 19,9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

  'chevron-up': '<polyline points="5,15 12,8 19,15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

  search: '<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2"/><line x1="15" y1="15" x2="20" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  info: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="8.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="12" y1="12" x2="12" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  warning: '<path d="M12 3 L21 20 H3 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><line x1="12" y1="10" x2="12" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="17" x2="12" y2="17.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',

  edit: '<path d="M11 4H4a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h15a1 1 0 0 0 1-1v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

  'arrow-left': '<line x1="19" y1="12" x2="5" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="11,6 5,12 11,18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

  'arrow-right': '<line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="13,6 19,12 13,18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

  home: '<path d="M3 12 L12 3 L21 12 V20 a1 1 0 0 1-1 1H15V15H9v6H4 a1 1 0 0 1-1-1Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',

  user: '<circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 20 a8 8 0 0 1 16 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  settings: '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  'external-link': '<path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="15,3 21,3 21,9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
};
