import {
  parseSb3File,
  loadProject,
  downloadSvg,
  downloadPng,
  renderScratchBlocksAndFlowcharts,
} from "./imageGenHelpers.js";

export function handleFileUpload(e) {
  e.preventDefault();
  textContainer.hidden = true;
  blocksContainer.hidden = true;
  errorMsg.hidden = true;
  sb3File = e.target.files[0];
  parseSb3File(sb3File).then((projectJson) => {
    loadProject(JSON.parse(projectJson));
  });
}

// This function renders Scratch blocks and provides download options for SVG and PNG
export function renderScratchImage() {
  spriteList.addEventListener("change", () => {
    renderScratchBlocksAndFlowcharts(hatBlocks, blocks);
  });

  spriteList.addEventListener("click", () => {
    renderScratchBlocksAndFlowcharts(hatBlocks, blocks);
  });

  blockSize.addEventListener("change", () => {
    renderScratchBlocksAndFlowcharts(hatBlocks, blocks);
  });

  new ClipboardJS("#copyText");

  document.getElementById("downloadText").addEventListener("click", () => {
    // Your download text functionality
  });
}
