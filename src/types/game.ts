export interface TileData {
  id: string;
  char: string;
  word: string;
  wordIndex: number;
  charIndex: number;
  row: number;
  col: number;
}

export type GridData = TileData[][];

export interface StageData {
  rows: number;
  cols: number;
  targetWords: string[];
  grid: GridData;
}
