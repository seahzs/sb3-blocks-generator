import {
  generateScratchblocksCode,
  findHatBlocks,
  getFileNameBase,
  getFileName,
  triggerDownload,
} from "./helpers.js";

import {
  generateFlowchartDefinition,
  renderFlowchart,
} from "./flowchart-gen/main.js";

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
  // renderAllFlowcharts();

  flowchartDefinitions.forEach((definition, index) => {
    renderFlowchart(definition, index);
  });
}

export function generateTxtFileDownload() {
  const fileName = getFileName(sb3File, ".txt");
  const blob = new Blob([scratchBlocksCode], { type: "text/plain" });
  const objectURL = URL.createObjectURL(blob);
  triggerDownload(objectURL, fileName, "text/plain");
}
export function downloadSvg(svgStr, index) {
  const fileName = `${getFileNameBase(sb3File)}_block${index + 1}.svg`;
  const blob = new Blob([svgStr], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, fileName, "image/svg+xml");
  URL.revokeObjectURL(url);
}

export function downloadPng(viewer, index) {
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

export function downloadFlowchartSvg(containerId, index) {
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

export function downloadFlowchartPng(containerId, index) {
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
