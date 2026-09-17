export type WordDatabase = Record<number, string[]>;

class WordService {
  private db: WordDatabase | null = null;

  // DB 로드 (최초 1회만 fetch 수행)
  public async loadDatabase(): Promise<WordDatabase> {
    if (this.db) return this.db;

    const response = await fetch('/data/words.json');
    if (!response.ok) {
      throw new Error('단어 DB 파일을 불러오지 못했습니다.');
    }
    this.db = await response.json();
    return this.db!;
  }

  // 중복 없는 단어 추출
  public pickRandomWords(targetTotalLength: number): string[] {
    if (!this.db) {
      throw new Error('단어 DB가 아직 초기화되지 않았습니다.');
    }

    const chosen = new Set<string>();
    let currentTotal = 0;
    let attempts = 0;

    while (currentTotal < targetTotalLength && attempts < 300) {
      attempts++;
      const remain = targetTotalLength - currentTotal;
      if (remain === 1) {
        return this.pickRandomWords(targetTotalLength);
      }

      const validLengths = [2, 3, 4].filter((len) => len <= remain && remain - len !== 1);
      if (validLengths.length === 0) {
        return this.pickRandomWords(targetTotalLength);
      }

      const selectedLen = validLengths[Math.floor(Math.random() * validLengths.length)];
      const pool = (this.db[selectedLen] || []).filter((w) => !chosen.has(w));

      if (pool.length === 0) {
        return this.pickRandomWords(targetTotalLength);
      }

      const word = pool[Math.floor(Math.random() * pool.length)];
      chosen.add(word);
      currentTotal += word.length;
    }

    if (currentTotal !== targetTotalLength) {
      return this.pickRandomWords(targetTotalLength);
    }

    return Array.from(chosen);
  }
}

export const wordService = new WordService();