export function generateFlowchartDefinition(hatKey, blocks) {
  let nodes = {};
  let connections = [];
  let nodeCounter = { value: 1 };

  // Add Start node
  let startNodeId = "start";
  nodes[startNodeId] = {
    id: "node" + nodeCounter.value++,
    label: "Start",
    type: "terminator",
    level: 0,
    sequence: 0,
  };

  if (hatKey) {
    // Connect Start to the first block
    addConnection(connections, startNodeId, hatKey);

    // Traverse the blocks
    traverseBlocks(
      hatKey,
      blocks,
      nodes,
      connections,
      nodeCounter,
      null,
      0,
      1,
      null
    );
  }

  // Add End node
  let endNodeId = "end";
  nodes[endNodeId] = {
    id: "node" + nodeCounter.value++,
    label: "End",
    type: "terminator",
    level: 0,
    sequence: Object.keys(nodes).length,
  };

  return buildFlowchartDefinition(nodes, connections);
}
