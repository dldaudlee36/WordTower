export type WordDatabase = Record<number, string[]>;

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
   * 4x5(20칸) 격자에 정확히 일치하는 고난도 6단어 세트 추출
   * 슬롯: 4음절 2개 + 3음절 4개 = 정확히 6단어, 20글자 완벽 일치
   */
  public pickStageWordsFor20Cells(): string[] {
    if (!this.db) {
      throw new Error('단어 DB가 초기화되지 않았습니다.');
    }

    const words4Pool = this.db[4] || [];
    const words3Pool = this.db[3] || [];

    const chosen = new Set<string>();

    // 4음절 단어 2개 추출
    while (chosen.size < 2) {
      const w = words4Pool[Math.floor(Math.random() * words4Pool.length)];
      chosen.add(w);
    }

    // 3음절 단어 4개 추출
    while (chosen.size < 6) {
      const w = words3Pool[Math.floor(Math.random() * words3Pool.length)];
      chosen.add(w);
    }

    return Array.from(chosen);
  }
}

export const wordService = new WordService();