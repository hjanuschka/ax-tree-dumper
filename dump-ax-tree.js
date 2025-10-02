const CDP = require('chrome-remote-interface');

async function dumpAXTree() {
  let client;

  try {
    // Connect to Chrome DevTools Protocol
    client = await CDP();
    const {Accessibility, Page} = client;

    // Navigate to the page
    await Page.enable();
    await Page.navigate({url: 'https://www.example.com'});
    await Page.loadEventFired();

    // Enable accessibility domain
    await Accessibility.enable();

    // Get the full accessibility tree
    console.log('Fetching full AX tree...\n');
    const {nodes} = await Accessibility.getFullAXTree();

    // Pretty print the nodes
    console.log(JSON.stringify(nodes, null, 2));
    console.log(`\nTotal nodes: ${nodes.length}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

dumpAXTree();
