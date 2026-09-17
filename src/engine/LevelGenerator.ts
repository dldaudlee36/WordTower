import type { StageData, GridData, TileData } from '../types/game';
import { wordService, createSeededRandom } from '../services/wordService';

export class LevelGenerator {
  public createDeterminedStage(stageNumber: number, rows = 5, cols = 4): StageData {
    const words = wordService.getStageWordsForSeed(stageNumber);

    for (let attempt = 0; attempt < 50; attempt++) {
      const prng = createSeededRandom(stageNumber * 1009 + 37 + attempt * 23);
      const grid = this.tryGenerate(rows, cols, words, prng);
      if (grid) {
        return {
          rows,
          cols,
          targetWords: words,
          grid,
        };
      }
    }

    const fallbackGrid = this.guaranteedSnakeGenerate(rows, cols, words);
    return {
      rows,
      cols,
      targetWords: words,
      grid: fallbackGrid,
    };
  }

  private tryGenerate(
    rows: number,
    cols: number,
    words: string[],
    prng: () => number
  ): GridData | null {
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ];

    const grid: (TileData | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

    for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
      const word = words[wordIdx];
      const emptyCells: [number, number][] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] === null) emptyCells.push([r, c]);
        }
      }

      this.shuffle(emptyCells, prng);
      let placed = false;

      for (const [startR, startC] of emptyCells) {
        const path: [number, number][] = [[startR, startC]];

        const dfs = (charIdx: number): boolean => {
          if (charIdx >= word.length) return true;
          const [pr, pc] = path[path.length - 1];

          const neighbors: [number, number][] = [];
          for (const [dr, dc] of directions) {
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
          this.shuffle(neighbors, prng);

          for (const [nr, nc] of neighbors) {
            path.push([nr, nc]);
            if (dfs(charIdx + 1)) return true;
            path.pop();
          }
          return false;
        };

        if (dfs(1)) {
          path.forEach(([r, c], charIdx) => {
            grid[r][c] = {
              id: `cell_${r}_${c}`,
              char: word[charIdx],
              word,
              wordIndex: wordIdx,
              charIndex: charIdx,
              row: r,
              col: c,
            };
          });
          placed = true;
          break;
        }
      }

      if (!placed) return null;
    }

    return grid as GridData;
  }

  private guaranteedSnakeGenerate(rows: number, cols: number, words: string[]): GridData {
    const grid: (TileData | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
    const continuousPath: [number, number][] = [];

    for (let r = 0; r < rows; r++) {
      if (r % 2 === 0) {
        for (let c = 0; c < cols; c++) continuousPath.push([r, c]);
      } else {
        for (let c = cols - 1; c >= 0; c--) continuousPath.push([r, c]);
      }
    }

    let pathIdx = 0;
    words.forEach((word, wordIdx) => {
      for (let charIdx = 0; charIdx < word.length; charIdx++) {
        const [r, c] = continuousPath[pathIdx++];
        grid[r][c] = {
          id: `cell_${r}_${c}`,
          char: word[charIdx],
          word,
          wordIndex: wordIdx,
          charIndex: charIdx,
          row: r,
          col: c,
        };
      }
    });

    return grid as GridData;
  }

  private shuffle<T>(arr: T[], prng: () => number) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}
