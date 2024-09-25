// Existing variable declarations
const spriteForm = document.getElementById("spriteForm");
const spriteList = document.getElementById("spriteList");
const errorMsg = document.getElementById("errorMsg");
const textContainer = document.getElementById("textContainer");
const textAreaInner = document.getElementById("textAreaInner");
const blocksContainer = document.getElementById("blocksContainer");
const blockSize = document.getElementById("blockSize");
const svgImg = document.getElementById("svgImage");
const canvas = document.getElementById("imageCanvas");
let sb3File = {};
let projectData = {};
let scratchblocksCode = "";
let viewer = {};
const HAT_BLOCKS = [
  "event_whenflagclicked",
  "event_whenkeypressed",
  "event_whengreaterthan",
  "event_whenthisspriteclicked",
  "event_whenstageclicked",
  "event_whenbackdropswitchesto",
  "event_whenbroadcastreceived",
  "control_start_as_clone",
  "procedures_definition",
  "boost_whenColor",
  "boost_whenTilted",
  "ev3_whenButtonPressed",
  "ev3_whenDistanceLessThan",
  "ev3_whenBrightnessLessThan",
  "gdxfor_whenGesture",
  "gdxfor_whenForcePushedOrPulled",
  "gdxfor_whenTilted",
  "makeymakey_whenMakeyKeyPressed",
  "makeymakey_whenCodePressed",
  "microbit_whenButtonPressed",
  "microbit_whenGesture",
  "microbit_whenTilted",
  "microbit_whenPinConnected",
  "wedo2_whenDistance",
  "wedo2_whenTilted",
];

// Event listeners
document.getElementById("sb3Upload").addEventListener("change", (e) => {
  e.preventDefault();
  textContainer.hidden = true;
  blocksContainer.hidden = true;
  errorMsg.hidden = true;
  sb3File = e.target.files[0];
  parseSb3File(sb3File).then((projectJson) => {
    loadProject(JSON.parse(projectJson));
  });
});

spriteList.addEventListener("change", generateScratchblocks);
spriteList.addEventListener("click", generateScratchblocks);
blockSize.addEventListener("change", () => {
  renderSvg().then(renderPNG());
});

new ClipboardJS("#copyText");

document
  .getElementById("downloadText")
  .addEventListener("click", generateTxtFileDownload);
document
  .getElementById("downloadSvg")
  .addEventListener("click", generateSvgFileDownload);
document.getElementById("generatePng").addEventListener("click", renderPNG);
document
  .getElementById("downloadPng")
  .addEventListener("click", generatePngFileDownload);

// Existing functions remain unchanged
async function parseSb3File(file) {
  zip = await JSZip.loadAsync(file);
  project = await zip.file("project.json").async("text");
  return project;
}

async function loadProject(projJSON) {
  projectData = projJSON;
  spriteForm.hidden = false;
  Array.from(spriteList.children)
    .filter((e) => e.value !== "_stage_")
    .forEach((elem) => {
      spriteList.removeChild(elem);
    });
  projectData.targets
    .filter((t) => !t.isStage)
    .forEach((target) => {
      const option = document.createElement("option");
      option.value = target.name;
      option.innerText = target.name;
      spriteList.appendChild(option);
    });
}

function hideContainers(toHide) {
  textContainer.hidden = blocksContainer.hidden = toHide;
  errorMsg.hidden = !toHide;
}

function generateScratchblocks() {
  if (!projectData || Object.keys(projectData).length === 0) {
    errorMsg.textContent = "Project data is empty/invalid.";
    hideContainers(true);
    return;
  } else {
    const spriteName = spriteList.value;
    let target = projectData.targets.find((t) =>
      spriteName === "_stage_" ? t.isStage : t.name === spriteName
    );
    if (!target) {
      target = projectData.find((t) => t.isStage);
    }
    if (Object.keys(target.blocks).length == 0) {
      errorMsg.textContent = "No blocks found.";
      hideContainers(true);
      return;
    } else {
      hideContainers(false);
      const hatBlocks = Object.keys(target.blocks).filter((key) => {
        const blockItem = target.blocks[key];
        return (
          // Modified condition to include hat blocks even if they don't have a 'next' block
          blockItem.topLevel && HAT_BLOCKS.includes(blockItem.opcode)
        );
      });
      scratchblocksCode = hatBlocks
        .map((hatKey) =>
          parseSB3Blocks.toScratchblocks(hatKey, target.blocks, "en", {
            tab: " ".repeat(4),
            variableStyle: "as-needed",
          })
        )
        .join("\n\n");

      textAreaInner.textContent = scratchblocksCode;
      renderSvg().then(renderPNG());

      // New code for generating and rendering flowcharts
      generateAndRenderFlowcharts(hatBlocks, target.blocks);

      console.log("target.blocks", target.blocks);
    }
  }
}

async function renderSvg() {
  const renderOpts = {
    style: "scratch3",
    languages: ["en"],
    scale: blockSize.value,
  };
  viewer = scratchblocks.newView(
    scratchblocks.parse(scratchblocksCode, renderOpts),
    renderOpts
  );
  await viewer.render();
  const svgStr = viewer.exportSVGString();
  svgImg.src =
    "data:image/svg+xml;utf8," + svgStr.replace(/[#]/g, encodeURIComponent);
}

async function renderPNG() {
  canvas.width = viewer.width * blockSize.value;
  canvas.height = viewer.height * blockSize.value;
  const context = await canvas.getContext("2d");
  await context.save();
  await context.drawImage(svgImg, 0, 0);
  const imgURL = await canvas.toDataURL("image/png");
  return imgURL;
}

function generateTxtFileDownload() {
  const fileName =
    sb3File.name.slice(0, -4) +
    "_" +
    spriteList.value.replace("_", "") +
    ".txt";
  const blob = new Blob([scratchblocksCode], { type: "text/plain" });
  const objectURL = URL.createObjectURL(blob);
  triggerDownload(objectURL, fileName, "text/plain");
}

function generateSvgFileDownload() {
  const fileName =
    sb3File.name.slice(0, -4) +
    "_" +
    spriteList.value.replace("_", "") +
    ".svg";
  triggerDownload(svgImg.src, fileName, "image/svg+xml");
}

function generatePngFileDownload() {
  const fileName =
    sb3File.name.slice(0, -4) +
    "_" +
    spriteList.value.replace("_", "") +
    ".png";
  renderPNG().then((imgURL) => {
    triggerDownload(imgURL, fileName, "image/png");
  });
}

function triggerDownload(objectURL, fileName, mimeType) {
  const downloadLink = document.createElement("a");
  downloadLink.href = objectURL;
  downloadLink.download = fileName;
  downloadLink.type = mimeType;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  URL.revokeObjectURL(objectURL);
}

/* -------------------- */
/* Flowchart Feature Code */
/* -------------------- */
/* -------------------- */
/* -------------------- */
/* -------------------- */
/* -------------------- */
/* -------------------- */
/* -------------------- */
/* -------------------- */
/* -------------------- */
/* -------------------- */

// New function to generate and render flowcharts
function generateAndRenderFlowcharts(hatBlocks, blocks) {
  const flowchartContainer = document.getElementById("flowchartContainer");
  flowchartContainer.innerHTML = ""; // Clear previous flowcharts

  console.log(blocks);

  hatBlocks.forEach((hatKey, index) => {
    const flowchartDefinition = generateFlowchartDefinition(hatKey, blocks);
    renderFlowchart(flowchartDefinition, index);
  });
}

// Function to generate flowchart definition for a single script
function generateFlowchartDefinition(hatKey, blocks) {
  let nodes = {};
  let connections = [];
  let nodeCounter = { value: 1 };

  traverseBlocks(hatKey, blocks, nodes, connections, nodeCounter);

  let definition = buildFlowchartDefinition(nodes, connections);
  return definition;
}

function addConnection(connections, from, to, condition) {
  // Check if the connection already exists
  if (
    !connections.some(
      (conn) =>
        conn.from === from && conn.to === to && conn.condition === condition
    )
  ) {
    connections.push({ from, to, condition });
  }
}

// Function to traverse blocks and build nodes and connections
function traverseBlocks(
  blockId,
  blocks,
  nodes,
  connections,
  nodeCounter,
  exitTarget = null,
  level = 0 // Add level parameter
) {
  let block = blocks[blockId];
  if (!block || nodes[blockId]) return; // Prevent processing the same block multiple times

  let nodeId = "node" + nodeCounter.value++;
  let nodeLabel = getBlockLabel(block, blocks);
  let nodeType = getBlockType(block);

  console.log("traversing ", block);
  console.log(nodeId);
  console.log(nodeLabel);
  console.log(nodeType);

  // Skip adding the "forever" block to the nodes
  if (block.opcode === "control_forever") {
    processForeverBlock(
      blockId,
      block,
      blocks,
      nodes,
      connections,
      nodeCounter,
      exitTarget,
      level
    );
    return;
  }

  nodes[blockId] = {
    id: nodeId,
    label: nodeLabel,
    type: nodeType,
    level: level,
  };

  // if (block.opcode === "control_stop") {
  //   nodes[blockId].type = "end"; // Special handling for stop block
  //   return;
  // }

  // Process special blocks with inputs/substacks
  if (["control_if", "control_if_else"].includes(block.opcode)) {
    processIfBlocks(
      blockId,
      block,
      blocks,
      nodes,
      connections,
      nodeCounter,
      exitTarget,
      level
    );
  } else if (
    ["control_repeat", "control_repeat_until"].includes(block.opcode)
  ) {
    processLoopBlocks(
      blockId,
      block,
      blocks,
      nodes,
      connections,
      nodeCounter,
      exitTarget,
      level
    );
  } else {
    handleOtherBlocks(
      blockId,
      block,
      blocks,
      nodes,
      connections,
      nodeCounter,
      exitTarget,
      level
    );
  }
}

// Function to handle the "forever" block
function processForeverBlock(
  blockId,
  block,
  blocks,
  nodes,
  connections,
  nodeCounter,
  exitTarget,
  level
) {
  let substackId = block.inputs.SUBSTACK ? block.inputs.SUBSTACK[1] : null;
  if (substackId) {
    // Traverse the substack
    traverseBlocks(
      substackId,
      blocks,
      nodes,
      connections,
      nodeCounter,
      null,
      level
    );

    // Find the last block in the substack by following the `next` pointers
    let currentBlockId = substackId;
    let lastBlockId = substackId;
    while (currentBlockId) {
      lastBlockId = currentBlockId;
      let currentBlock = blocks[currentBlockId];
      currentBlockId = currentBlock.next;
    }

    console.log("lastBlockId", lastBlockId);
    console.log("substackId", substackId);

    // Create connection from the last block back to the first block (loop)
    // connections.push({
    //   from: lastBlockId,
    //   to: substackId,
    //   condition: "foreverLoop",
    // });
    addConnection(connections, lastBlockId, substackId, "foreverLoop");
  }
  // Do NOT traverse blocks that come after the forever block.
  // Simply return, without calling traverseBlocks on block.next
  return;
}

function processIfBlocks(
  blockId,
  block,
  blocks,
  nodes,
  connections,
  nodeCounter,
  exitTarget,
  level
) {
  let substackId = block.inputs.SUBSTACK ? block.inputs.SUBSTACK[1] : null;
  let substack2Id = block.inputs.SUBSTACK2 ? block.inputs.SUBSTACK2[1] : null;

  // Handle the "yes" branch
  if (substackId) {
    let substackBlock = blocks[substackId];
    if (substackBlock && substackBlock.opcode === "control_forever") {
      // Connect to the first block inside the forever loop
      let foreverSubstackId = substackBlock.inputs.SUBSTACK
        ? substackBlock.inputs.SUBSTACK[1]
        : null;

      if (foreverSubstackId && blocks[foreverSubstackId]) {
        // Connect to the first block inside the forever loop and process it
        // connections.push({
        //   from: blockId,
        //   to: foreverSubstackId,
        //   condition: "yes",
        // });
        addConnection(connections, blockId, foreverSubstackId, "yes");
        traverseBlocks(
          substackId,
          blocks,
          nodes,
          connections,
          nodeCounter,
          null,
          level
        );
      } else {
        // If the forever loop has no blocks inside, connect the if block to itself (loop)
        // connections.push({ from: blockId, to: blockId, condition: "yes" });
        addConnection(connections, blockId, blockId, "yes");
      }
      return; // Stop further processing after forever loop
    } else {
      // Connect to the substack as normal
      processSubstack(
        substackId,
        blockId,
        "yes",
        blocks,
        nodes,
        connections,
        nodeCounter,
        block.next || exitTarget,
        level + 1
      );
    }
  } else {
    // Handling case where if block is empty
    let target = block.next || exitTarget;
    if (target) {
      // connections.push({ from: blockId, to: target, condition: "yes" });
      addConnection(connections, blockId, target, "yes");
      traverseBlocks(
        target,
        blocks,
        nodes,
        connections,
        nodeCounter,
        exitTarget,
        level
      );
    }
  }

  // Handle the "no" branch for if_else
  if (block.opcode === "control_if_else") {
    if (substack2Id) {
      let substack2Block = blocks[substack2Id];
      if (substack2Block && substack2Block.opcode === "control_forever") {
        // Connect to the first block inside the forever loop
        let foreverSubstackId = substack2Block.inputs.SUBSTACK
          ? substack2Block.inputs.SUBSTACK[1]
          : null;

        if (foreverSubstackId && blocks[foreverSubstackId]) {
          // Connect to the first block inside the forever loop and process it
          // connections.push({
          //   from: blockId,
          //   to: foreverSubstackId,
          //   condition: "no",
          // });
          addConnection(connections, blockId, foreverSubstackId, "no");
          traverseBlocks(
            substack2Id,
            blocks,
            nodes,
            connections,
            nodeCounter,
            null,
            level
          );
        } else {
          // If the forever loop has no blocks inside, connect the if block to itself (loop)
          // connections.push({ from: blockId, to: blockId, condition: "no" });
          addConnection(connections, blockId, blockId, "no");
        }
        return; // Stop further processing after forever loop
      } else {
        // Connect to the second substack as normal
        processSubstack(
          substack2Id,
          blockId,
          "no",
          blocks,
          nodes,
          connections,
          nodeCounter,
          block.next || exitTarget,
          level + 1
        );
      }
    } else {
      let target = block.next || exitTarget;
      if (target) {
        // connections.push({ from: blockId, to: target, condition: "no" });
        addConnection(connections, blockId, target, "no");
        traverseBlocks(
          target,
          blocks,
          nodes,
          connections,
          nodeCounter,
          exitTarget,
          level
        );
      }
    }
  } else {
    // Connect to the next block if no forever block is present
    let target = block.next || exitTarget;
    if (target && blockId !== target) {
      // connections.push({ from: blockId, to: target, condition: "no" });
      addConnection(connections, blockId, target, "no");
      traverseBlocks(
        target,
        blocks,
        nodes,
        connections,
        nodeCounter,
        exitTarget,
        level
      );
    }
  }
}

function processLoopBlocks(
  blockId,
  block,
  blocks,
  nodes,
  connections,
  nodeCounter,
  exitTarget,
  level
) {
  let substackId = block.inputs.SUBSTACK ? block.inputs.SUBSTACK[1] : null;

  if (substackId) {
    let substackBlock = blocks[substackId];
    if (substackBlock && substackBlock.opcode === "control_forever") {
      // Connect to the first block inside the forever loop
      let foreverSubstackId = substackBlock.inputs.SUBSTACK
        ? substackBlock.inputs.SUBSTACK[1]
        : null;

      if (foreverSubstackId && blocks[foreverSubstackId]) {
        // Connect to the first block inside the forever loop and process it
        // connections.push({
        //   from: blockId,
        //   to: foreverSubstackId,
        //   condition: "no",
        // });
        addConnection(connections, blockId, foreverSubstackId, "no");
        traverseBlocks(
          substackId,
          blocks,
          nodes,
          connections,
          nodeCounter,
          null,
          level
        );
      } else {
        // If the forever loop has no blocks inside, connect the loop back to itself (loop)
        addConnection(connections, blockId, blockId, "no");
        // connections.push({ from: blockId, to: blockId, condition: "no" });
      }
      return; // Stop further processing after forever loop
    } else {
      // Normal loop traversal if no forever block
      // connections.push({ from: blockId, to: substackId, condition: "no" });
      addConnection(connections, blockId, substackId, "no");
      traverseBlocks(
        substackId,
        blocks,
        nodes,
        connections,
        nodeCounter,
        blockId,
        level + 1
      );
    }

    // Find the last block of the substack (substackId)
    let currentBlockId = substackId;
    let lastBlockId = substackId;
    while (currentBlockId && blocks[currentBlockId]) {
      lastBlockId = currentBlockId;
      let currentBlock = blocks[currentBlockId];
      currentBlockId = currentBlock.next;
    }

    // Connect the last block in the substack back to the loop start
    // connections.push({ from: lastBlockId, to: blockId, condition: "loop" });
    addConnection(connections, lastBlockId, blockId, "loop");
  } else {
    // Empty substack - loop back to itself
    // connections.push({ from: blockId, to: blockId, condition: "no" });
    addConnection(connections, blockId, blockId, "no");
  }

  // Handle the next block if no forever block is present
  let target = block.next || exitTarget;
  if (target && blockId !== target) {
    // connections.push({ from: blockId, to: target, condition: "yes" });
    addConnection(connections, blockId, target, "yes");
    traverseBlocks(
      target,
      blocks,
      nodes,
      connections,
      nodeCounter,
      exitTarget,
      level
    );
  }
}

// Helper function to process substacks
function processSubstack(
  substackId,
  blockId, // Added blockId here
  condition,
  blocks,
  nodes,
  connections,
  nodeCounter,
  nextTarget,
  level
) {
  if (substackId) {
    // connections.push({ from: blockId, to: substackId, condition: condition });
    addConnection(connections, blockId, substackId, condition);
    traverseBlocks(
      substackId,
      blocks,
      nodes,
      connections,
      nodeCounter,
      nextTarget,
      level
    );
  } else if (nextTarget && blockId !== nextTarget) {
    // connections.push({ from: blockId, to: nextTarget, condition: condition });
    addConnection(connections, blockId, nextTarget, condition);
    traverseBlocks(
      nextTarget,
      blocks,
      nodes,
      connections,
      nodeCounter,
      null,
      level
    );
  }
}

// Function to handle other blocks
function handleOtherBlocks(
  blockId, // Added blockId here
  block,
  blocks,
  nodes,
  connections,
  nodeCounter,
  exitTarget,
  level
) {
  console.log("exitTarget", exitTarget);

  if (block.next && blockId !== block.next) {
    let nextBlock = blocks[block.next];
    if (nextBlock && nextBlock.opcode === "control_forever") {
      let substackId = nextBlock.inputs.SUBSTACK
        ? nextBlock.inputs.SUBSTACK[1]
        : null;
      if (substackId) {
        // connections.push({
        //   from: blockId,
        //   to: substackId,
        //   condition: "bottom",
        // });
        addConnection(connections, blockId, substackId, "bottom");
      }
    } else {
      // connections.push({ from: blockId, to: block.next });
      addConnection(connections, blockId, block.next);
    }
    traverseBlocks(
      block.next,
      blocks,
      nodes,
      connections,
      nodeCounter,
      exitTarget,
      level
    );
  } else if (exitTarget && blockId !== exitTarget) {
    connections.push({ from: blockId, to: exitTarget });
    traverseBlocks(
      exitTarget,
      blocks,
      nodes,
      connections,
      nodeCounter,
      null,
      level
    );
  }
}

function wrapLabel(label, maxLineLength) {
  const words = label.split(" ");
  let lines = [];
  let currentLine = "";

  for (let word of words) {
    // Check if adding the next word exceeds the max line length
    if (
      (currentLine + (currentLine ? " " : "") + word).length <= maxLineLength
    ) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      // If the word itself is longer than maxLineLength, split the word
      while (word.length > maxLineLength) {
        lines.push(word.substring(0, maxLineLength));
        word = word.substring(maxLineLength);
      }
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  // Use '\n' for line breaks in Flowchart.js labels
  return lines.join("\n");
}

function buildFlowchartDefinition(nodes, connections) {
  let nodeDefs = "";
  let connDefs = "";

  const maxLineLengths = {
    start: 40,
    end: 40,
    operation: 30,
    condition: 12,
    inputoutput: 18,
    // You can add other types if necessary
  };

  // Build node definitions
  for (let blockId in nodes) {
    let node = nodes[blockId];
    let nodeType = node.type;

    // Adjust node types for Flowchart.js
    if (nodeType === "terminator") {
      // Use 'start' or 'end' based on the label
      nodeType = node.label.toLowerCase().includes("when") ? "start" : "end";
    } else if (nodeType === "process") {
      nodeType = "operation";
    } else if (nodeType === "decision") {
      nodeType = "condition";
    } else if (nodeType === "inputoutput") {
      nodeType = "inputoutput";
    }

    // Determine maxLineLength based on nodeType
    const maxLineLength = maxLineLengths[nodeType] || 30; // Default to 30 if not specified

    // Wrap the label
    let wrappedLabel = wrapLabel(node.label, maxLineLength);

    // Build the node definition
    nodeDefs += `${node.id}=>${nodeType}: ${wrappedLabel}\n`;
  }

  // Initialize usedDirections object
  let usedDirections = {};
  // Define possible directions
  const possibleDirections = ["right", "left", "bottom", "top"];

  function getDirection(fromNodeId, preferredDirections) {
    for (let dir of preferredDirections) {
      if (!usedDirections[fromNodeId].has(dir)) {
        usedDirections[fromNodeId].add(dir);
        return dir;
      }
    }
    // If all preferred directions are used, try any other direction
    for (let dir of possibleDirections) {
      if (!usedDirections[fromNodeId].has(dir)) {
        usedDirections[fromNodeId].add(dir);
        return dir;
      }
    }
    // All directions used, default to 'bottom'
    return "bottom";
  }

  // Build connection definitions
  for (let conn of connections) {
    let fromNodeObj = nodes[conn.from];
    let toNodeObj = nodes[conn.to];

    // Check if both nodes exist before attempting to create the connection
    if (!fromNodeObj || !toNodeObj) {
      console.error(
        `Connection error: Missing nodes for connection from ${conn.from} to ${conn.to}`
      );
      continue; // Skip this connection if either node is undefined
    }

    let fromNode = fromNodeObj.id;
    let toNode = toNodeObj.id;

    let connStr = `${fromNode}`;

    // Initialize usedDirections for fromNode and toNode if not exist
    if (!usedDirections[fromNode]) {
      usedDirections[fromNode] = new Set();
    }

    // Determine direction based on conditions and levels
    let direction = "";

    // Check if the connection is returning to a higher level
    const isReturningToHigherLevel = toNodeObj.level < fromNodeObj.level;

    // Use existing conditions
    if (conn.condition === "yes") {
      console.log("fromNode", fromNode);
      console.log("conn", conn);

      console.log(isReturningToHigherLevel);

      if (isReturningToHigherLevel) {
        // Returning to a higher level from a loop or condition
        // Preferred directions: ['left', 'top']
        let preferredDirections = ["left", "top"];
        direction = getDirection(fromNode, preferredDirections);
        connStr += `(yes,${direction})`;
      } else {
        // Regular "yes" connection into nested blocks
        // Preferred directions: ['bottom', 'right']
        let preferredDirections = ["bottom", "right"];
        direction = getDirection(fromNode, preferredDirections);
        connStr += `(yes,${direction})`;
      }
    } else if (conn.condition === "no") {
      // "No" connections
      // Preferred directions: ['right', 'bottom']
      let preferredDirections = ["right", "bottom"];
      direction = getDirection(fromNode, preferredDirections);
      connStr += `(no,${direction})`;
    } else if (conn.condition === "loop" || conn.condition === "foreverLoop") {
      // For loops, returning to a higher level
      // Preferred directions: ['left', 'top']
      let preferredDirections = ["left", "top"];
      direction = getDirection(fromNode, preferredDirections);
      connStr += `(${direction})`;
    } else if (isReturningToHigherLevel) {
      // Returning to a higher level in normal blocks
      // Preferred directions: ['left', 'top']
      let preferredDirections = ["left", "top"];
      direction = getDirection(fromNode, preferredDirections);
      connStr += `(${direction})`;
    } else {
      // General case: same level or deeper
      // Preferred directions: ['bottom', 'right']
      let preferredDirections = ["bottom", "right"];
      direction = getDirection(fromNode, preferredDirections);
      connStr += `(${direction})`;
    }

    connStr += `->${toNode}\n`;

    connDefs += connStr;
  }

  let definition = nodeDefs + "\n" + connDefs;

  return definition;
}

// Helper functions
function getBlockLabel(block, blocks) {
  switch (block.opcode) {
    // Event blocks (HAT_BLOCKS)
    case "event_whenflagclicked":
      return "When the green flag is clicked";
    case "event_whenkeypressed":
      return `When "${getFieldValue(block, "KEY_OPTION")}" key is pressed`;
    case "event_whenthisspriteclicked":
      return "When this sprite is clicked";
    case "event_whenbackdropswitchesto":
      return `When backdrop switches to "${getInputValue(
        block,
        "BACKDROP",
        blocks
      )}"`;
    case "event_whenbroadcastreceived":
      return `When I receive "${getFieldValue(block, "BROADCAST_OPTION")}"`;
    case "event_broadcast":
      return `Broadcast "${getInputValue(block, "BROADCAST_INPUT", blocks)}"`;
    case "event_broadcastandwait":
      return `Broadcast "${getInputValue(
        block,
        "BROADCAST_INPUT",
        blocks
      )}" and wait`;
    case "event_whengreaterthan":
      return `When sensor value > ${getInputValue(block, "VALUE", blocks)}`;

    // Control blocks
    case "control_wait":
      return `Wait ${getInputValue(block, "DURATION", blocks)} seconds`;
    case "control_stop":
      return `Stop "${getFieldValue(block, "STOP_OPTION")}"`;
    case "control_if":
      return `If (${getInputValue(block, "CONDITION", blocks) || "condition"})`;
    case "control_if_else":
      return `If (${getInputValue(block, "CONDITION", blocks) || "condition"})`;
    case "control_repeat":
      return `Has repeated ${
        getInputValue(block, "TIMES", blocks) || "?"
      } times?`;
    case "control_repeat_until":
      return `Has repeated until (${
        getInputValue(block, "CONDITION", blocks) || "condition"
      })?`;
    case "control_wait_until":
      return `Has waited until (${
        getInputValue(block, "CONDITION", blocks) || "condition"
      })?`;
    case "control_for_each":
      return `For each ${getFieldValue(block, "VARIABLE")} in ${getInputValue(
        block,
        "VALUE",
        blocks
      )}`;

    // Motion blocks
    case "motion_movesteps":
      return `Move ${getInputValue(block, "STEPS", blocks)} steps`;
    case "motion_turnright":
      return `Turn ${getInputValue(
        block,
        "DEGREES",
        blocks
      )} degrees to the right`;
    case "motion_turnleft":
      return `Turn ${getInputValue(
        block,
        "DEGREES",
        blocks
      )} degrees to the left`;
    case "motion_gotoxy":
      return `Go to x: ${getInputValue(block, "X", blocks)}, y: ${getInputValue(
        block,
        "Y",
        blocks
      )}`;
    case "motion_goto":
      return `Go to ${getInputValue(block, "TO", blocks)}`;
    case "motion_glideto":
      return `Glide ${getInputValue(
        block,
        "SECS",
        blocks
      )} secs to ${getInputValue(block, "TO", blocks)}`;
    case "motion_glidesecstoxy":
      return `Glide ${getInputValue(
        block,
        "SECS",
        blocks
      )} secs to x: ${getInputValue(block, "X", blocks)}, y: ${getInputValue(
        block,
        "Y",
        blocks
      )}`;
    case "motion_pointindirection":
      return `Point in direction ${getInputValue(block, "DIRECTION", blocks)}`;
    case "motion_pointtowards":
      return `Point towards ${getInputValue(block, "TOWARDS", blocks)}`;
    case "motion_ifonedgebounce":
      return "If on edge, bounce";
    case "motion_setrotationstyle":
      return `Set rotation style "${getFieldValue(block, "STYLE")}"`;
    case "motion_setx":
      return `Set x to ${getInputValue(block, "X", blocks)}`;
    case "motion_sety":
      return `Set y to ${getInputValue(block, "Y", blocks)}`;

    // Looks blocks
    case "looks_say":
      return `Say "${getInputValue(block, "MESSAGE", blocks)}"`;
    case "looks_sayforsecs":
      return `Say "${getInputValue(
        block,
        "MESSAGE",
        blocks
      )}" for ${getInputValue(block, "SECS", blocks)} seconds`;
    case "looks_think":
      return `Think "${getInputValue(block, "MESSAGE", blocks)}"`;
    case "looks_thinkforsecs":
      return `Think "${getInputValue(
        block,
        "MESSAGE",
        blocks
      )}" for ${getInputValue(block, "SECS", blocks)} seconds`;
    case "looks_switchcostumeto":
      return `Switch costume to "${getInputValue(block, "COSTUME", blocks)}"`;
    case "looks_nextcostume":
      return "Switch to next costume";
    case "looks_switchbackdropto":
      return `Switch backdrop to "${getInputValue(block, "BACKDROP", blocks)}"`;
    case "looks_nextbackdrop":
      return "Switch to next backdrop";
    case "looks_changeeffectby":
      return `Change "${getFieldValue(
        block,
        "EFFECT"
      )}" effect by ${getInputValue(block, "CHANGE", blocks)}`;
    case "looks_seteffectto":
      return `Set "${getFieldValue(block, "EFFECT")}" effect to ${getInputValue(
        block,
        "VALUE",
        blocks
      )}`;
    case "looks_cleargraphiceffects":
      return "Clear graphic effects";
    case "looks_show":
      return "Show";
    case "looks_hide":
      return "Hide";
    case "looks_changesizeby":
      return `Change size by ${getInputValue(block, "CHANGE", blocks)}`;
    case "looks_goforwardbackwardlayers":
      return `Go ${getFieldValue(block, "FORWARD_BACKWARD")} ${getInputValue(
        block,
        "NUM",
        blocks
      )} layer(s)`;

    case "looks_gotofrontback":
      return `Go to ${getFieldValue(block, "FRONT_BACK")} layer`;

    // Sound blocks
    case "sound_play":
      return `Start sound "${getFieldValue(block, "SOUND_MENU")}"`;
    case "sound_playuntildone":
      return `Play sound "${getFieldValue(block, "SOUND_MENU")}" until done`;
    case "sound_stopallsounds":
      return "Stop all sounds";
    case "sound_changeeffectby":
      return `Change sound effect "${getFieldValue(
        block,
        "EFFECT"
      )}" by ${getInputValue(block, "VALUE", blocks)}`;
    case "sound_seteffectto":
      return `Set sound effect "${getFieldValue(
        block,
        "EFFECT"
      )}" to ${getInputValue(block, "VALUE", blocks)}`;
    case "sound_cleareffects":
      return "Clear sound effects";
    case "sound_changevolumeby":
      return `Change volume by ${getInputValue(block, "VOLUME", blocks)}`;
    case "sound_setvolumeto":
      return `Set volume to ${getInputValue(block, "VOLUME", blocks)}%`;

    // Sensing blocks
    case "sensing_touchingobject":
      return `Touching "${getInputValue(
        block,
        "TOUCHINGOBJECTMENU",
        blocks
      )}"?`;
    case "sensing_touchingcolor":
      return `Touching color ${getInputValue(block, "COLOR", blocks)}?`;
    case "sensing_coloristouchingcolor":
      return `Color ${getInputValue(
        block,
        "COLOR",
        blocks
      )} is touching ${getInputValue(block, "COLOR2", blocks)}?`;
    case "sensing_distanceto":
      return `Distance to "${getInputValue(block, "DISTANCETOMENU", blocks)}"`;
    case "sensing_askandwait":
      return `Ask "${getInputValue(block, "QUESTION", blocks)}" and wait`;
    case "sensing_answer":
      return "Answer";
    case "sensing_keypressed":
      return `Key "${getInputValue(block, "KEY_OPTION", blocks)}" pressed?`;
    case "sensing_mousedown":
      return "Mouse down?";
    case "sensing_mousex":
      return "Mouse X position";
    case "sensing_mousey":
      return "Mouse Y position";
    case "sensing_loudness":
      return "Loudness";
    case "sensing_timer":
      return "Timer";
    case "sensing_resettimer":
      return "Reset timer";

    // Data blocks
    case "data_setvariableto":
      return `Set "${getFieldValue(block, "VARIABLE")}" to ${getInputValue(
        block,
        "VALUE",
        blocks
      )}`;
    case "data_changevariableby":
      return `Change "${getFieldValue(block, "VARIABLE")}" by ${getInputValue(
        block,
        "VALUE",
        blocks
      )}`;
    case "data_showvariable":
      return `Show variable "${getFieldValue(block, "VARIABLE")}"`;
    case "data_hidevariable":
      return `Hide variable "${getFieldValue(block, "VARIABLE")}"`;
    case "data_addtolist":
      return `Add ${getInputValue(block, "ITEM", blocks)} to "${getFieldValue(
        block,
        "LIST"
      )}"`;
    case "data_deleteoflist":
      return `Delete ${getInputValue(
        block,
        "INDEX",
        blocks
      )} of "${getFieldValue(block, "LIST")}"`;
    case "data_insertatlist":
      return `Insert ${getInputValue(block, "ITEM", blocks)} at ${getInputValue(
        block,
        "INDEX",
        blocks
      )} of "${getFieldValue(block, "LIST")}"`;
    case "data_replaceitemoflist":
      return `Replace item ${getInputValue(
        block,
        "INDEX",
        blocks
      )} of "${getFieldValue(block, "LIST")}" with ${getInputValue(
        block,
        "ITEM",
        blocks
      )}`;
    case "data_itemoflist":
      return `Item ${getInputValue(block, "INDEX", blocks)} of "${getFieldValue(
        block,
        "LIST"
      )}"`;
    case "data_lengthoflist":
      return `Length of "${getFieldValue(block, "LIST")}"`;
    case "data_showlist":
      return `Show list "${getFieldValue(block, "LIST")}"`;
    case "data_hidelist":
      return `Hide list "${getFieldValue(block, "LIST")}"`;

    // Operator blocks
    case "operator_add":
      return `${getInputValue(block, "NUM1", blocks)} + ${getInputValue(
        block,
        "NUM2",
        blocks
      )}`;
    case "operator_subtract":
      return `${getInputValue(block, "NUM1", blocks)} - ${getInputValue(
        block,
        "NUM2",
        blocks
      )}`;
    case "operator_multiply":
      return `${getInputValue(block, "NUM1", blocks)} × ${getInputValue(
        block,
        "NUM2",
        blocks
      )}`;
    case "operator_divide":
      return `${getInputValue(block, "NUM1", blocks)} ÷ ${getInputValue(
        block,
        "NUM2",
        blocks
      )}`;
    case "operator_random":
      return `Pick random ${getInputValue(
        block,
        "FROM",
        blocks
      )} to ${getInputValue(block, "TO", blocks)}`;
    case "operator_equals":
      return `${getInputValue(block, "OPERAND1", blocks)} = ${getInputValue(
        block,
        "OPERAND2",
        blocks
      )}`;
    case "operator_gt":
      return `${getInputValue(block, "OPERAND1", blocks)} > ${getInputValue(
        block,
        "OPERAND2",
        blocks
      )}`;
    case "operator_lt":
      return `${getInputValue(block, "OPERAND1", blocks)} < ${getInputValue(
        block,
        "OPERAND2",
        blocks
      )}`;
    case "operator_and":
      return `(${getInputValue(
        block,
        "OPERAND1",
        blocks
      )}) and (${getInputValue(block, "OPERAND2", blocks)})`;
    case "operator_or":
      return `(${getInputValue(block, "OPERAND1", blocks)}) or (${getInputValue(
        block,
        "OPERAND2",
        blocks
      )})`;
    case "operator_not":
      return `Not (${getInputValue(block, "OPERAND", blocks)})`;
    case "operator_join":
      return `Join "${getInputValue(
        block,
        "STRING1",
        blocks
      )}" and "${getInputValue(block, "STRING2", blocks)}"`;
    case "operator_letter_of":
      return `Letter ${getInputValue(
        block,
        "LETTER",
        blocks
      )} of "${getInputValue(block, "STRING", blocks)}"`;
    case "operator_length":
      return `Length of "${getInputValue(block, "STRING", blocks)}"`;
    case "operator_contains":
      return `Does "${getInputValue(
        block,
        "STRING1",
        blocks
      )}" contain "${getInputValue(block, "STRING2", blocks)}"?`;

    // Procedures (Custom blocks)
    case "procedures_definition":
      return `Define custom block "${getProcedureName(block)}"`;
    case "procedures_call":
      return `Call custom block "${getProcedureName(block)}"`;

    // Default case
    default:
      // Check if the block has a mutation with a proccode (custom procedure)
      if (block.mutation && block.mutation.proccode) {
        return `Custom block: "${block.mutation.proccode}"`;
      }
      // Convert opcode to a more readable format
      return formatOpcode(block.opcode);
  }
}

// Helper function to format opcodes into readable labels
function formatOpcode(opcode) {
  // Replace underscores with spaces
  let label = opcode.replace(/_/g, " ");
  // Remove any leading category names (e.g., "motion_", "control_")
  label = label.replace(/^[a-z]+ /, "");
  // Capitalize first letter of each word
  label = label.replace(/\b\w/g, (char) => char.toUpperCase());
  return label;
}

function mapMenuValue(menuName, value) {
  const mappings = {
    // General mappings
    _random_: "random position",
    _mouse_: "mouse-pointer",
    // Key options
    space: "space",
    "left arrow": "left arrow",
    "right arrow": "right arrow",
    "up arrow": "up arrow",
    "down arrow": "down arrow",
    // Front/Back options
    front: "front",
    back: "back",
    // Forward/Backward options
    forward: "forward",
    backward: "backward",
    // Add more mappings as necessary
  };
  return mappings[value] || value;
}

function getBlockType(block) {
  if (HAT_BLOCKS.includes(block.opcode) || block.opcode === "control_stop") {
    return "terminator";
  } else if (
    [
      "control_if",
      "control_if_else",
      "control_repeat",
      "control_repeat_until",
    ].includes(block.opcode)
  ) {
    return "decision";
  } else if (block.opcode === "control_forever") {
    return "process"; // or 'operation', depending on flowchart.js support
  } else if (
    [
      "event_whenkeypressed",
      "event_whenthisspriteclicked",
      "looks_say",
      "looks_sayforsecs",
      "looks_think",
      "looks_thinkforsecs",
      "sound_play",
      "sound_playuntildone",
    ].includes(block.opcode)
  ) {
    return "inputoutput";
  } else {
    return "process";
  }
}

function getConditionLabel(block, blocks) {
  if (block.inputs && block.inputs.CONDITION) {
    let conditionBlockId = block.inputs.CONDITION[1];
    let conditionBlock = blocks[conditionBlockId];
    if (conditionBlock) {
      return getBlockLabel(conditionBlock, blocks);
    }
  }
  return "condition";
}

function getInputValue(block, inputName, blocks) {
  if (block.inputs && block.inputs[inputName]) {
    const input = block.inputs[inputName];
    const inputType = input[0];
    const inputValue = input[1];

    if (Array.isArray(inputValue)) {
      // Input is a literal value
      console.log("label_l", inputValue);

      return inputValue[1];
    } else if (typeof inputValue === "string") {
      // Input is a block ID reference
      const referencedBlockId = inputValue;
      const referencedBlock = blocks[referencedBlockId];
      console.log("label_r", referencedBlock);
      if (referencedBlock) {
        if (
          referencedBlock.fields &&
          Object.keys(referencedBlock.fields).length > 0
        ) {
          // The block has fields (e.g., a menu or variable)
          for (const fieldName in referencedBlock.fields) {
            const value = getFieldValue(referencedBlock, fieldName);
            return mapMenuValue(fieldName, value);
          }
        } else {
          console.log("label_woo");

          // The block may have inputs (nested blocks) or be an operator/reporter
          return getBlockLabel(referencedBlock, blocks);
        }
      }
    }
  }
  return "";
}

function getFieldValue(block, fieldName) {
  if (block.fields && block.fields[fieldName]) {
    return block.fields[fieldName][0];
  }
  return "";
}

function getProcedureName(block) {
  if (block.mutation && block.mutation.proccode) {
    return block.mutation.proccode;
  }
  return "Custom Block";
}

// Function to render a single flowchart
function renderFlowchart(definition, index) {
  const flowchartContainer = document.getElementById("flowchartContainer");

  // Create a sub-container for each flowchart
  const subContainerId = "flowchartSubContainer" + index;
  const subContainer = document.createElement("div");
  subContainer.id = subContainerId;
  subContainer.style.marginBottom = "20px";

  // Add download buttons for each flowchart
  const downloadButtons = document.createElement("div");
  downloadButtons.className = "flowchart-buttons";

  const downloadSvgButton = document.createElement("button");
  downloadSvgButton.textContent = "Download Flowchart SVG";
  downloadSvgButton.onclick = () => {
    downloadFlowchartSvg(subContainerId, index);
  };

  const downloadPngButton = document.createElement("button");
  downloadPngButton.textContent = "Download Flowchart PNG";
  downloadPngButton.onclick = () => {
    downloadFlowchartPng(subContainerId, index);
  };

  downloadButtons.appendChild(downloadSvgButton);
  downloadButtons.appendChild(downloadPngButton);

  // Append buttons and flowchart container
  subContainer.appendChild(downloadButtons);
  flowchartContainer.appendChild(subContainer);

  try {
    var chart = flowchart.parse(definition);
    console.log(definition);

    chart.drawSVG(subContainerId, {
      // x: 0,
      // y: 0,
      "line-width": 2,
      "line-length": 80,
      // "text-margin": 10,
      "font-size": 13,
      // "font-color": "black",
      // "line-color": "black",
      // "element-color": "black",
      // fill: "white",
      "yes-text": "Yes",
      "no-text": "No",
      // "arrow-end": "block",
      scale: 1,
      // Adjust symbol styles
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
      // Style flowchart lines
      flowstate: {
        past: { "line-color": "gray" },
        current: { "line-color": "black" },
        future: { "line-color": "gray" },
        request: { "line-color": "blue" },
        invalid: { "line-color": "red" },
      },
    });
  } catch (e) {
    console.error("Error rendering flowchart:", e);
  }
}

// Functions to download flowcharts
function downloadFlowchartSvg(containerId, index) {
  const svgElement = document.getElementById(containerId).querySelector("svg");
  if (svgElement) {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const objectURL = URL.createObjectURL(blob);
    const fileName = `${sb3File.name.slice(0, -4)}_${spriteList.value.replace(
      "_",
      ""
    )}_flowchart${index + 1}.svg`;
    triggerDownload(objectURL, fileName, "image/svg+xml");
  } else {
    alert("Flowchart SVG not found.");
  }
}

function downloadFlowchartPng(containerId, index) {
  const svgElement = document.getElementById(containerId).querySelector("svg");
  if (svgElement) {
    const canvas = document.createElement("canvas");
    const bbox = svgElement.getBBox();
    canvas.width = bbox.width;
    canvas.height = bbox.height;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const svgData =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgString)));

    img.onload = function () {
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(function (blob) {
        const objectURL = URL.createObjectURL(blob);
        const fileName = `${sb3File.name.slice(
          0,
          -4
        )}_${spriteList.value.replace("_", "")}_flowchart${index + 1}.png`;
        triggerDownload(objectURL, fileName, "image/png");
      });
    };
    img.src = svgData;
  } else {
    alert("Flowchart SVG not found.");
  }
}
