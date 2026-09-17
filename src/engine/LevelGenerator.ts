import type { StageData, GridData, TileData } from '../types/game';
import { wordService, createSeededRandom } from '../services/wordService';

export class LevelGenerator {
  private readonly directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1]
  ];

  public createDeterminedStage(stageNumber: number, rows = 5, cols = 4): StageData {
    const words = wordService.getStageWordsForSeed(stageNumber);
    const prng = createSeededRandom(stageNumber * 1009 + 37);

    const grid = this.generateGridWithSeed(rows, cols, words, prng);
    if (!grid) {
      throw new Error(`스테이지 ${stageNumber} 배치 생성 실패`);
    }

    return {
      rows,
      cols,
      targetWords: words,
      grid
    };
  }

  private generateGridWithSeed(
    rows: number,
    cols: number,
    words: string[],
    prng: () => number
  ): GridData | null {
    const grid: (TileData | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

    const backtrack = (wordIdx: number): boolean => {
      if (wordIdx >= words.length) return true;
      const word = words[wordIdx];

      // 빈 칸 좌표 탐색
      const emptyCells: [number, number][] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] === null) emptyCells.push([r, c]);
        }
      }
      this.shuffleWithSeed(emptyCells, prng);

      for (const [sr, sc] of emptyCells) {
        const path: [number, number][] = [[sr, sc]];
        if (this.dfsPlaceLetters(grid, rows, cols, word, 1, path, wordIdx, prng)) {
          if (backtrack(wordIdx + 1)) return true;
          // 실패 시 롤백
          for (const [pr, pc] of path) grid[pr][pc] = null;
        }
      }
      return false;
    };

    return backtrack(0) ? grid : null;
  }

  private dfsPlaceLetters(
    grid: (TileData | null)[][],
    rows: number,
    cols: number,
    word: string,
    charIndex: number,
    path: [number, number][],
    wordId: number,
    prng: () => number
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

    const [pr, pc] = path[path.length - 1];
    const neighbors: [number, number][] = [];

    for (const [dr, dc] of this.directions) {
      const nr = pr + dr;
      const nc = pc + dc;
      if (
        nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
        grid[nr][nc] === null &&
        !path.some(([xr, xc]) => xr === nr && xc === nc)
      ) {
        neighbors.push([nr, nc]);
      }
    }

    this.shuffleWithSeed(neighbors, prng);

    for (const [nr, nc] of neighbors) {
      path.push([nr, nc]);
      if (this.dfsPlaceLetters(grid, rows, cols, word, charIndex + 1, path, wordId, prng)) {
        return true;
      }
      path.pop();
    }

    return false;
  }

  private shuffleWithSeed<T>(array: T[], prng: () => number) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
