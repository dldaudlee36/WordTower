export interface TileData {
  id: string;
  char: string;
  wordId: number;
  row: number;
  col: number;
}

// 이 GridData export가 누락되어 에러가 났던 것입니다.
export type GridData = (TileData | null)[][];

export interface StageData {
  rows: number;
  cols: number;
  grid: GridData;
  targetWords: string[];
}