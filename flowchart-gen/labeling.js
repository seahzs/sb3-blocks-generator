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
