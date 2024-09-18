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
          blockItem.next &&
          blockItem.topLevel &&
          HAT_BLOCKS.includes(blockItem.opcode)
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
