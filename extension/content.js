// Content script that provides AX tree API to the page
// This gets injected into the page and can be queried by the extension

const axAPI = new AXTreeAPI();

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {
        case 'getFullTree':
          const tree = await axAPI.build();
          sendResponse({success: true, data: tree});
          break;

        case 'query':
          const results = axAPI.query(request.selector);
          sendResponse({success: true, data: results});
          break;

        case 'queryOne':
          const result = axAPI.queryOne(request.selector);
          sendResponse({success: true, data: result});
          break;

        case 'findByRole':
          const byRole = axAPI.findByRole(request.role);
          sendResponse({success: true, data: byRole});
          break;

        case 'findByName':
          const byName = axAPI.findByName(request.name, request.exactMatch);
          sendResponse({success: true, data: byName});
          break;

        default:
          sendResponse({success: false, error: 'Unknown action'});
      }
    } catch (error) {
      sendResponse({success: false, error: error.message});
    }
  })();

  return true; // Keep channel open for async response
});

console.log('AX Tree API loaded');
