import type { StageData, GridData, TileData } from '../types/game';
import { wordService, createSeededRandom } from '../services/wordService';

export class LevelGenerator {
  public createDeterminedStage(stageNumber: number, rows = 5, cols = 4): StageData {
    const words = wordService.getStageWordsForSeed(stageNumber);
    const prng = createSeededRandom(stageNumber * 1009 + 37);

    const grid: (TileData | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

    const success = this.fastGenerate(grid, rows, cols, words, prng);
    if (!success) {
      this.fallbackGenerate(grid, rows, cols, words);
    }

    return {
      rows,
      cols,
      targetWords: words,
      grid: grid as GridData,
    };
  }

  private fastGenerate(
    grid: (TileData | null)[][],
    rows: number,
    cols: number,
    words: string[],
    prng: () => number
  ): boolean {
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ];

    for (let attempt = 0; attempt < 30; attempt++) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          grid[r][c] = null;
        }
      }

      let failed = false;

      for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
        const word = words[wordIdx];
        const emptyCells: [number, number][] = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (grid[r][c] === null) emptyCells.push([r, c]);
          }
        }

        this.shuffleWithSeed(emptyCells, prng);
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
            this.shuffleWithSeed(neighbors, prng);

            for (const [nr, nc] of neighbors) {
              path.push([nr, nc]);
              if (dfs(charIdx + 1)) return true;
              path.pop();
            }
            return false;
          };

          if (dfs(1)) {
            path.forEach(([r, c], idx) => {
              grid[r][c] = {
                // ID에 단어 원본을 직접 각인하여 오인식 방지
                id: `tile_${r}_${c}_${word}_${idx}`,
                char: word[idx],
                wordId: wordIdx,
                row: r,
                col: c,
              };
            });
            placed = true;
            break;
          }
        }

        if (!placed) {
          failed = true;
          break;
        }
      }

      if (!failed) return true;
    }

    return false;
  }

  private fallbackGenerate(
    grid: (TileData | null)[][],
    rows: number,
    cols: number,
    words: string[]
  ) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        grid[r][c] = null;
      }
    }

    const snakePath: [number, number][] = [];
    for (let r = 0; r < rows; r++) {
      const rowCells: [number, number][] = [];
      for (let c = 0; c < cols; c++) {
        rowCells.push([r, c]);
      }
      if (r % 2 === 1) rowCells.reverse();
      snakePath.push(...rowCells);
    }

    let cellIndex = 0;
    const maxCells = rows * cols;

    for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
      const word = words[wordIdx];
      for (let i = 0; i < word.length; i++) {
        if (cellIndex >= maxCells || !snakePath[cellIndex]) return;
        const [r, c] = snakePath[cellIndex];
        grid[r][c] = {
          id: `tile_${r}_${c}_${word}_${i}`,
          char: word[i],
          wordId: wordIdx,
          row: r,
          col: c,
        };
        cellIndex++;
      }
    }
  }

  private shuffleWithSeed<T>(array: T[], prng: () => number) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
