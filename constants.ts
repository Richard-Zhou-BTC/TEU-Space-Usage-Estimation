import { CargoItem } from './types';

export const CONTAINER_DIMS = {
  length: 8200,
  width: 2300,
  height: 2300,
};

// Data transcribed from user provided image
export const CARGO_DATA: CargoItem[] = [
  { id: 1, dimensions: { length: 795, width: 770, height: 1685 }, weight: 84 },
  { id: 2, dimensions: { length: 800, width: 765, height: 1695 }, weight: 84.6 },
  { id: 3, dimensions: { length: 790, width: 755, height: 1685 }, weight: 85 },
  { id: 4, dimensions: { length: 1170, width: 950, height: 2035 }, weight: 257.6 },
  { id: 5, dimensions: { length: 1665, width: 1130, height: 765 }, weight: 183.2 },
  { id: 6, dimensions: { length: 1140, width: 930, height: 1600 }, weight: 207 },
  { id: 7, dimensions: { length: 1170, width: 950, height: 2030 }, weight: 258 },
  { id: 8, dimensions: { length: 1665, width: 1130, height: 765 }, weight: 182.6 },
  { id: 9, dimensions: { length: 1468, width: 755, height: 860 }, weight: 72.8 },
  { id: 10, dimensions: { length: 1945, width: 675, height: 930 }, weight: 121 },
  { id: 11, dimensions: { length: 1090, width: 1040, height: 990 }, weight: 142.6 },
  { id: 12, dimensions: { length: 2200, width: 760, height: 855 }, weight: 102.4 },
  { id: 13, dimensions: { length: 2200, width: 760, height: 855 }, weight: 102.4 },
  { id: 14, dimensions: { length: 1280, width: 910, height: 1070 }, weight: 140.2 },
  { id: 15, dimensions: { length: 1760, width: 790, height: 850 }, weight: 268 },
  { id: 16, dimensions: { length: 1990, width: 910, height: 1070 }, weight: 199.4 },
  { id: 17, dimensions: { length: 2085, width: 940, height: 820 }, weight: 480.6 },
  { id: 18, dimensions: { length: 1495, width: 1190, height: 900 }, weight: 454 },
  { id: 19, dimensions: { length: 1920, width: 630, height: 850 }, weight: 307 },
  { id: 20, dimensions: { length: 1660, width: 1130, height: 770 }, weight: 182 },
  { id: 21, dimensions: { length: 1965, width: 610, height: 955 }, weight: 72.6 },
  { id: 22, dimensions: { length: 485, width: 220, height: 1510 }, weight: 82 },
  { id: 23, dimensions: { length: 1000, width: 610, height: 2030 }, weight: 92.4 },
  { id: 24, dimensions: { length: 1105, width: 660, height: 1740 }, weight: 187.4 },
  { id: 25, dimensions: { length: 850, width: 785, height: 1465 }, weight: 149.4 },
  { id: 26, dimensions: { length: 1070, width: 970, height: 1580 }, weight: 203 },
  { id: 27, dimensions: { length: 1115, width: 660, height: 2060 }, weight: 315.4 },
  { id: 28, dimensions: { length: 850, width: 725, height: 1610 }, weight: 182 },
  { id: 29, dimensions: { length: 1030, width: 1015, height: 2090 }, weight: 682 },
].map(item => ({
    ...item,
    // Assign a consistent deterministic color based on ID for visualization
    color: `hsl(${(item.id * 137.508) % 360}, 65%, 55%)`
}));