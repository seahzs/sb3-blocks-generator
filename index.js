// import {
//   generateScratchblocksCode,
//   findHatBlocks,
//   getFileNameBase,
//   getFileName,
//   triggerDownload,
// } from "./helpers.js";

// import { generateFlowchartDefinition, renderFlowchart } from "./main.js";

// Existing variable declarations
const spriteForm = document.getElementById("spriteForm");
const spriteList = document.getElementById("spriteList");
const errorMsg = document.getElementById("errorMsg");
const textContainer = document.getElementById("textContainer");
const textAreaInner = document.getElementById("textAreaInner");
const blocksContainer = document.getElementById("blocksContainer");
const blockSize = document.getElementById("blockSize");

let sb3File = {};
let projectData = {};
let scratchBlocksCode = "";
let viewers = [];
let flowchartDefinitions = []; // Array to store flowchart definitions
let hatBlocks = []; // Array to store hat blocks
let blocks = {}; // Object to store all blocks

// Event listeners
document
  .getElementById("sb3Upload")
  .addEventListener("change", handleFileUpload);
spriteList.addEventListener("change", generateScratchblocks);
spriteList.addEventListener("click", generateScratchblocks);
blockSize.addEventListener("change", handleBlockSizeChange);
new ClipboardJS("#copyText");
document
  .getElementById("downloadText")
  .addEventListener("click", generateTxtFileDownload);

// File handling functions
function handleFileUpload(e) {
  e.preventDefault();
  textContainer.hidden = true;
  blocksContainer.hidden = true;
  errorMsg.hidden = true;
  sb3File = e.target.files[0];
  parseSb3File(sb3File).then((projectJson) => {
    loadProject(JSON.parse(projectJson));
  });
}

async function parseSb3File(file) {
  const zip = await JSZip.loadAsync(file);
  const project = await zip.file("project.json").async("text");
  return project;
}

async function loadProject(projJSON) {
  projectData = projJSON;
  spriteForm.hidden = false;
  updateSpriteList();
}

function updateSpriteList() {
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

// UI utility functions
function hideContainers(toHide) {
  textContainer.hidden = blocksContainer.hidden = toHide;
  errorMsg.hidden = !toHide;
}

function handleBlockSizeChange() {
  renderScratchBlocksAndFlowcharts(hatBlocks, blocks);
}

// Scratchblocks generation
function generateScratchblocks() {
  if (!projectData || Object.keys(projectData).length === 0) {
    errorMsg.textContent = "Project data is empty/invalid.";
    hideContainers(true);
    return;
  }

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
  }

  hideContainers(false);
  blocks = target.blocks;
  hatBlocks = findHatBlocks(blocks);
  scratchBlocksCode = generateScratchblocksCode(hatBlocks, blocks);
  textAreaInner.textContent = scratchBlocksCode;
  flowchartDefinitions = hatBlocks.map((hatKey) =>
    generateFlowchartDefinition(hatKey, blocks)
  );
  renderScratchBlocksAndFlowcharts(hatBlocks, blocks);

  console.log("target.blocks", target.blocks);
}

async function renderScratchBlocksAndFlowcharts(hatBlocks, blocks) {
  const container = document.getElementById("scratchBlocksAndFlowcharts");
  container.innerHTML = ""; // Clear previous content
  viewers = [];
  const renderOpts = {
    style: "scratch3",
    languages: ["en"],
    scale: blockSize.value,
  };

  for (let i = 0; i < hatBlocks.length; i++) {
    const hatKey = hatBlocks[i];
    const script = parseSB3Blocks.toScratchblocks(hatKey, blocks, "en", {
      tab: " ".repeat(4),
      variableStyle: "as-needed",
    });

    const blockFlowchartContainer = document.createElement("div");
    blockFlowchartContainer.className = "block-flowchart-container";

    // Scratch Block
    const blockContainer = document.createElement("div");
    blockContainer.className = "block-container";

    // Create a container for Scratch block buttons
    const blockButtonsContainer = document.createElement("div");
    blockButtonsContainer.className = "download-buttons";
    blockContainer.appendChild(blockButtonsContainer);

    const viewer = scratchblocks.newView(
      scratchblocks.parse(script, renderOpts),
      renderOpts
    );

    await viewer.render();

    const svgStr = viewer.exportSVGString();
    const svgImg = document.createElement("img");
    svgImg.src =
      "data:image/svg+xml;utf8," + svgStr.replace(/[#]/g, encodeURIComponent);
    blockContainer.appendChild(svgImg);

    const downloadSvgBtn = document.createElement("button");
    downloadSvgBtn.textContent = "Download SVG";
    downloadSvgBtn.onclick = () => downloadSvg(svgStr, i);
    blockButtonsContainer.appendChild(downloadSvgBtn);

    const downloadPngBtn = document.createElement("button");
    downloadPngBtn.textContent = "Download PNG";
    downloadPngBtn.onclick = () => downloadPng(viewer, i);
    blockButtonsContainer.appendChild(downloadPngBtn);

    blockFlowchartContainer.appendChild(blockContainer);

    viewers.push({ viewer, svgImg });

    // Flowchart
    const flowchartContainer = document.createElement("div");
    flowchartContainer.className = "flowchart-container";

    // Create a container for flowchart buttons
    const flowchartButtonsContainer = document.createElement("div");
    flowchartButtonsContainer.className = "download-buttons";
    flowchartContainer.appendChild(flowchartButtonsContainer);

    // Add flowchart download buttons
    const downloadFlowchartSvgBtn = document.createElement("button");
    downloadFlowchartSvgBtn.textContent = "Download Flowchart SVG";
    downloadFlowchartSvgBtn.onclick = () =>
      downloadFlowchartSvg(`flowchart${i}`, i);
    flowchartButtonsContainer.appendChild(downloadFlowchartSvgBtn);

    const downloadFlowchartPngBtn = document.createElement("button");
    downloadFlowchartPngBtn.textContent = "Download Flowchart PNG";
    downloadFlowchartPngBtn.onclick = () =>
      downloadFlowchartPng(`flowchart${i}`, i);
    flowchartButtonsContainer.appendChild(downloadFlowchartPngBtn);

    // Create a div for the actual flowchart content
    const flowchartContent = document.createElement("div");
    flowchartContent.id = `flowchart${i}`;
    flowchartContainer.appendChild(flowchartContent);

    blockFlowchartContainer.appendChild(flowchartContainer);

    container.appendChild(blockFlowchartContainer);
  }

  flowchartDefinitions.forEach((definition, index) => {
    renderFlowchart(definition, index);
  });
}

function generateTxtFileDownload() {
  const fileName = getFileName(sb3File, ".txt");
  const blob = new Blob([scratchBlocksCode], { type: "text/plain" });
  const objectURL = URL.createObjectURL(blob);
  triggerDownload(objectURL, fileName, "text/plain");
}
function downloadSvg(svgStr, index) {
  const fileName = `${getFileNameBase(sb3File)}_block${index + 1}.svg`;
  const blob = new Blob([svgStr], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, fileName, "image/svg+xml");
  URL.revokeObjectURL(url);
}

function downloadPng(viewer, index) {
  const canvas = document.createElement("canvas");
  const scale = blockSize.value;
  canvas.width = viewer.width * scale;
  canvas.height = viewer.height * scale;
  const ctx = canvas.getContext("2d");

  const svgString = viewer.exportSVGString();
  const img = new Image();
  img.onload = function () {
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const fileName = `${getFileNameBase(sb3File)}_block${index + 1}.png`;
        triggerDownload(url, fileName, "image/png");
        URL.revokeObjectURL(url);
      } else {
        console.error("Failed to create blob for PNG download");
      }
    }, "image/png");
  };
  img.src =
    "data:image/svg+xml;base64," +
    btoa(unescape(encodeURIComponent(svgString)));
}

function downloadFlowchartSvg(containerId, index) {
  const svgElement = document.getElementById(containerId).querySelector("svg");
  if (svgElement) {
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const fileName = `${getFileNameBase(sb3File)}_flowchart${index + 1}.svg`;
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, fileName, "image/svg+xml");
    URL.revokeObjectURL(url);
  } else {
    console.error("Flowchart SVG not found.");
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

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    img.onload = function () {
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const fileName = `${getFileNameBase(sb3File)}_flowchart${
          index + 1
        }.png`;
        triggerDownload(url, fileName, "image/png");
        URL.revokeObjectURL(url);
      });
    };
    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgString)));
  } else {
    console.error("Flowchart SVG not found.");
  }
}

// Helpers

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

function getFileNameBase(sb3File) {
  return sb3File.name.slice(0, -4) + "_" + spriteList.value.replace("_", "");
}

function findHatBlocks(blocks) {
  return Object.keys(blocks).filter((key) => {
    const blockItem = blocks[key];
    return blockItem.topLevel && HAT_BLOCKS.includes(blockItem.opcode);
  });
}

function generateScratchblocksCode(hatBlocks, blocks) {
  return hatBlocks
    .map((hatKey) =>
      parseSB3Blocks.toScratchblocks(hatKey, blocks, "en", {
        tab: " ".repeat(4),
        variableStyle: "as-needed",
      })
    )
    .join("\n\n");
}

// File download functions

function getFileName(sb3File, extension) {
  return (
    sb3File.name.slice(0, -4) +
    "_" +
    spriteList.value.replace("_", "") +
    extension
  );
}

function triggerDownload(url, fileName, mimeType) {
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = fileName;
  downloadLink.type = mimeType;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

////////////////////////////////

// Flowchart generation main functions

// import { traverseBlocks, addConnection } from "./traversal.js";
// import { buildFlowchartDefinition } from "./rendering.js";

function generateFlowchartDefinition(hatKey, blocks) {
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
    level: -1,
    sequence: Object.keys(nodes).length,
  };

  return buildFlowchartDefinition(nodes, connections);
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

////////////////////////////////

// Traversal functions

// import { getBlockLabel, getBlockType } from "./labeling.js";

function traverseBlocks(
  blockId,
  blocks,
  nodes,
  connections,
  nodeCounter,
  exitTarget = null,
  parentLevel = 0,
  parentSequence = 0,
  foreverStartId = null
) {
  let block = blocks[blockId];
  if (!block || nodes[blockId]) return;

  let nodeId = "node" + nodeCounter.value++;
  let nodeLabel = getBlockLabel(block, blocks);
  let nodeType = getBlockType(block);

  let currentLevel = parentLevel;
  let currentSequence = parentSequence;

  if (block.opcode === "control_forever") {
    handleForeverBlock(
      blockId,
      block,
      blocks,
      nodes,
      connections,
      nodeCounter,
      exitTarget,
      currentLevel,
      currentSequence
    );
    return;
  }

  nodes[blockId] = {
    id: nodeId,
    label: nodeLabel,
    type: nodeType,
    level: currentLevel,
    sequence: currentSequence,
  };

  if (block.opcode === "control_stop") {
    const stopOption = block.fields.STOP_OPTION
      ? block.fields.STOP_OPTION[0]
      : "all";
    if (stopOption === "all" || stopOption === "this script") {
      addConnection(connections, blockId, "end");

      // The flowchart should terminate at this block
      // Set the node type to 'end' if not already set
      return; // Stop further traversal
    }
  }

  if (["control_if", "control_if_else"].includes(block.opcode)) {
    handleIfBlocks(
      blockId,
      block,
      blocks,
      nodes,
      connections,
      nodeCounter,
      exitTarget,
      currentLevel,
      currentSequence,
      foreverStartId
    );
  } else if (
    ["control_repeat", "control_repeat_until"].includes(block.opcode)
  ) {
    handleLoopBlocks(
      blockId,
      block,
      blocks,
      nodes,
      connections,
      nodeCounter,
      exitTarget,
      currentLevel,
      currentSequence,
      foreverStartId
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
      currentLevel,
      currentSequence,
      foreverStartId
    );
  }
}

function countBlocksInSubstack(startBlockId, blocks) {
  let count = 0;
  let currentBlockId = startBlockId;
  while (currentBlockId) {
    count++;
    let currentBlock = blocks[currentBlockId];
    if (
      currentBlock.opcode === "control_if" ||
      currentBlock.opcode === "control_if_else"
    ) {
      // For if/else blocks, add the count of blocks in their substacks
      if (currentBlock.inputs.SUBSTACK) {
        count += countBlocksInSubstack(currentBlock.inputs.SUBSTACK[1], blocks);
      }
      if (currentBlock.inputs.SUBSTACK2) {
        count += countBlocksInSubstack(
          currentBlock.inputs.SUBSTACK2[1],
          blocks
        );
      }
    } else if (
      ["control_repeat", "control_repeat_until", "control_forever"].includes(
        currentBlock.opcode
      )
    ) {
      // For loop blocks, add the count of blocks in their substack
      if (currentBlock.inputs.SUBSTACK) {
        count += countBlocksInSubstack(currentBlock.inputs.SUBSTACK[1], blocks);
      }
    }
    currentBlockId = currentBlock.next;
  }
  return count;
}

function handleForeverBlock(
  blockId,
  block,
  blocks,
  nodes,
  connections,
  nodeCounter,
  exitTarget,
  currentLevel,
  currentSequence
) {
  let substackId = block.inputs.SUBSTACK ? block.inputs.SUBSTACK[1] : null;
  if (substackId) {
    // addConnection(connections, blockId, substackId);
    traverseBlocks(
      substackId,
      blocks,
      nodes,
      connections,
      nodeCounter,
      null,
      currentLevel,
      currentSequence,
      substackId
    );
  }
  return;
}

function handleIfBlocks(
  blockId,
  block,
  blocks,
  nodes,
  connections,
  nodeCounter,
  exitTarget,
  currentLevel,
  currentSequence,
  foreverStartId
) {
  let substackId = block.inputs.SUBSTACK ? block.inputs.SUBSTACK[1] : null;
  let substack2Id = block.inputs.SUBSTACK2 ? block.inputs.SUBSTACK2[1] : null;

  if (substackId) {
    let substackBlock = blocks[substackId];
    if (substackBlock && substackBlock.opcode === "control_forever") {
      let foreverSubstackId = substackBlock.inputs.SUBSTACK
        ? substackBlock.inputs.SUBSTACK[1]
        : null;
      if (foreverSubstackId && blocks[foreverSubstackId]) {
        addConnection(connections, blockId, foreverSubstackId, "yes");
        traverseBlocks(
          substackId,
          blocks,
          nodes,
          connections,
          nodeCounter,
          null,
          currentLevel + 1,
          currentSequence,
          foreverStartId
        );
      } else {
        addConnection(connections, blockId, blockId, "yes");
      }
    } else {
      addConnection(connections, blockId, substackId, "yes");
      traverseBlocks(
        substackId,
        blocks,
        nodes,
        connections,
        nodeCounter,
        // null,
        block.next || exitTarget,
        currentLevel + 1,
        currentSequence,
        foreverStartId
      );
    }
  } else {
    let nextTarget = block.next || exitTarget;
    // If 'if' branch is empty, connect directly to next target
    if (nextTarget) {
      addConnection(connections, blockId, nextTarget, "yes");
    } else if (foreverStartId) {
      // If there's no next block but we're in a forever loop, connect back to the start
      addConnection(connections, blockId, foreverStartId, "yes");
    } else {
      addConnection(connections, blockId, "end", "yes");
    }
  }

  if (block.opcode === "control_if_else" && substack2Id) {
    let substack2Block = blocks[substack2Id];
    if (substack2Block && substack2Block.opcode === "control_forever") {
      let foreverSubstackId = substack2Block.inputs.SUBSTACK
        ? substack2Block.inputs.SUBSTACK[1]
        : null;
      if (foreverSubstackId && blocks[foreverSubstackId]) {
        addConnection(connections, blockId, foreverSubstackId, "no");
        traverseBlocks(
          substack2Id,
          blocks,
          nodes,
          connections,
          nodeCounter,
          null,
          currentLevel,
          currentSequence + 1,
          foreverSubstackId
        );
      } else {
        addConnection(connections, blockId, blockId, "no");
      }
    } else {
      addConnection(connections, blockId, substack2Id, "no");
      traverseBlocks(
        substack2Id,
        blocks,
        nodes,
        connections,
        nodeCounter,
        // null,
        block.next || exitTarget,
        currentLevel,
        currentSequence + 1,
        foreverStartId
      );
    }
  } else {
    let nextTarget = block.next || exitTarget;
    // If 'if' branch is empty, connect directly to next target
    if (nextTarget) {
      addConnection(connections, blockId, nextTarget, "no");
    } else if (foreverStartId) {
      // If there's no next block but we're in a forever loop, connect back to the start
      addConnection(connections, blockId, foreverStartId, "no");
    } else {
      addConnection(connections, blockId, "end", "no");
    }
  }
  //////

  // let nextTarget = block.next || exitTarget;

  if (block.next) {
    let substack2Length = substack2Id
      ? countBlocksInSubstack(substack2Id, blocks)
      : 0;
    traverseBlocks(
      block.next,
      blocks,
      nodes,
      connections,
      nodeCounter,
      // block.next ? exitTarget : null,
      exitTarget,
      currentLevel,
      currentSequence + 1 + substack2Length,
      foreverStartId
    );
  }
}

function handleLoopBlocks(
  blockId,
  block,
  blocks,
  nodes,
  connections,
  nodeCounter,
  exitTarget,
  currentLevel,
  currentSequence,
  foreverStartId
) {
  let substackId = block.inputs.SUBSTACK ? block.inputs.SUBSTACK[1] : null;

  if (substackId) {
    let substackBlock = blocks[substackId];
    if (substackBlock && substackBlock.opcode === "control_forever") {
      let foreverSubstackId = substackBlock.inputs.SUBSTACK
        ? substackBlock.inputs.SUBSTACK[1]
        : null;
      if (foreverSubstackId && blocks[foreverSubstackId]) {
        addConnection(connections, blockId, foreverSubstackId, "no");
        traverseBlocks(
          substackId,
          blocks,
          nodes,
          connections,
          nodeCounter,
          null,
          currentLevel + 1,
          currentSequence,
          foreverStartId
        );
      } else {
        addConnection(connections, blockId, blockId, "no");
      }
    } else {
      addConnection(connections, blockId, substackId, "no");
      traverseBlocks(
        substackId,
        blocks,
        nodes,
        connections,
        nodeCounter,
        blockId,
        currentLevel + 1,
        currentSequence,
        foreverStartId
      );
    }

    // let lastBlockId = findLastBlockInSubstack(substackId, blocks);
    // addConnection(connections, lastBlockId, blockId);
  } else {
    addConnection(connections, blockId, blockId, "no");
  }

  let nextTarget = block.next || exitTarget;
  if (nextTarget && blockId !== nextTarget) {
    let nextBlock = blocks[nextTarget];
    if (nextBlock && nextBlock.opcode === "control_forever") {
      let foreverSubstackId = nextBlock.inputs.SUBSTACK
        ? nextBlock.inputs.SUBSTACK[1]
        : null;
      if (foreverSubstackId && blocks[foreverSubstackId]) {
        addConnection(connections, blockId, foreverSubstackId, "yes");
      } else {
        addConnection(connections, blockId, nextTarget, "yes");
      }
    } else {
      addConnection(connections, blockId, nextTarget, "yes");
    }
    if (block.next) {
      traverseBlocks(
        block.next,
        blocks,
        nodes,
        connections,
        nodeCounter,
        exitTarget,
        currentLevel,
        currentSequence + 1,
        foreverStartId
      );
    }
  } else if (foreverStartId) {
    addConnection(connections, blockId, foreverStartId, "yes");
  } else {
    addConnection(connections, blockId, "end", "yes");
  }
}

function handleOtherBlocks(
  blockId,
  block,
  blocks,
  nodes,
  connections,
  nodeCounter,
  exitTarget,
  currentLevel,
  currentSequence,
  foreverStartId
) {
  if (block.next && blockId !== block.next) {
    let nextBlock = blocks[block.next];
    if (nextBlock && nextBlock.opcode === "control_forever") {
      let substackId = nextBlock.inputs.SUBSTACK
        ? nextBlock.inputs.SUBSTACK[1]
        : null;
      if (substackId) {
        addConnection(connections, blockId, substackId);
      } else {
        addConnection(connections, blockId, block.next);
      }
    } else {
      addConnection(connections, blockId, block.next);
    }
    traverseBlocks(
      block.next,
      blocks,
      nodes,
      connections,
      nodeCounter,
      exitTarget,
      currentLevel,
      currentSequence + 1,
      foreverStartId
    );
  } else if (exitTarget) {
    // If there's an exit target (e.g., for nested blocks), connect to it
    addConnection(connections, blockId, exitTarget);
  } else if (foreverStartId) {
    // If there's no next block but we're in a forever loop, connect back to the start
    addConnection(connections, blockId, foreverStartId);
  } else {
    // If there's no next block, connect to the end
    addConnection(connections, blockId, "end");
  }
}

function addConnection(connections, from, to, condition) {
  if (
    !connections.some(
      (conn) =>
        conn.from === from && conn.to === to && conn.condition === condition
    )
  ) {
    connections.push({ from, to, condition });
  }
}
////////////////////////////////

// Labeling functions

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
      return `When backdrop switches to "${getFieldValue(
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
    case "motion_changexby":
      return `Change x by ${getInputValue(block, "DX", blocks)}`;
    case "motion_changeyby":
      return `Change y by ${getInputValue(block, "DY", blocks)}`;
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
    case "looks_setsizeto":
      return `Set size to ${getInputValue(block, "SIZE", blocks)}%`;

    // Sound blocks
    case "sound_play":
      return `Start sound "${getInputValue(block, "SOUND_MENU", blocks)}"`;
    case "sound_playuntildone":
      return `Play sound "${getInputValue(
        block,
        "SOUND_MENU",
        blocks
      )}" until done`;
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
    case "sensing_setdragmode":
      // Extract the drag mode from the inputs
      return `Set Drag Mode to ${getFieldValue(block, "DRAG_MODE", blocks)}`;

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

////////////////////////////////

// Building flowchart definition

function buildFlowchartDefinition(nodes, connections) {
  let nodeDefs = "";
  let connDefs = "";

  console.log("nodes", nodes);

  const maxLineLengths = {
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

////////////////////////////////
