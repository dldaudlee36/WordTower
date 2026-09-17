import type { StageData } from '../types/game';

export const STAGES: StageData[] = [
  // [스테이지 1: 3x3 = 9글자 완벽 매칭] 바나나(3), 호랑이(3), 우주선(3)
  {
    rows: 3,
    cols: 3,
    targetWords: ['우주선', '바나나', '호랑이'],
    grid: [
      [
        { id: '1-1', char: '우', wordId: 0, row: 0, col: 0 },
        { id: '1-2', char: '바', wordId: 1, row: 0, col: 1 },
        { id: '1-3', char: '나', wordId: 1, row: 0, col: 2 },
      ],
      [
        { id: '1-4', char: '주', wordId: 0, row: 1, col: 0 },
        { id: '1-5', char: '호', wordId: 2, row: 1, col: 1 },
        { id: '1-6', char: '나', wordId: 1, row: 1, col: 2 },
      ],
      [
        { id: '1-7', char: '선', wordId: 0, row: 2, col: 0 },
        { id: '1-8', char: '랑', wordId: 2, row: 2, col: 1 },
        { id: '1-9', char: '이', wordId: 2, row: 2, col: 2 },
      ],
    ],
  },
  // [스테이지 2: 4x4 = 16글자 완벽 매칭] 사과(2), 구름(2), 바나나(3), 대한민국(4), 호랑이(3), 물개(2)
  {
    rows: 4,
    cols: 4,
    targetWords: ['사과', '구름', '바나나', '대한민국', '호랑이', '물개'],
    grid: [
      [
        { id: '2-1', char: '대', wordId: 3, row: 0, col: 0 },
        { id: '2-2', char: '한', wordId: 3, row: 0, col: 1 },
        { id: '2-3', char: '사', wordId: 0, row: 0, col: 2 },
        { id: '2-4', char: '과', wordId: 0, row: 0, col: 3 },
      ],
      [
        { id: '2-5', char: '민', wordId: 3, row: 1, col: 0 },
        { id: '2-6', char: '국', wordId: 3, row: 1, col: 1 },
        { id: '2-7', char: '바', wordId: 2, row: 1, col: 2 },
        { id: '2-8', char: '구', wordId: 1, row: 1, col: 3 },
      ],
      [
        { id: '2-9', char: '호', wordId: 4, row: 2, col: 0 },
        { id: '2-10', char: '나', wordId: 2, row: 2, col: 1 },
        { id: '2-11', char: '나', wordId: 2, row: 2, col: 2 },
        { id: '2-12', char: '름', wordId: 1, row: 2, col: 3 },
      ],
      [
        { id: '2-13', char: '랑', wordId: 4, row: 3, col: 0 },
        { id: '2-14', char: '이', wordId: 4, row: 3, col: 1 },
        { id: '2-15', char: '물', wordId: 5, row: 3, col: 2 },
        { id: '2-16', char: '개', wordId: 5, row: 3, col: 3 },
      ],
    ],
  },
  // [스테이지 3: 4x4 = 16글자 완벽 매칭] 자전거(3), 비행기(3), 도서관(3), 태극기(3), 선글라스(4)
  {
    rows: 4,
    cols: 4,
    targetWords: ['자전거', '비행기', '도서관', '태극기', '선글라스'],
    grid: [
      [
        { id: '3-1', char: '자', wordId: 0, row: 0, col: 0 },
        { id: '3-2', char: '전', wordId: 0, row: 0, col: 1 },
        { id: '3-3', char: '태', wordId: 3, row: 0, col: 2 },
        { id: '3-4', char: '극', wordId: 3, row: 0, col: 3 },
      ],
      [
        { id: '3-5', char: '거', wordId: 0, row: 1, col: 0 },
        { id: '3-6', char: '비', wordId: 1, row: 1, col: 1 },
        { id: '3-7', char: '도', wordId: 2, row: 1, col: 2 },
        { id: '3-8', char: '기', wordId: 3, row: 1, col: 3 },
      ],
      [
        { id: '3-9', char: '행', wordId: 1, row: 2, col: 0 },
        { id: '3-10', char: '기', wordId: 1, row: 2, col: 1 },
        { id: '3-11', char: '서', wordId: 2, row: 2, col: 2 },
        { id: '3-12', char: '선', wordId: 4, row: 2, col: 3 },
      ],
      [
        { id: '3-13', char: '관', wordId: 2, row: 3, col: 0 },
        { id: '3-14', char: '스', wordId: 4, row: 3, col: 1 },
        { id: '3-15', char: '라', wordId: 4, row: 3, col: 2 },
        { id: '3-16', char: '글', wordId: 4, row: 3, col: 3 },
      ],
    ],
  },
];