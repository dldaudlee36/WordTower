export type WordDatabase = Record<number, string[]>;

// 시드 기반 의사난수 생성기 (Mulberry32)
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

class WordService {
  private db: WordDatabase | null = null;

  public async loadDatabase(): Promise<WordDatabase> {
    if (this.db) return this.db;
    const response = await fetch('/data/words.json');
    if (!response.ok) {
      throw new Error('단어 DB 파일을 불러오지 못했습니다.');
    }
    this.db = await response.json();
    return this.db!;
  }

  /**
   * 특정 stageNumber를 시드로 사용하여 항상 일정한 6개 단어 추출 (4음절 2개 + 3음절 4개)
   */
  public getStageWordsForSeed(stageNumber: number): string[] {
    if (!this.db) throw new Error('단어 DB가 초기화되지 않았습니다.');

    const prng = createSeededRandom(stageNumber * 997 + 13);
    const words4 = [...(this.db[4] || [])].sort();
    const words3 = [...(this.db[3] || [])].sort();

    const chosen: string[] = [];

    // 4음절 단어 2개 결정론적 선택
    const pool4 = [...words4];
    for (let i = 0; i < 2; i++) {
      const idx = Math.floor(prng() * pool4.length);
      chosen.push(pool4.splice(idx, 1)[0]);
    }

    // 3음절 단어 4개 결정론적 선택
    const pool3 = [...words3];
    for (let i = 0; i < 4; i++) {
      const idx = Math.floor(prng() * pool3.length);
      chosen.push(pool3.splice(idx, 1)[0]);
    }

    return chosen;
  }
}

export const wordService = new WordService();
