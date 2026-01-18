
import { CargoItem, Container, PlacedItem, Space, Dimensions, SafetyMetrics } from '../types';

// Helper to check intersection
const isOverlapping = (
    itemPos: { x: number, y: number, z: number },
    itemDim: { l: number, w: number, h: number },
    others: PlacedItem[],
    spacing: number
): boolean => {
    const EPSILON = 1; 
    for (const other of others) {
        const oL = other.rotation ? other.dimensions.width : other.dimensions.length;
        const oW = other.rotation ? other.dimensions.length : other.dimensions.width;
        const oH = other.dimensions.height;
        const noOverlap = 
            itemPos.x >= other.position.x + oL + spacing - EPSILON ||
            itemPos.x + itemDim.l <= other.position.x + EPSILON ||
            itemPos.y >= other.position.y + oH - EPSILON || 
            itemPos.y + itemDim.h <= other.position.y + EPSILON ||
            itemPos.z >= other.position.z + oW + spacing - EPSILON ||
            itemPos.z + itemDim.w <= other.position.z + EPSILON;
        if (!noOverlap) return true;
    }
    return false;
};

// --- IMPROVED STABILITY & POSITIONING ANALYSIS ---
const getPositionScore = (
    pos: { x: number, y: number, z: number },
    dim: { l: number, w: number, h: number },
    others: PlacedItem[],
    containerDims: Dimensions
) => {
    const EPS = 20; 
    let score = 0;
    
    // 1. 极大幅度强化 X 轴权重 (车头方向为 0)
    score += (pos.x / 100) * 500; 

    // 2. 前壁/前箱靠贴奖励
    const touchesFrontWall = pos.x < EPS;
    const touchesForwardBox = others.some(o => {
        const oL = o.rotation ? o.dimensions.width : o.dimensions.length;
        return Math.abs((o.position.x + oL) - pos.x) < EPS;
    });

    if (touchesFrontWall) score -= 5000;
    if (touchesForwardBox) score -= 3000;

    // 3. 垂直稳定性
    score += (pos.y / 100) * 200; 

    // 4. 侧向对齐惩罚
    let alignmentPenalty = 0;
    const myEndZ = pos.z + dim.w;

    for (const other of others) {
        const oW = other.rotation ? other.dimensions.length : other.dimensions.width;
        const oEndZ = other.position.z + oW;

        if (Math.abs(pos.z - other.position.z) < EPS && pos.z > 10) alignmentPenalty += 100;
        if (Math.abs(myEndZ - oEndZ) < EPS && myEndZ < containerDims.width - 10) alignmentPenalty += 100;
    }
    
    score += alignmentPenalty;
    return score;
};

const isPhysicallySafe = (
    item: CargoItem, 
    y: number, 
    dim: { l: number, w: number, h: number }, 
    x: number, 
    z: number, 
    others: PlacedItem[]
): boolean => {
    if (y <= 5) return true;

    const supportArea = others.reduce((acc, other) => {
        const oH = other.dimensions.height;
        if (Math.abs((other.position.y + oH) - y) > 10) return acc;
        const oL = other.rotation ? other.dimensions.width : other.dimensions.length;
        const oW = other.rotation ? other.dimensions.length : other.dimensions.width;
        const xO = Math.max(0, Math.min(x + dim.l, other.position.x + oL) - Math.max(x, other.position.x));
        const zO = Math.max(0, Math.min(z + dim.w, other.position.z + oW) - Math.max(z, other.position.z));
        return acc + (xO * zO);
    }, 0);
    
    if ((supportArea / (dim.l * dim.w)) < 0.8) return false;

    const totalHeight = y + dim.h;
    const minBase = Math.min(dim.l, dim.w);
    const hasSideSupport = others.some(o => {
        if (Math.abs(o.position.y - y) > 500) return false; 
        const oW = o.rotation ? o.dimensions.length : o.dimensions.width;
        const oL = o.rotation ? o.dimensions.width : o.dimensions.length;
        const sideTouch = Math.abs(o.position.z + oW - z) < 20 || Math.abs(z + dim.w - o.position.z) < 20;
        const frontTouch = Math.abs(o.position.x + oL - x) < 20 || Math.abs(x + dim.l - o.position.x) < 20;
        return sideTouch || frontTouch;
    });

    if (!hasSideSupport && (totalHeight / minBase) > 2.2) return false;

    return true;
};

export const packCargo = (items: CargoItem[], options: { containerDims: Dimensions, spacing: number, allowStacking: boolean, seed?: number, maxContainers?: number }): Container[] => {
  const { containerDims, spacing, allowStacking, maxContainers = 10 } = options;

  const remainingItems = [...items].sort((a, b) => {
      const volA = a.dimensions.length * a.dimensions.width * a.dimensions.height;
      const volB = b.dimensions.length * b.dimensions.width * b.dimensions.height;
      if (Math.abs(volB - volA) > 100000) return volB - volA;
      return b.dimensions.height - a.dimensions.height;
  });

  const containers: Container[] = [];
  
  // 增加 maxContainers 循环硬约束
  while (remainingItems.length > 0 && containers.length < maxContainers) {
    const currentContainer: Container = { id: containers.length + 1, items: [], ...containerDims };
    let spaces: Space[] = [{ x: 0, y: 0, z: 0, length: containerDims.length, height: containerDims.height, width: containerDims.width }];
    const packedIndices: number[] = [];

    for (let i = 0; i < remainingItems.length; i++) {
      const item = remainingItems[i];
      let bestPlacement = null;
      let minScore = Infinity;

      spaces.sort((a, b) => a.x - b.x || a.y - b.y || a.z - b.z);

      for (let s = 0; s < Math.min(spaces.length, 100); s++) {
        const space = spaces[s];
        const rotations = [
            { l: item.dimensions.length, w: item.dimensions.width, rot: false },
            { l: item.dimensions.width, w: item.dimensions.length, rot: true }
        ];

        for (const orient of rotations) {
            if (orient.l + spacing <= space.length && orient.w + spacing <= space.width && item.dimensions.height <= space.height) {
                const xOffsets = [0, 20, 50, 100];
                for (const ox of xOffsets) {
                    const testX = space.x + ox;
                    if (testX + orient.l > containerDims.length) continue;

                    if (!isOverlapping({ x: testX, y: space.y, z: space.z }, { l: orient.l, w: orient.w, h: item.dimensions.height }, currentContainer.items, spacing)) {
                        if (isPhysicallySafe(item, space.y, { l: orient.l, w: orient.w, h: item.dimensions.height }, testX, space.z, currentContainer.items)) {
                            const score = getPositionScore({ x: testX, y: space.y, z: space.z }, { l: orient.l, w: orient.w, h: item.dimensions.height }, currentContainer.items, containerDims);
                            if (score < minScore) {
                                minScore = score;
                                bestPlacement = { spaceIndex: s, rotation: orient.rot, x: testX, y: space.y, z: space.z, l: orient.l, w: orient.w };
                            }
                        }
                    }
                    if (bestPlacement && ox === 0) break;
                }
            }
        }
        if (bestPlacement && space.x > 1000 && minScore < 0) break;
      }

      if (bestPlacement) {
        currentContainer.items.push({ ...item, containerId: currentContainer.id, position: { x: bestPlacement.x, y: bestPlacement.y, z: bestPlacement.z }, rotation: bestPlacement.rotation });
        packedIndices.push(i);
        const newSpaces: Space[] = [];
        const usedL = bestPlacement.l + spacing;
        const usedW = bestPlacement.w + spacing;
        if (allowStacking && bestPlacement.y + item.dimensions.height + 100 <= containerDims.height) {
            newSpaces.push({ x: bestPlacement.x, y: bestPlacement.y + item.dimensions.height, z: bestPlacement.z, length: bestPlacement.l, width: bestPlacement.w, height: containerDims.height - (bestPlacement.y + item.dimensions.height) });
        }
        newSpaces.push({ x: bestPlacement.x + usedL, y: bestPlacement.y, z: bestPlacement.z, length: containerDims.length - (bestPlacement.x + usedL), width: containerDims.width - bestPlacement.z, height: containerDims.height - bestPlacement.y });
        newSpaces.push({ x: bestPlacement.x, y: bestPlacement.y, z: bestPlacement.z + usedW, length: containerDims.length - bestPlacement.x, width: containerDims.width - (bestPlacement.z + usedW), height: containerDims.height - bestPlacement.y });
        spaces.splice(bestPlacement.spaceIndex, 1);
        spaces.push(...newSpaces);
      }
    }
    packedIndices.sort((a, b) => b - a).forEach(idx => remainingItems.splice(idx, 1));
    containers.push(currentContainer);
  }
  return containers;
};
