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

    const raw4 = this.db['4'] || this.db[4] || [];
    const raw3 = this.db['3'] || this.db[3] || [];

    const words4 = raw4
      .map((w) => w.trim())
      .filter((w) => w.length === 4 && /^[가-힣]+$/.test(w))
      .sort();

    const words3 = raw3
      .map((w) => w.trim())
      .filter((w) => w.length === 3 && /^[가-힣]+$/.test(w))
      .sort();

    if (words4.length < 2 || words3.length < 4) {
      throw new Error(`단어 풀 부족 (4음절: ${words4.length}개, 3음절: ${words3.length}개)`);
    }

    const chosen: string[] = [];

    const pool4 = [...words4];
    for (let i = 0; i < 2; i++) {
      const idx = Math.floor(prng() * pool4.length);
      chosen.push(pool4.splice(idx, 1)[0]);
    }

    const pool3 = [...words3];
    for (let i = 0; i < 4; i++) {
      const idx = Math.floor(prng() * pool3.length);
      chosen.push(pool3.splice(idx, 1)[0]);
    }

    return chosen;
  }
}

export const wordService = new WordService();
