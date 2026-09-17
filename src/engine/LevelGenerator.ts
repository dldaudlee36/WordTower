import type { StageData, GridData, TileData } from '../types/game';
import { wordService } from '../services/wordService';

export class LevelGenerator {
  private readonly directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1]
  ];

  public createStage(rows: number, cols: number, maxAttempts = 50): StageData {
    const totalCells = rows * cols;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const words = wordService.pickRandomWords(totalCells);
      const grid = this.tryGenerateGrid(rows, cols, words);
      if (grid) {
        return {
          rows,
          cols,
          targetWords: words,
          grid
        };
      }
    }

    throw new Error('레벨 생성 실패: 유효한 단어 배치를 찾지 못했습니다.');
  }

  // (이하 tryGenerateGrid, backtrackPlaceWords 등 기존 내부 로직 유지)
  private tryGenerateGrid(rows: number, cols: number, words: string[]): GridData | null {
    const grid: (TileData | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
    const reversedWords = [...words].reverse();
    const success = this.backtrackPlaceWords(grid, rows, cols, reversedWords, 0, words);
    return success ? grid : null;
  }

  private backtrackPlaceWords(
    grid: (TileData | null)[][],
    rows: number,
    cols: number,
    words: string[],
    wordIndex: number,
    originalWords: string[]
  ): boolean {
    if (wordIndex >= words.length) return true;

    const currentWord = words[wordIndex];
    const actualWordId = originalWords.indexOf(currentWord);

    const startPositions = this.getValidPlacements(grid, rows, cols);
    this.shuffle(startPositions);

    for (const [startR, startC] of startPositions) {
      const path: [number, number][] = [[startR, startC]];
      if (this.dfsPlaceLetters(grid, rows, cols, currentWord, 1, path, actualWordId)) {
        if (this.backtrackPlaceWords(grid, rows, cols, words, wordIndex + 1, originalWords)) {
          return true;
        }
        for (const [r, c] of path) {
          grid[r][c] = null;
        }
      }
    }

    return false;
  }

  private dfsPlaceLetters(
    grid: (TileData | null)[][],
    rows: number,
    cols: number,
    word: string,
    charIndex: number,
    path: [number, number][],
    wordId: number
  ): boolean {
    if (charIndex >= word.length) {
      path.forEach(([r, c], idx) => {
        grid[r][c] = {
          id: `tile_${r}_${c}_${wordId}_${idx}`,
          char: word[idx],
          wordId,
          row: r,
          col: c
        };
      });
      return true;
    }

    const [prevR, prevC] = path[path.length - 1];
    const neighbors: [number, number][] = [];

    for (const [dr, dc] of this.directions) {
      const nr = prevR + dr;
      const nc = prevC + dc;

      if (
        nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
        grid[nr][nc] === null &&
        !path.some(([pr, pc]) => pr === nr && pc === nc)
      ) {
        if (this.isPhysicallySupported(grid, rows, path, nr, nc)) {
          neighbors.push([nr, nc]);
        }
      }
    }

    this.shuffle(neighbors);

    for (const [nr, nc] of neighbors) {
      path.push([nr, nc]);
      if (this.dfsPlaceLetters(grid, rows, cols, word, charIndex + 1, path, wordId)) {
        return true;
      }
      path.pop();
    }

    return false;
  }

  private isPhysicallySupported(
    grid: (TileData | null)[][],
    rows: number,
    path: [number, number][],
    r: number,
    c: number
  ): boolean {
    if (r === rows - 1) return true;
    const isBelowOccupied = grid[r + 1][c] !== null;
    const isBelowInPath = path.some(([pr, pc]) => pr === r + 1 && pc === c);
    return isBelowOccupied || isBelowInPath;
  }

  private getValidPlacements(grid: (TileData | null)[][], rows: number, cols: number): [number, number][] {
    const list: [number, number][] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === null && this.isPhysicallySupported(grid, rows, [], r, c)) {
          list.push([r, c]);
        }
      }
    }
    return list;
  }

  private shuffle(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}