# AX Tree Dumper

Chrome extension to extract and query accessibility tree information from web pages.

**Note:** This is a DOM-based reconstruction of the accessibility tree, not the browser's internal AX tree (which isn't accessible from extensions). It implements accessible name computation and role mapping following ARIA specs.

## Features

- Extract full accessibility tree from any page
- Query nodes using CSS selectors
- Find nodes by role or accessible name
- Download tree as JSON
- Programmatic API for LLM integration

## Installation

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` directory

## Usage

### Via Extension Popup

1. Navigate to any webpage
2. Click the extension icon
3. Click "Dump AX Tree"
4. View in console or download JSON

### Programmatic API (for LLM integration)

```javascript
// In your extension code, send messages to the content script:

// Get full tree
chrome.tabs.sendMessage(tabId, {action: 'getFullTree'}, (response) => {
  console.log(response.data); // Full AX tree
});

// Query by CSS selector
chrome.tabs.sendMessage(tabId, {
  action: 'query',
  selector: 'button.primary'
}, (response) => {
  console.log(response.data); // Array of matching AX nodes
});

// Query single element
chrome.tabs.sendMessage(tabId, {
  action: 'queryOne',
  selector: '#submit-btn'
}, (response) => {
  console.log(response.data); // Single AX node
});

// Find by role
chrome.tabs.sendMessage(tabId, {
  action: 'findByRole',
  role: 'button'
}, (response) => {
  console.log(response.data); // All buttons
});

// Find by accessible name
chrome.tabs.sendMessage(tabId, {
  action: 'findByName',
  name: 'Submit',
  exactMatch: false
}, (response) => {
  console.log(response.data); // Nodes with "Submit" in name
});
```

## AX Node Structure

```json
{
  "tagName": "BUTTON",
  "role": "button",
  "name": "Submit Form",
  "description": "Submits the contact form",
  "value": "",
  "state": {
    "disabled": false,
    "hidden": false,
    "expanded": null,
    "checked": null,
    "selected": null,
    "pressed": null,
    "readonly": false,
    "required": false,
    "busy": false,
    "invalid": false
  },
  "location": {
    "x": 100,
    "y": 200,
    "width": 80,
    "height": 40
  },
  "attributes": {
    "id": "submit-btn",
    "class": "btn btn-primary"
  },
  "children": []
}
```

## Limitations

- Not the browser's actual internal AX tree (that's not exposed to extensions)
- Manual implementation of accessible name computation
- May not match browser behavior 100% in edge cases
- Chrome DevTools' Accessibility Inspector uses internal APIs we can't access

## Files

- `dump-ax-tree.js` - Standalone CDP script (requires remote debugging)
- `extension/` - Chrome extension
  - `ax-tree-api.js` - Core AX tree extraction logic
  - `content.js` - Content script for message handling
  - `popup.js` - Extension popup UI
  - `manifest.json` - Extension configuration
