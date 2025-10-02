// Handle debugger detach events
chrome.debugger.onDetach.addListener((source, reason) => {
  console.log('Debugger detached:', reason);
});
