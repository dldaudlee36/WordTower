export type WordDatabase = Record<string | number, string[]>;

export function createSeededRandom(seed: number) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 합이 정확히 20이 되는 패턴 목록
const PATTERNS: number[][] = [
  [4, 4, 3, 3, 3, 3],       // 6단어 (합 20)
  [5, 4, 3, 3, 3, 2],       // 6단어 (합 20)
  [5, 5, 4, 3, 3],          // 5단어 (합 20)
  [4, 4, 4, 3, 3, 2],       // 6단어 (합 20)
  [5, 3, 3, 3, 2, 2, 2],    // 7단어 (합 20)
  [4, 4, 3, 3, 2, 2, 2],    // 7단어 (합 20)
  [5, 5, 3, 3, 2, 2],       // 6단어 (합 20)
  [3, 3, 3, 3, 2, 2, 2, 2], // 8단어 (합 20)
  [5, 4, 4, 3, 2, 2],       // 6단어 (합 20)
  [5, 5, 2, 2, 2, 2, 2],    // 7단어 (합 20)
];

class WordService {
  private db: WordDatabase | null = null;

  public async loadDatabase(): Promise<WordDatabase> {
    if (this.db) return this.db;
    const response = await fetch('/data/words.json');
    if (!response.ok) {
      throw new Error('단어 DB 파일을 불러오지 못했습니다.');
    }
    this.db = (await response.json()) as WordDatabase;
    return this.db;
  }

  public getStageWordsForSeed(stageNumber: number): string[] {
    if (!this.db) throw new Error('단어 DB가 로드되지 않았습니다.');

    const prng = createSeededRandom(stageNumber * 997 + 13);

    // 패턴 선택
    const patternIndex = Math.floor(prng() * PATTERNS.length);
    const pattern = PATTERNS[patternIndex];

    // 스테이지별 독립 풀 복사 (깊은 복사)
    const availablePools: Record<number, string[]> = {
      2: [...(this.db['2'] || [])],
      3: [...(this.db['3'] || [])],
      4: [...(this.db['4'] || [])],
      5: [...(this.db['5'] || [])],
    };

    const chosenWords: string[] = [];
    const usedWordSet = new Set<string>();

    for (const len of pattern) {
      const pool = availablePools[len];
      if (!pool || pool.length === 0) {
        throw new Error(`${len}음절 단어 풀이 고갈되었습니다.`);
      }

      let selectedWord: string | null = null;
      let attempts = 0;

      // 중복되지 않은 단어가 나올 때까지 비복원 추출
      while (pool.length > 0 && attempts < 100) {
        attempts++;
        const pickIdx = Math.floor(prng() * pool.length);
        const candidate = pool.splice(pickIdx, 1)[0]; // 뽑은 즉시 풀에서 제거

        if (!usedWordSet.has(candidate)) {
          selectedWord = candidate;
          usedWordSet.add(candidate);
          break;
        }
      }

      if (!selectedWord) {
        throw new Error(`스테이지 ${stageNumber}: 중복 없는 ${len}음절 단어 추출 실패`);
      }

      chosenWords.push(selectedWord);
    }

    return chosenWords;
  }
}

export const wordService = new WordService();
