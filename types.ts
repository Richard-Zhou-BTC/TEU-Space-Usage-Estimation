export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export interface CargoItem {
  id: number;
  dimensions: Dimensions;
  weight: number;
  color?: string;
}

export interface PlacedItem extends CargoItem {
  position: { x: number; y: number; z: number }; // coordinate of the bottom-left-front corner
  rotation: boolean; // true if rotated 90 degrees around Y axis (swapping L and W)
  containerId: number;
}

export interface SafetyMetrics {
  score: number; // 0 - 10
  supportRatio: number; // 0 - 1 (Average percentage of bottom area supported)
  centerOfMass: { x: number, y: number, z: number };
  description: string;
}

export interface Container {
  id: number;
  items: PlacedItem[];
  width: number;
  height: number;
  length: number;
  safetyMetrics?: SafetyMetrics;
}

export interface Space {
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  height: number;
}