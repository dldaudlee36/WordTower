import { useState, useEffect, useMemo } from 'react';
import { WordTowerBoard } from './components/WordTowerBoard';
import { LevelGenerator } from './engine/LevelGenerator';
import { wordService } from './services/wordService';
import type { StageData } from './types/game';

export default function App() {
  // [1] 모든 State 및 Hook은 반드시 컴포넌트 최상단에 일괄 선언
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [stageHistory, setStageHistory] = useState<StageData[]>([]);
  const [isStageCleared, setIsStageCleared] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 로컬스토리지 연동 최고 해금 스테이지 (단 1번만 최상단에 선언)
  const [maxUnlockedStage, setMaxUnlockedStage] = useState<number>(() => {
    const saved = localStorage.getItem('wt_max_stage');
    return saved ? parseInt(saved, 10) : 1;
  });

  const generator = useMemo(() => new LevelGenerator(), []);

  // [2] Effect 훅
  useEffect(() => {
    wordService.loadDatabase()
      .then(() => setIsDbLoaded(true))
      .catch((err) => console.error('단어 DB 로드 실패:', err));
  }, []);

  // [3] Memo 훅: 현재 스테이지 연산
  const currentStage: StageData | null = useMemo(() => {
    if (!isDbLoaded) return null;

    if (stageHistory[currentStageIdx]) {
      return stageHistory[currentStageIdx];
    }

    const stageNum = currentStageIdx + 1;
    const isSmall = stageNum <= 3;
    const rows = isSmall ? 3 : 4;
    const cols = isSmall ? 3 : 4;
    const newStage = generator.createStage(rows, cols);

    setStageHistory((prev) => {
      const next = [...prev];
      next[currentStageIdx] = newStage;
      return next;
    });

    return newStage;
  }, [isDbLoaded, currentStageIdx, gameKey, generator, stageHistory]);

  // [4] 핸들러 함수들
  const handleStageClear = () => {
    setIsStageCleared(true);
    const nextStage = currentStageIdx + 2;
    if (nextStage > maxUnlockedStage) {
      setMaxUnlockedStage(nextStage);
      localStorage.setItem('wt_max_stage', nextStage.toString());
    }
  };

  const handleNextStage = () => {
    setCurrentStageIdx((prev) => prev + 1);
    setIsStageCleared(false);
    setGameKey((prev) => prev + 1);
  };

  const handleSelectStage = (index: number) => {
    setCurrentStageIdx(index);
    setIsStageCleared(false);
    setIsMenuOpen(false);
    setGameKey((prev) => prev + 1);
  };

  const handleResetStage = () => {
    const stageNum = currentStageIdx + 1;
    const isSmall = stageNum <= 3;
    const newStage = generator.createStage(isSmall ? 3 : 4, isSmall ? 3 : 4);
    
    setStageHistory((prev) => {
      const next = [...prev];
      next[currentStageIdx] = newStage;
      return next;
    });
    setGameKey((prev) => prev + 1);
  };

  // [5] 훅 선언이 모두 끝난 후 조기 반환(Early Return) 처리
  if (!isDbLoaded || !currentStage) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#60a5fa', fontSize: '16px', fontWeight: 800 }}>단어 DB 불러오는 중...</div>
      </main>
    );
  }

  // [6] 메인 렌더링
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* 폴백 메뉴 모달 */}
      {isMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 70,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #3b82f6',
              borderRadius: '20px',
              padding: '24px',
              width: '90%',
              maxWidth: '340px',
              textAlign: 'center',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#60a5fa', margin: '0 0 16px 0' }}>
              스테이지 목록
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                maxHeight: '260px',
                overflowY: 'auto',
                marginBottom: '20px',
                padding: '4px',
              }}
            >
              {Array.from({ length: maxUnlockedStage }).map((_, idx) => {
                const isCurrent = idx === currentStageIdx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectStage(idx)}
                    style={{
                      padding: '12px 0',
                      borderRadius: '10px',
                      border: isCurrent ? '2px solid #3b82f6' : '1px solid #334155',
                      background: isCurrent ? '#2563eb' : '#1e293b',
                      color: isCurrent ? '#fff' : '#94a3b8',
                      fontWeight: 800,
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#334155',
                color: '#fff',
                fontWeight: 700,
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 클리어 팝업 */}
      {isStageCleared && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #3b82f6',
              borderRadius: '20px',
              padding: '32px 28px',
              textAlign: 'center',
              maxWidth: '320px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.25)',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎉</div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#60a5fa', margin: '0 0 6px 0' }}>
              STAGE CLEAR!
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 24px 0' }}>
              스테이지 {currentStageIdx + 1} 완료!
            </p>

            <button
              onClick={handleNextStage}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2563eb',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              다음 스테이지로 →
            </button>
          </div>
        </div>
      )}

      {/* 게임 보드 마운트 */}
      <WordTowerBoard
        key={gameKey}
        stage={currentStage}
        stageNumber={currentStageIdx + 1}
        onClear={handleStageClear}
        onReset={handleResetStage}
        onOpenMenu={() => setIsMenuOpen(true)}
      />
    </main>
  );
}
