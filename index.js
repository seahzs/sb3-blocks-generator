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
function traverseBlocks(
  blockId,
  blocks,
  nodes,
  connections,
  nodeCounter,
  exitTarget = null
) {
  let block = blocks[blockId];
  if (!block) return;

  // Prevent processing the same block multiple times
  if (nodes[blockId]) return;

  // Assign a unique ID to the node
  let nodeId = "node" + nodeCounter.value++;
  let nodeLabel = getBlockLabel(block, blocks);
  let nodeType = getBlockType(block);

  // Skip adding the "forever" block to the nodes
  if (block.opcode === "control_forever") {
    let substackId = block.inputs.SUBSTACK ? block.inputs.SUBSTACK[1] : null;

    if (substackId) {
      // Traverse the substack (do not add the "forever" block itself as a node)
      traverseBlocks(substackId, blocks, nodes, connections, nodeCounter, null);

      // Find the last block(s) in the substack
      let lastBlockIds = getLastBlockIds(substackId, blocks);

      // Create connections from last block(s) back to the first block
      lastBlockIds.forEach((lastBlockId) => {
        connections.push({
          from: lastBlockId,
          to: substackId, // Connect the last block to the first block
          condition: "loop", // Indicate a loop
        });
      });
    }

    // If there's a next block after the forever loop, continue processing
    if (block.next) {
      traverseBlocks(
        block.next,
        blocks,
        nodes,
        connections,
        nodeCounter,
        exitTarget
      );
    }

    return; // Stop further processing for this block
  }

  nodes[blockId] = { id: nodeId, label: nodeLabel, type: nodeType };

  console.log("opcode", block.opcode);

  // Special handling for stop block (end)
  if (block.opcode === "control_stop") {
    nodes[blockId] = { id: nodeId, label: nodeLabel, type: "end" };
    return; // No further traversal should happen after a stop block
  }

  // Handle special blocks with inputs/substacks
  if (block.inputs) {
    if (block.opcode === "control_if") {
      // If block
      let substackId = block.inputs.SUBSTACK ? block.inputs.SUBSTACK[1] : null;

      // 'Yes' branch (condition true)
      if (substackId) {
        connections.push({ from: blockId, to: substackId, condition: "yes" });
        traverseBlocks(
          substackId,
          blocks,
          nodes,
          connections,
          nodeCounter,
          block.next || exitTarget
        );
      } else {
        // If no substack, connect 'Yes' branch directly to next block or exitTarget
        let target = block.next || exitTarget;
        if (target && blockId !== target) {
          connections.push({ from: blockId, to: target, condition: "yes" });
        }
      }

      // 'No' branch (condition false), connect to next block or exitTarget
      let target = block.next || exitTarget;
      if (target && blockId !== target) {
        connections.push({ from: blockId, to: target, condition: "no" });
        traverseBlocks(
          target,
          blocks,
          nodes,
          connections,
          nodeCounter,
          exitTarget
        );
      }
    } else if (block.opcode === "control_if_else") {
      // If Else block
      let substackId = block.inputs.SUBSTACK ? block.inputs.SUBSTACK[1] : null;
      let substack2Id = block.inputs.SUBSTACK2
        ? block.inputs.SUBSTACK2[1]
        : null;

      // 'Yes' branch (condition true)
      if (substackId) {
        connections.push({ from: blockId, to: substackId, condition: "yes" });
        traverseBlocks(
          substackId,
          blocks,
          nodes,
          connections,
          nodeCounter,
          block.next || exitTarget
        );
      } else {
        // If no substack, connect 'Yes' branch directly to next block or exitTarget
        let target = block.next || exitTarget;
        if (target && blockId !== target) {
          connections.push({ from: blockId, to: target, condition: "yes" });
        }
      }

      // 'No' branch (condition false)
      if (substack2Id) {
        connections.push({ from: blockId, to: substack2Id, condition: "no" });
        traverseBlocks(
          substack2Id,
          blocks,
          nodes,
          connections,
          nodeCounter,
          block.next || exitTarget
        );
      } else {
        // If no substack2, connect 'No' branch directly to next block or exitTarget
        let target = block.next || exitTarget;
        if (target && blockId !== target) {
          connections.push({ from: blockId, to: target, condition: "no" });
        }
      }
    } else if (
      ["control_repeat", "control_repeat_until"].includes(block.opcode)
    ) {
      // Loop blocks
      let substackId = block.inputs.SUBSTACK ? block.inputs.SUBSTACK[1] : null;

      // Add condition labels to loop connections
      if (block.opcode === "control_repeat_until") {
        // 'No' branch (continue looping)
        if (substackId) {
          connections.push({ from: blockId, to: substackId, condition: "no" });
          traverseBlocks(
            substackId,
            blocks,
            nodes,
            connections,
            nodeCounter,
            blockId
          );
        } else {
          // If no substack, loop back directly
          connections.push({ from: blockId, to: blockId, condition: "no" });
        }

        // 'Yes' branch (exit loop)
        let target = block.next || exitTarget;
        if (target && blockId !== target) {
          connections.push({ from: blockId, to: target, condition: "yes" });
          traverseBlocks(
            target,
            blocks,
            nodes,
            connections,
            nodeCounter,
            exitTarget
          );
        }
      } else if (block.opcode === "control_repeat") {
        // 'No' branch (continue looping)
        if (substackId) {
          connections.push({ from: blockId, to: substackId, condition: "no" });
          traverseBlocks(
            substackId,
            blocks,
            nodes,
            connections,
            nodeCounter,
            blockId
          );
        } else {
          // If no substack, loop back directly
          connections.push({ from: blockId, to: blockId, condition: "no" });
        }

        // 'Yes' branch (exit loop)
        let target = block.next || exitTarget;
        if (target && blockId !== target) {
          connections.push({ from: blockId, to: target, condition: "yes" });
          traverseBlocks(
            target,
            blocks,
            nodes,
            connections,
            nodeCounter,
            exitTarget
          );
        }
      }
    } else if (block.opcode === "control_forever") {
      // Forever loop block
      let substackId = block.inputs.SUBSTACK ? block.inputs.SUBSTACK[1] : null;
      if (substackId) {
        // Traverse the substack
        traverseBlocks(
          substackId,
          blocks,
          nodes,
          connections,
          nodeCounter,
          null
        );

        // Find the last block(s) in the substack
        let lastBlockIds = getLastBlockIds(substackId, blocks);

        // Create connections from last block(s) back to the first block
        lastBlockIds.forEach((lastBlockId) => {
          connections.push({
            from: lastBlockId,
            to: substackId,
            condition: "loop",
          });
        });
      }

      // If there's a next block after the forever loop, connect it
      if (block.next) {
        traverseBlocks(
          block.next,
          blocks,
          nodes,
          connections,
          nodeCounter,
          exitTarget
        );
      }

      return; // Exit the function early for "forever" block
    } else {
      // Handle other blocks
      if (block.next && blockId !== block.next) {
        let nextBlock = blocks[block.next];

        // Check if the next block is a forever block
        if (nextBlock && nextBlock.opcode === "control_forever") {
          let substackId = nextBlock.inputs.SUBSTACK
            ? nextBlock.inputs.SUBSTACK[1]
            : null;

          // If the next block is a forever block, connect to the first block of the forever loop's substack
          if (substackId) {
            connections.push({
              from: blockId,
              to: substackId,
              condition: "bottom",
            });
          }
        } else {
          connections.push({ from: blockId, to: block.next });
        }

        traverseBlocks(
          block.next,
          blocks,
          nodes,
          connections,
          nodeCounter,
          exitTarget
        );
      } else if (exitTarget && blockId !== exitTarget) {
        connections.push({ from: blockId, to: exitTarget });
        traverseBlocks(
          exitTarget,
          blocks,
          nodes,
          connections,
          nodeCounter,
          null
        );
      }
    }
  } else {
    // No inputs, proceed to the next block
    if (block.next && blockId !== block.next) {
      connections.push({ from: blockId, to: block.next });
      traverseBlocks(
        block.next,
        blocks,
        nodes,
        connections,
        nodeCounter,
        exitTarget
      );
    } else if (exitTarget && blockId !== exitTarget) {
      connections.push({ from: blockId, to: exitTarget });
      traverseBlocks(exitTarget, blocks, nodes, connections, nodeCounter, null);
    }
  }
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

    // Check if both nodes exist before attempting to create the connection
    if (!fromNode || !toNode) {
      console.error(
        `Connection error: Missing nodes for connection from ${conn.from} to ${conn.to}`
      );
      continue; // Skip this connection if either node is undefined
    }

    let connStr = `${fromNode}`;

    if (conn.condition === "yes") {
      connStr += `(yes)`;
    } else if (conn.condition === "no") {
      connStr += `(no)`;
    } else if (conn.condition === "loop") {
      connStr += `(left)`; // Use 'left' to create a loop back arrow
    }

    connStr += `->${toNode}\n`;

    connDefs += connStr;
  }

  let definition = nodeDefs + "\n" + connDefs;

  console.log("nodes ", nodes);
  console.log("connections ", connections);

  return definition;
}

// Function to collect all blocks within a substack
function collectSubstackBlocks(blockId, blocks) {
  let substackBlocks = new Set();
  let visited = new Set();

  function dfs(currentId) {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    let block = blocks[currentId];
    if (!block) return;

    substackBlocks.add(currentId);

    if (block.inputs) {
      if (block.opcode === "control_if" || block.opcode === "control_if_else") {
        let substackId = block.inputs.SUBSTACK
          ? block.inputs.SUBSTACK[1]
          : null;
        let substack2Id = block.inputs.SUBSTACK2
          ? block.inputs.SUBSTACK2[1]
          : null;

        if (substackId) dfs(substackId);
        if (substack2Id) dfs(substack2Id);

        if (block.next) dfs(block.next);
      } else if (
        ["control_repeat", "control_repeat_until", "control_forever"].includes(
          block.opcode
        )
      ) {
        let substackId = block.inputs.SUBSTACK
          ? block.inputs.SUBSTACK[1]
          : null;

        if (substackId) dfs(substackId);

        if (block.next) dfs(block.next);
      } else {
        if (block.next) dfs(block.next);
      }
    } else {
      if (block.next) dfs(block.next);
    }
  }

  dfs(blockId);
  return substackBlocks;
}

function getLastBlockIds(blockId, blocks, substackBlocks = null) {
  let endpoints = [];
  let visited = {};

  function dfs(currentId) {
    if (visited[currentId]) return;
    visited[currentId] = true;

    let block = blocks[currentId];
    if (!block) return;

    if (substackBlocks && !substackBlocks.has(currentId)) {
      // We have exited the substack
      return;
    }

    let hasNext = false;

    if (block.inputs) {
      if (block.opcode === "control_if" || block.opcode === "control_if_else") {
        let substackId = block.inputs.SUBSTACK
          ? block.inputs.SUBSTACK[1]
          : null;
        let substack2Id = block.inputs.SUBSTACK2
          ? block.inputs.SUBSTACK2[1]
          : null;

        if (substackId) dfs(substackId);
        if (substack2Id) dfs(substack2Id);

        if (block.next && (!substackBlocks || substackBlocks.has(block.next))) {
          dfs(block.next);
          hasNext = true;
        }
      } else if (
        ["control_repeat", "control_repeat_until", "control_forever"].includes(
          block.opcode
        )
      ) {
        let substackId = block.inputs.SUBSTACK
          ? block.inputs.SUBSTACK[1]
          : null;

        if (substackId) dfs(substackId);

        if (block.next && (!substackBlocks || substackBlocks.has(block.next))) {
          dfs(block.next);
          hasNext = true;
        }
      } else {
        if (block.next && (!substackBlocks || substackBlocks.has(block.next))) {
          dfs(block.next);
          hasNext = true;
        }
      }
    } else {
      if (block.next && (!substackBlocks || substackBlocks.has(block.next))) {
        dfs(block.next);
        hasNext = true;
      }
    }

    if (!hasNext) {
      endpoints.push(currentId);
    }
  }

  dfs(blockId);
  return endpoints;
}

function isBlockInSameSubstack(currentBlockId, nextBlockId, blocks) {
  // Implement logic to determine if nextBlockId is still within the same substack as currentBlockId
  // This may involve checking the parent relationships or structure of the blocks
  // For simplicity, let's assume blocks have a `parent` property
  let currentBlock = blocks[currentBlockId];
  let nextBlock = blocks[nextBlockId];
  return currentBlock.parent === nextBlock.parent;
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

    // Control blocks
    case "control_wait":
      return `Wait ${getInputValue(block, "DURATION", blocks)} seconds`;
    case "control_stop":
      return `Stop "${getFieldValue(block, "STOP_OPTION")}"`;
    case "control_if":
      return `If (${getInputValue(block, "CONDITION", blocks) || "condition"})`;
    case "control_if_else":
      return `If (${
        getInputValue(block, "CONDITION", blocks) || "condition"
      }) Else`;
    case "control_repeat":
      return `Repeat ${getInputValue(block, "TIMES", blocks) || "10"} times`;
    case "control_repeat_until":
      return `Repeat until (${
        getInputValue(block, "CONDITION", blocks) || "condition"
      })`;
    case "control_wait_until":
      return `Wait until (${
        getInputValue(block, "CONDITION", blocks) || "condition"
      })`;
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
    case "motion_glideto":
      return `Glide ${getInputValue(
        block,
        "SECS",
        blocks
      )} secs to ${getInputValue(block, "TO", blocks)}`;
    case "motion_pointindirection":
      return `Point in direction ${getInputValue(block, "DIRECTION", blocks)}`;
    case "motion_pointtowards":
      return `Point towards ${getInputValue(block, "TOWARDS", blocks)}`;
    case "motion_ifonedgebounce":
      return "If on edge, bounce";
    case "motion_setrotationstyle":
      return `Set rotation style "${getFieldValue(block, "STYLE")}"`;

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
      return `Key "${getFieldValue(block, "KEY_OPTION")}" pressed?`;
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
  console.log("block", block);

  if (block.inputs && block.inputs[inputName]) {
    let input = block.inputs[inputName];
    switch (input[0]) {
      case 1: // Literal value
        return input[1][1];
      case 2: // Variable or list (handle this properly)
        let variableOrListBlockId = input[1][1]; // Typically, the variable or list name is here
        if (variableOrListBlockId) {
          return variableOrListBlockId; // Return the variable or list name
        }
        break;
      case 3: // Block input (another block or reporter block)
        let inputBlockId = input[1];
        let inputBlock = blocks[inputBlockId];
        if (inputBlock) {
          // Recursively call getBlockLabel to get the label for the nested block
          return getBlockLabel(inputBlock, blocks);
        }
        break;
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
      "line-width": 2,
      "arrow-end": "block",
      scale: 1,
      "yes-text": "Yes",
      "no-text": "No",
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
