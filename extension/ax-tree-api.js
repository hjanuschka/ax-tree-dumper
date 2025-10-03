// AX Tree API for querying accessibility information
// This reconstructs an AX-like tree from the DOM since browser's internal AX tree isn't accessible

class AXTreeAPI {
  constructor() {
    this.tree = null;
    this.nodeMap = new Map(); // Map CSS selector to AX node
  }

  // Build the AX tree from current page
  async build() {
    this.tree = this.buildAXNode(document.documentElement);
    this.indexNodes(this.tree, 'html');
    return this.tree;
  }

  // Query nodes using CSS selector
  query(selector) {
    try {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements).map(el => this.buildAXNode(el));
    } catch (e) {
      console.error('Invalid selector:', selector, e);
      return [];
    }
  }

  // Query single node
  queryOne(selector) {
    try {
      const el = document.querySelector(selector);
      return el ? this.buildAXNode(el) : null;
    } catch (e) {
      console.error('Invalid selector:', selector, e);
      return null;
    }
  }

  // Find nodes by role
  findByRole(role) {
    const results = [];
    this.walkTree(this.tree, node => {
      if (node.role === role) results.push(node);
    });
    return results;
  }

  // Find nodes by accessible name
  findByName(name, exactMatch = false) {
    const results = [];
    this.walkTree(this.tree, node => {
      if (exactMatch ? node.name === name : node.name.includes(name)) {
        results.push(node);
      }
    });
    return results;
  }

  // Walk the tree with a callback
  walkTree(node, callback) {
    callback(node);
    if (node.children) {
      node.children.forEach(child => this.walkTree(child, callback));
    }
  }

  // Index nodes for quick lookup
  indexNodes(node, path) {
    this.nodeMap.set(path, node);
    if (node.children) {
      node.children.forEach((child, idx) => {
        const childPath = `${path} > ${child.tagName.toLowerCase()}:nth-child(${idx + 1})`;
        this.indexNodes(child, childPath);
      });
    }
  }

  buildAXNode(element) {
    const role = element.getAttribute('role') || this.getImplicitRole(element);
    const name = this.getAccessibleName(element);
    const description = element.getAttribute('aria-describedby')
      ? this.getTextFromId(element.getAttribute('aria-describedby'))
      : element.getAttribute('aria-description') || '';
    const value = element.value || element.getAttribute('aria-valuenow') || '';

    const state = {
      disabled: element.disabled || element.getAttribute('aria-disabled') === 'true',
      hidden: element.hidden || element.getAttribute('aria-hidden') === 'true',
      expanded: element.getAttribute('aria-expanded'),
      checked: element.checked || element.getAttribute('aria-checked'),
      selected: element.getAttribute('aria-selected'),
      pressed: element.getAttribute('aria-pressed'),
      readonly: element.readOnly || element.getAttribute('aria-readonly') === 'true',
      required: element.required || element.getAttribute('aria-required') === 'true',
      busy: element.getAttribute('aria-busy') === 'true',
      invalid: element.getAttribute('aria-invalid') === 'true'
    };

    const rect = element.getBoundingClientRect();
    const location = {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    };

    const node = {
      tagName: element.tagName,
      role,
      name,
      description,
      value,
      state,
      location,
      attributes: {},
      children: []
    };

    // Capture important attributes
    const attrs = ['id', 'class', 'type', 'href', 'src', 'alt', 'title', 'placeholder',
                   'aria-live', 'aria-atomic', 'aria-relevant'];
    attrs.forEach(attr => {
      if (element.hasAttribute(attr)) {
        node.attributes[attr] = element.getAttribute(attr);
      }
    });

    // Process children
    for (let child of element.children) {
      node.children.push(this.buildAXNode(child));
    }

    return node;
  }

  getImplicitRole(element) {
    const tag = element.tagName;
    const type = element.type;

    const roleMap = {
      'A': element.hasAttribute('href') ? 'link' : '',
      'BUTTON': 'button',
      'INPUT': {
        'checkbox': 'checkbox',
        'radio': 'radio',
        'button': 'button',
        'submit': 'button',
        'reset': 'button',
        'range': 'slider',
        'search': 'searchbox',
        'email': 'textbox',
        'tel': 'textbox',
        'url': 'textbox',
        'text': 'textbox',
      }[type] || 'textbox',
      'IMG': 'img',
      'NAV': 'navigation',
      'MAIN': 'main',
      'HEADER': 'banner',
      'FOOTER': 'contentinfo',
      'ASIDE': 'complementary',
      'SECTION': 'region',
      'ARTICLE': 'article',
      'H1': 'heading',
      'H2': 'heading',
      'H3': 'heading',
      'H4': 'heading',
      'H5': 'heading',
      'H6': 'heading',
      'UL': 'list',
      'OL': 'list',
      'LI': 'listitem',
      'TABLE': 'table',
      'FORM': 'form',
      'SELECT': 'combobox',
      'TEXTAREA': 'textbox',
      'DIALOG': 'dialog',
      'HR': 'separator',
      'PROGRESS': 'progressbar',
      'METER': 'meter'
    };

    return roleMap[tag] || '';
  }

  getAccessibleName(element) {
    // aria-labelledby
    if (element.hasAttribute('aria-labelledby')) {
      return this.getTextFromId(element.getAttribute('aria-labelledby'));
    }

    // aria-label
    if (element.hasAttribute('aria-label')) {
      return element.getAttribute('aria-label');
    }

    // label element
    if (element.labels && element.labels[0]) {
      return element.labels[0].textContent.trim();
    }

    // alt attribute
    if (element.hasAttribute('alt')) {
      return element.getAttribute('alt');
    }

    // title attribute
    if (element.hasAttribute('title')) {
      return element.getAttribute('title');
    }

    // placeholder (for inputs)
    if (element.hasAttribute('placeholder') && !element.value) {
      return element.getAttribute('placeholder');
    }

    // text content
    if (['BUTTON', 'A', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName)) {
      return element.textContent.trim();
    }

    return '';
  }

  getTextFromId(ids) {
    return ids.split(' ')
      .map(id => {
        const el = document.getElementById(id);
        return el ? el.textContent.trim() : '';
      })
      .join(' ');
  }
}

// Export for use in extension
if (typeof module !== 'undefined') {
  module.exports = AXTreeAPI;
}
