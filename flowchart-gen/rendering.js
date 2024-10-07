function buildFlowchartDefinition(nodes, connections) {
  let nodeDefs = "";
  let connDefs = "";

  console.log("nodes", nodes);

  const maxLineLengths = {
    // start: 40,
    // end: 40,
    // operation: 30,
    // condition: 12,
    // inputoutput: 18,
    start: 18,
    end: 18,
    operation: 18,
    condition: 13,
    inputoutput: 17,
  };

  // Build node definitions
  for (let blockId in nodes) {
    let node = nodes[blockId];
    let nodeType = getAdjustedNodeType(node);

    const maxLineLength = maxLineLengths[nodeType] || 30;
    let wrappedLabel = wrapLabel(node.label, maxLineLength, nodeType);

    nodeDefs += `${node.id}=>${nodeType}: ${wrappedLabel}\n`;
  }

  // Initialize usedDirections object
  let usedDirections = {};
  const possibleDirections = ["right", "left", "bottom", "top"];

  // Build connection definitions
  for (let conn of connections) {
    let fromNodeObj = nodes[conn.from];
    let toNodeObj = nodes[conn.to];

    if (!fromNodeObj || !toNodeObj) {
      console.error(
        `Connection error: Missing nodes for connection from ${conn.from} to ${conn.to}`
      );
      continue;
    }

    let fromNode = fromNodeObj.id;
    let toNode = toNodeObj.id;

    let connStr = `${fromNode}`;

    if (!usedDirections[fromNode]) {
      usedDirections[fromNode] = new Set();
    }

    let preferredDirections = getPreferredDirections(fromNodeObj, toNodeObj);
    let direction = getDirection(
      fromNode,
      preferredDirections,
      usedDirections,
      possibleDirections
    );

    if (conn.condition) {
      connStr += `(${conn.condition},${direction})`;
    } else {
      connStr += `(${direction})`;
    }

    connStr += `->${toNode}\n`;

    connDefs += connStr;
  }

  return nodeDefs + "\n" + connDefs;
}

function getAdjustedNodeType(node) {
  switch (node.type) {
    case "terminator":
      return node.label.toLowerCase().includes("when") ? "start" : "end";
    case "process":
      return "operation";
    case "decision":
      return "condition";
    case "inputoutput":
      return "inputoutput";
    default:
      return "operation";
  }
}

function getPreferredDirections(fromNodeObj, toNodeObj) {
  // Nested node to parent node
  if (fromNodeObj.level > toNodeObj.level) {
    if (fromNodeObj.sequence < toNodeObj.sequence) {
      return ["right", "bottom", "left"];
    } else if (fromNodeObj.sequence > toNodeObj.sequence) {
      return ["right", "left"];
    } else {
      return ["right", "top", "bottom", "left"];
    }
  } else if (fromNodeObj.level < toNodeObj.level) {
    // Parent node to nested node
    if (fromNodeObj.sequence < toNodeObj.sequence) {
      return ["right", "bottom"];
    } else if (fromNodeObj.sequence > toNodeObj.sequence) {
      return ["right", "top"];
    } else {
      return ["right", "top", "bottom"];
    }
  } else {
    // Same level nodes
    if (fromNodeObj.sequence < toNodeObj.sequence) {
      return ["bottom", "left"];
    } else if (fromNodeObj.sequence > toNodeObj.sequence) {
      return ["left", "right"];
    } else {
      return ["right"];
    }
  }
}

function getDirection(
  fromNodeId,
  preferredDirections,
  usedDirections,
  possibleDirections
) {
  for (let dir of preferredDirections) {
    if (!usedDirections[fromNodeId].has(dir)) {
      usedDirections[fromNodeId].add(dir);
      return dir;
    }
  }
  for (let dir of possibleDirections) {
    if (!usedDirections[fromNodeId].has(dir)) {
      usedDirections[fromNodeId].add(dir);
      return dir;
    }
  }
  return "bottom";
}

function wrapLabel(label, maxLineLength, nodeType) {
  // First, check if the entire label fits within maxLineLength
  if (label.length <= maxLineLength) {
    // If it fits, center it
    return centerLine(label, maxLineLength);
  } else {
    // If it doesn't fit, break it into lines without padding
    return breakIntoLines(label, maxLineLength).join("\n");
  }
}

function breakIntoLines(label, maxLineLength) {
  const words = label.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if (
      (currentLine + (currentLine ? " " : "") + word).length <= maxLineLength
    ) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      if (word.length > maxLineLength) {
        // Break long words
        let remainingWord = word;
        while (remainingWord.length > maxLineLength) {
          lines.push(remainingWord.slice(0, maxLineLength));
          remainingWord = remainingWord.slice(maxLineLength);
        }
        currentLine = remainingWord;
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function centerLine(line, maxLineLength) {
  const totalPadding = maxLineLength - line.length;
  const leftPad = Math.floor(totalPadding / 2);
  const rightPad = totalPadding - leftPad;

  // Use Braille Pattern Blank for both left and right padding
  const brailleBlank = "\u2800"; // Braille Pattern Blank
  const leftPadding = brailleBlank.repeat(leftPad);
  const rightPadding = brailleBlank.repeat(rightPad);

  return leftPadding + line + rightPadding;
}

function renderFlowchart(definition, index) {
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
