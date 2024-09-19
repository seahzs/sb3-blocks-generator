// New function to generate and render flowcharts
function generateAndRenderFlowcharts(hatBlocks, blocks) {
  const flowchartContainer = document.getElementById("flowchartContainer");
  flowchartContainer.innerHTML = ""; // Clear previous flowcharts

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

// Function to traverse blocks and build nodes and connections
function traverseBlocks(blockId, blocks, nodes, connections, nodeCounter) {
  let block = blocks[blockId];
  if (!block) return;

  // Prevent processing the same block multiple times
  if (nodes[blockId]) return;

  // Assign a unique ID to the node
  let nodeId = "node" + nodeCounter.value++;
  let nodeLabel = getBlockLabel(block, blocks);
  let nodeType = getBlockType(block);

  nodes[blockId] = { id: nodeId, label: nodeLabel, type: nodeType };

  // Process the next block
  if (block.next) {
    let nextBlockId = block.next;
    connections.push({ from: blockId, to: nextBlockId });
    traverseBlocks(nextBlockId, blocks, nodes, connections, nodeCounter);
  }

  // Handle special blocks with inputs/substacks
  if (block.inputs) {
    if (["control_if", "control_if_else"].includes(block.opcode)) {
      // Condition block
      let conditionLabel = getConditionLabel(block, blocks);
      nodes[blockId].label += `\n(${conditionLabel})`;

      // Yes branch (SUBSTACK)
      let substackId = block.inputs.SUBSTACK ? block.inputs.SUBSTACK[1] : null;
      if (substackId) {
        connections.push({ from: blockId, to: substackId, condition: "yes" });
        traverseBlocks(substackId, blocks, nodes, connections, nodeCounter);
      }

      // No branch (SUBSTACK2)
      if (block.opcode === "control_if_else") {
        let substack2Id = block.inputs.SUBSTACK2
          ? block.inputs.SUBSTACK2[1]
          : null;
        if (substack2Id) {
          connections.push({
            from: blockId,
            to: substack2Id,
            condition: "no",
          });
          traverseBlocks(substack2Id, blocks, nodes, connections, nodeCounter);
        }
      }
    } else if (
      ["control_repeat", "control_forever", "control_repeat_until"].includes(
        block.opcode
      )
    ) {
      // Loop block
      let substackId = block.inputs.SUBSTACK ? block.inputs.SUBSTACK[1] : null;
      if (substackId) {
        connections.push({ from: blockId, to: substackId });
        traverseBlocks(substackId, blocks, nodes, connections, nodeCounter);

        // After substack, proceed to the next block
        let lastSubstackBlockId = getLastBlockId(substackId, blocks);
        if (block.next) {
          connections.push({ from: lastSubstackBlockId, to: block.next });
        }
      }
    }
  }
}

// Helper functions
function getBlockLabel(block, blocks) {
  switch (block.opcode) {
    // Event blocks (HAT_BLOCKS)
    case "event_whenflagclicked":
      return "When Green Flag is clicked";
    case "event_whenkeypressed":
      return `When ${getFieldValue(block, "KEY_OPTION")} Key Pressed`;
    case "event_whenthisspriteclicked":
      return "When This Sprite Clicked";
    case "event_whenbackdropswitchesto":
      return `When Backdrop Switches To ${getInputValue(
        block,
        "BACKDROP",
        blocks
      )}`;
    case "event_whenbroadcastreceived":
      return `When I Receive ${getFieldValue(block, "BROADCAST_OPTION")}`;
    // Control blocks
    case "control_wait":
      return `Wait ${getInputValue(block, "DURATION", blocks)} Seconds`;
    case "control_stop":
      return "Stop";
    case "control_if":
      return "If";
    case "control_if_else":
      return "If Else";
    case "control_repeat":
      return `Repeat ${getInputValue(block, "TIMES", blocks)}`;
    case "control_forever":
      return "Forever";
    case "control_repeat_until":
      return "Repeat Until";
    // Motion blocks
    case "motion_movesteps":
      return `Move ${getInputValue(block, "STEPS", blocks)} Steps`;
    case "motion_turnright":
      return `Turn Right ${getInputValue(block, "DEGREES", blocks)} Degrees`;
    case "motion_turnleft":
      return `Turn Left ${getInputValue(block, "DEGREES", blocks)} Degrees`;
    case "motion_gotoxy":
      return `Go To x: ${getInputValue(block, "X", blocks)}, y: ${getInputValue(
        block,
        "Y",
        blocks
      )}`;
    // Looks blocks
    case "looks_say":
    case "looks_sayforsecs":
      return `Say ${getInputValue(block, "MESSAGE", blocks)}`;
    case "looks_think":
    case "looks_thinkforsecs":
      return `Think ${getInputValue(block, "MESSAGE", blocks)}`;
    // Sound blocks
    case "sound_play":
    case "sound_playuntildone":
      return `Play Sound ${getInputValue(block, "SOUND_MENU", blocks)}`;
    // Sensing blocks
    case "sensing_resettimer":
      return "Reset Timer";
    // Data blocks
    case "data_setvariableto":
      return `Set ${getFieldValue(block, "VARIABLE")} To ${getInputValue(
        block,
        "VALUE",
        blocks
      )}`;
    case "data_changevariableby":
      return `Change ${getFieldValue(block, "VARIABLE")} By ${getInputValue(
        block,
        "VALUE",
        blocks
      )}`;
    // Operators
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
    // Default case
    default:
      // Convert opcode to a more readable format
      return formatOpcode(block.opcode);
  }
}

// Helper function to format opcodes into readable labels
function formatOpcode(opcode) {
  // Replace underscores with spaces
  let label = opcode.replace(/_/g, " ");
  // Capitalize first letter of each word
  label = label.replace(/\b\w/g, (char) => char.toUpperCase());
  return label;
}

function getBlockType(block) {
  if (HAT_BLOCKS.includes(block.opcode) || block.opcode === "control_stop") {
    return "terminator"; // Start or Stop
  } else if (
    [
      "control_if",
      "control_if_else",
      "control_repeat_until",
      "control_repeat",
      "control_forever",
    ].includes(block.opcode)
  ) {
    return "decision"; // Decision point
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
    return "inputoutput"; // Input/Output
  } else {
    return "process"; // Process
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
    let input = block.inputs[inputName];
    switch (input[0]) {
      case 1:
        // Literal value
        return input[1][1];
      case 3:
        // Block input (could be a reporter)
        let inputBlockId = input[1];
        let inputBlock = blocks[inputBlockId];
        if (inputBlock) {
          return getBlockLabel(inputBlock, blocks);
        }
        break;
      case 2:
        // Variable or list
        return input[1][1];
      default:
        return "";
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

function getLastBlockId(blockId, blocks) {
  let currentId = blockId;
  while (blocks[currentId] && blocks[currentId].next) {
    currentId = blocks[currentId].next;
  }
  return currentId;
}

function buildFlowchartDefinition(nodes, connections) {
  let nodeDefs = "";
  let connDefs = "";

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

    // Build the node definition
    nodeDefs += `${node.id}=>${nodeType}: ${node.label}\n`;
  }

  // Build connection definitions
  for (let conn of connections) {
    let fromNode = nodes[conn.from].id;
    let toNode = nodes[conn.to].id;
    let connStr = `${fromNode}`;

    if (conn.condition === "yes") {
      connStr += `(yes)`;
    } else if (conn.condition === "no") {
      connStr += `(no)`;
    }

    connStr += `->${toNode}\n`;

    connDefs += connStr;
  }

  let definition = nodeDefs + "\n" + connDefs;

  return definition;
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
    chart.drawSVG(subContainerId, {
      "line-width": 2,
      "arrow-end": "block",
      scale: 1,
      "yes-text": "Yes",
      "no-text": "No",
      "font-size": 14,
      "font-family": "Arial",
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
