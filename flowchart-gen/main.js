import { traverseBlocks, addConnection } from "./traversal.js";
import { buildFlowchartDefinition } from "./rendering.js";

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

export function renderFlowchart(definition, index) {
  const flowchartContainer = document.getElementById(`flowchart${index}`);
  flowchartContainer.innerHTML = ""; // Clear previous flowchart

  try {
    var chart = flowchart.parse(definition);
    console.log(definition);

    chart.drawSVG(`flowchart${index}`, {
      "line-width": 2,
      "line-length": 80,
      "font-size": 13,
      "yes-text": "Yes",
      "no-text": "No",
      scale: parseFloat(blockSize.value) || 1,
      symbols: {
        start: {
          "font-color": "black",
          "element-color": "green",
          fill: "white",
        },
        end: {
          "font-color": "black",
          "element-color": "red",
          fill: "white",
        },
        condition: {
          "font-color": "black",
          "element-color": "blue",
          fill: "white",
          class: "condition",
        },
        operation: {
          "font-color": "black",
          "element-color": "black",
          fill: "white",
        },
        inputoutput: {
          "font-color": "black",
          "element-color": "orange",
          fill: "white",
        },
      },
      flowstate: {
        past: { "line-color": "gray" },
        current: { "line-color": "black" },
        future: { "line-color": "gray" },
        request: { "line-color": "blue" },
        invalid: { "line-color": "red" },
      },
    });

    // Add padding to the SVG
    const svg = flowchartContainer.querySelector("svg");
    if (svg) {
      const padding = 20;
      const viewBox = svg.getAttribute("viewBox").split(" ").map(Number);
      svg.setAttribute(
        "viewBox",
        `${viewBox[0] - padding} ${viewBox[1] - padding} ${
          viewBox[2] + padding * 2
        } ${viewBox[3] + padding * 2}`
      );
    }
  } catch (e) {
    console.error("Error rendering flowchart:", e);
  }
}
