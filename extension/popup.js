let axTreeData = null;

document.getElementById('dumpBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const downloadBtn = document.getElementById('downloadBtn');

  try {
    status.textContent = 'Dumping AX tree...';

    // Get current tab
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    // Attach debugger
    await chrome.debugger.attach({tabId: tab.id}, '1.3');

    // Enable Accessibility domain
    await chrome.debugger.sendCommand({tabId: tab.id}, 'Accessibility.enable');

    // Get full AX tree
    const result = await chrome.debugger.sendCommand(
      {tabId: tab.id},
      'Accessibility.getFullAXTree'
    );

    axTreeData = result.nodes;

    // Log to console
    console.log('AX Tree:', axTreeData);
    console.log(`Total nodes: ${axTreeData.length}`);

    status.textContent = `✓ Dumped ${axTreeData.length} nodes. Check console or download.`;
    downloadBtn.style.display = 'block';

    // Detach debugger
    await chrome.debugger.detach({tabId: tab.id});

  } catch (err) {
    status.textContent = `Error: ${err.message}`;
    console.error(err);
  }
});

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
