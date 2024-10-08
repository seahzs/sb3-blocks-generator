import { getBlockLabel, getBlockType } from "./labeling.js";

export function traverseBlocks(
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

  // if (block.opcode === "control_stop") {
  //   const stopOption = block.fields.STOP_OPTION
  //     ? block.fields.STOP_OPTION[0]
  //     : "all";
  //   if (stopOption === "all" || stopOption === "this script") {
  //     console.log("should stop");

  //     // The flowchart should terminate at this block
  //     // Set the node type to 'end' if not already set
  //     return; // Stop further traversal
  //   }
  // }

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

  // Find the last block of both substacks
  let lastBlockId1 = substackId
    ? findLastBlockInSubstack(substackId, blocks)
    : null;
  let lastBlockId2 = substack2Id
    ? findLastBlockInSubstack(substack2Id, blocks)
    : null;

  let nextTarget = block.next || exitTarget;

  if (nextTarget) {
    let nextBlock = blocks[nextTarget];
    if (nextBlock && nextBlock.opcode === "control_forever") {
      let foreverSubstackId = nextBlock.inputs.SUBSTACK
        ? nextBlock.inputs.SUBSTACK[1]
        : null;
      if (foreverSubstackId && blocks[foreverSubstackId]) {
        nextTarget = foreverSubstackId;
      }
    }

    if (lastBlockId1) {
      let lastBlock1 = blocks[lastBlockId1];
      if (isLoopBlock(lastBlock1)) {
        addConnection(connections, lastBlockId1, nextTarget, "yes");
      } else {
        addConnection(connections, lastBlockId1, nextTarget);
      }
    }

    if (lastBlockId2) {
      let lastBlock2 = blocks[lastBlockId2];
      if (isLoopBlock(lastBlock2)) {
        addConnection(connections, lastBlockId2, nextTarget, "yes");
      } else {
        addConnection(connections, lastBlockId2, nextTarget);
      }
    }

    if (block.opcode === "control_if")
      addConnection(connections, blockId, nextTarget, "no");

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
        exitTarget,
        currentLevel,
        currentSequence + 1 + substack2Length,
        foreverStartId
      );
    }
  } else if (foreverStartId) {
    // If there's no next block but we're in a forever loop, connect back to the start
    if (lastBlockId1) {
      let lastBlock1 = blocks[lastBlockId1];
      if (isLoopBlock(lastBlock1)) {
        addConnection(connections, lastBlockId1, foreverStartId, "yes");
      } else {
        addConnection(connections, lastBlockId1, foreverStartId);
      }
    }
    if (lastBlockId2) {
      let lastBlock2 = blocks[lastBlockId2];
      if (isLoopBlock(lastBlock2)) {
        addConnection(connections, lastBlockId2, foreverStartId, "yes");
      } else {
        addConnection(connections, lastBlockId2, foreverStartId);
      }
    }
    if (block.opcode === "control_if")
      addConnection(connections, blockId, foreverStartId, "no");
  } else {
    if (lastBlockId1) {
      if (isLoopBlock(blocks[lastBlockId1])) {
        addConnection(connections, lastBlockId1, "end", "yes");
      } else {
        addConnection(connections, lastBlockId1, "end");
      }
    }
    if (lastBlockId2) {
      if (isLoopBlock(blocks[lastBlockId2])) {
        addConnection(connections, lastBlockId2, "end", "yes");
      } else {
        addConnection(connections, lastBlockId2, "end");
      }
    }
    if (block.opcode === "control_if")
      addConnection(connections, blockId, "end", "no");
  }
}

function isLoopBlock(block) {
  return ["control_repeat", "control_repeat_until"].includes(block.opcode);
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

    let lastBlockId = findLastBlockInSubstack(substackId, blocks);
    addConnection(connections, lastBlockId, blockId);
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

function findLastBlockInSubstack(startBlockId, blocks) {
  let currentBlockId = startBlockId;
  let lastBlockId = startBlockId;
  while (currentBlockId) {
    lastBlockId = currentBlockId;
    let currentBlock = blocks[currentBlockId];
    currentBlockId = currentBlock.next;
  }
  return lastBlockId;
}

export function addConnection(connections, from, to, condition) {
  if (
    !connections.some(
      (conn) =>
        conn.from === from && conn.to === to && conn.condition === condition
    )
  ) {
    connections.push({ from, to, condition });
  }
}
