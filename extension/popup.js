let axTreeData = null;

document.getElementById('dumpBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const downloadBtn = document.getElementById('downloadBtn');

  try {
    status.textContent = 'Dumping AX tree...';

    // Get current tab
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    // Inject script to extract AX tree from DOM
    const results = await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: extractAXTree
    });

    axTreeData = results[0].result;

    // Count nodes
    let nodeCount = 0;
    const countNodes = (node) => {
      nodeCount++;
      if (node.children) {
        node.children.forEach(countNodes);
      }
    };
    countNodes(axTreeData);

    // Log to console
    console.log('AX Tree:', axTreeData);
    console.log(`Total nodes: ${nodeCount}`);

    status.textContent = `✓ Dumped ${nodeCount} nodes. Check console or download.`;
    downloadBtn.style.display = 'block';

  } catch (err) {
    status.textContent = `Error: ${err.message}`;
    console.error(err);
  }
});

// This function runs in the page context
function extractAXTree() {
  function buildAXNode(element) {
    // Get computed role (browser's calculated accessibility role)
    const role = element.getAttribute('role') || getImplicitRole(element);

    // Get accessible name (computed from various sources)
    const name = getAccessibleName(element);

    // Get accessible description
    const description = element.getAttribute('aria-describedby')
      ? getTextFromId(element.getAttribute('aria-describedby'))
      : element.getAttribute('aria-description') || '';

    // Get value for form controls
    const value = element.value || element.getAttribute('aria-valuenow') || '';

    // Get ARIA states
    const state = {
      disabled: element.disabled || element.getAttribute('aria-disabled') === 'true',
      hidden: element.hidden || element.getAttribute('aria-hidden') === 'true',
      expanded: element.getAttribute('aria-expanded'),
      checked: element.checked || element.getAttribute('aria-checked'),
      selected: element.getAttribute('aria-selected'),
      pressed: element.getAttribute('aria-pressed'),
      readonly: element.readOnly || element.getAttribute('aria-readonly') === 'true',
      required: element.required || element.getAttribute('aria-required') === 'true'
    };

    // Get bounding box
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
      attributes: {}
    };

    // Capture important HTML attributes
    const attrs = ['id', 'class', 'type', 'href', 'src', 'alt', 'title', 'placeholder'];
    attrs.forEach(attr => {
      if (element.hasAttribute(attr)) {
        node.attributes[attr] = element.getAttribute(attr);
      }
    });

    // Process children
    node.children = [];
    for (let child of element.children) {
      node.children.push(buildAXNode(child));
    }

    return node;
  }

  function getImplicitRole(element) {
    const tagRoles = {
      'A': 'link',
      'BUTTON': 'button',
      'INPUT': element.type === 'checkbox' ? 'checkbox' : element.type === 'radio' ? 'radio' : 'textbox',
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
      'TEXTAREA': 'textbox'
    };
    return tagRoles[element.tagName] || '';
  }

  function getAccessibleName(element) {
    // Priority order for accessible name computation

    // 1. aria-labelledby
    if (element.hasAttribute('aria-labelledby')) {
      return getTextFromId(element.getAttribute('aria-labelledby'));
    }

    // 2. aria-label
    if (element.hasAttribute('aria-label')) {
      return element.getAttribute('aria-label');
    }

    // 3. label element (for form controls)
    if (element.labels && element.labels[0]) {
      return element.labels[0].textContent.trim();
    }

    // 4. alt attribute (for images)
    if (element.hasAttribute('alt')) {
      return element.getAttribute('alt');
    }

    // 5. title attribute
    if (element.hasAttribute('title')) {
      return element.getAttribute('title');
    }

    // 6. text content (for buttons, links, etc.)
    if (['BUTTON', 'A'].includes(element.tagName)) {
      return element.textContent.trim();
    }

    return '';
  }

  function getTextFromId(ids) {
    return ids.split(' ')
      .map(id => {
        const el = document.getElementById(id);
        return el ? el.textContent.trim() : '';
      })
      .join(' ');
  }

  return buildAXNode(document.documentElement);
}

document.getElementById('downloadBtn').addEventListener('click', () => {
  if (!axTreeData) return;

  const blob = new Blob([JSON.stringify(axTreeData, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download({
    url: url,
    filename: 'ax-tree.json',
    saveAs: true
  });
});
