export const HAT_BLOCKS = [
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

export function getFileNameBase(sb3File) {
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

// File download functions

export function getFileName(sb3File, extension) {
  return (
    sb3File.name.slice(0, -4) +
    "_" +
    spriteList.value.replace("_", "") +
    extension
  );
}

export function triggerDownload(url, fileName, mimeType) {
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = fileName;
  downloadLink.type = mimeType;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}
