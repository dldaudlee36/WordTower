export interface TileData {
  id: string;
  char: string;
  word: string;     // 해당 타일이 속한 정확한 단어 문자열
  wordIndex: number;// 0 ~ 5
  charIndex: number;// 단어 내 글자 순서 (0, 1, 2...)
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
