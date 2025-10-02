let axTreeData = null;

function serializeNode(node) {
  const serialized = {
    role: node.role,
    name: node.name,
    description: node.description,
    value: node.value,
    state: node.state,
    location: node.location,
    htmlAttributes: node.htmlAttributes,
    children: []
  };

  if (node.children) {
    for (let child of node.children) {
      serialized.children.push(serializeNode(child));
    }
  }

  return serialized;
}

document.getElementById('dumpBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const downloadBtn = document.getElementById('downloadBtn');

  try {
    status.textContent = 'Dumping AX tree...';

    // Get current tab
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    // Get automation tree for the tab
    chrome.automation.getTree(tab.id, (rootNode) => {
      if (chrome.runtime.lastError) {
        status.textContent = `Error: ${chrome.runtime.lastError.message}`;
        console.error(chrome.runtime.lastError);
        return;
      }

      // Serialize the tree
      axTreeData = serializeNode(rootNode);

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
    });

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
