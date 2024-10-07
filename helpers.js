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

let scratchblocksCode = "";

export function getFileNameBase() {
  return sb3File.name.slice(0, -4) + "_" + spriteList.value.replace("_", "");
}

export function findHatBlocks(blocks) {
  return Object.keys(blocks).filter((key) => {
    const blockItem = blocks[key];
    return blockItem.topLevel && HAT_BLOCKS.includes(blockItem.opcode);
  });
}

export function generateScratchblocksCode(hatBlocks, blocks) {
  return hatBlocks
    .map((hatKey) =>
      parseSB3Blocks.toScratchblocks(hatKey, blocks, "en", {
        tab: " ".repeat(4),
        variableStyle: "as-needed",
      })
    )
    .join("\n\n");
}

// export function renderAllFlowcharts() {
//   flowchartDefinitions.forEach((definition, index) => {
//     renderFlowchart(definition, index);
//   });
// }

// File download functions
export function generateTxtFileDownload() {
  const fileName = getFileName(".txt");
  const blob = new Blob([scratchblocksCode], { type: "text/plain" });
  const objectURL = URL.createObjectURL(blob);
  triggerDownload(objectURL, fileName, "text/plain");
}

function getFileName(extension) {
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

export function downloadSvg(svgStr, index) {
  const fileName = `${getFileNameBase()}_block${index + 1}.svg`;
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
        const fileName = `${getFileNameBase()}_block${index + 1}.png`;
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
    const fileName = `${getFileNameBase()}_flowchart${index + 1}.svg`;
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
        const fileName = `${getFileNameBase()}_flowchart${index + 1}.png`;
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
