import { useState, useEffect, useMemo } from 'react';
import { WordTowerBoard } from './components/WordTowerBoard';
import { LevelGenerator } from './engine/LevelGenerator';
import { wordService } from './services/wordService';
import type { StageData } from './types/game';

const TOTAL_CHAPTERS = 40;
const STAGES_PER_CHAPTER = 20;
const TOTAL_STAGES = TOTAL_CHAPTERS * STAGES_PER_CHAPTER; // 800

export default function App() {
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [currentGlobalStage, setCurrentGlobalStage] = useState(1); // 1 ~ 800
  const [stageHistory, setStageHistory] = useState<Record<number, StageData>>({});
  const [isStageCleared, setIsStageCleared] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  
  // 메뉴 네비게이션 상태
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedChapterTab, setSelectedChapterTab] = useState(1);

  // 최고 해금 스테이지 (로컬스토리지 연동)
  const [maxUnlockedStage, setMaxUnlockedStage] = useState<number>(() => {
    const saved = localStorage.getItem('wt_max_stage_v2');
    return saved ? parseInt(saved, 10) : 1;
  });

  const generator = useMemo(() => new LevelGenerator(), []);

  useEffect(() => {
    wordService.loadDatabase()
      .then(() => setIsDbLoaded(true))
      .catch((err) => console.error('단어 DB 로드 실패:', err));
  }, []);

  // 현재 스테이지 생성 (5행 4열, 20칸, 정확히 6단어)
  const currentStage: StageData | null = useMemo(() => {
    if (!isDbLoaded) return null;

    if (stageHistory[currentGlobalStage]) {
      return stageHistory[currentGlobalStage];
    }

    const newStage = generator.createStage(5, 4);

    setStageHistory((prev) => ({
      ...prev,
      [currentGlobalStage]: newStage,
    }));

    return newStage;
  }, [isDbLoaded, currentGlobalStage, gameKey, generator, stageHistory]);

  const currentChapter = Math.ceil(currentGlobalStage / STAGES_PER_CHAPTER);
  const stageInChapter = ((currentGlobalStage - 1) % STAGES_PER_CHAPTER) + 1;

  const handleStageClear = () => {
    setIsStageCleared(true);
    const nextStage = currentGlobalStage + 1;
    if (nextStage > maxUnlockedStage && nextStage <= TOTAL_STAGES) {
      setMaxUnlockedStage(nextStage);
      localStorage.setItem('wt_max_stage_v2', nextStage.toString());
    }
  };

  const handleNextStage = () => {
    if (currentGlobalStage < TOTAL_STAGES) {
      setCurrentGlobalStage((prev) => prev + 1);
      setIsStageCleared(false);
      setGameKey((prev) => prev + 1);
    }
  };

  const handleSelectStage = (globalStageNum: number) => {
    setCurrentGlobalStage(globalStageNum);
    setIsStageCleared(false);
    setIsMenuOpen(false);
    setGameKey((prev) => prev + 1);
  };

  const handleResetStage = () => {
    const newStage = generator.createStage(5, 4);
    setStageHistory((prev) => ({
      ...prev,
      [currentGlobalStage]: newStage,
    }));
    setGameKey((prev) => prev + 1);
  };

  if (!isDbLoaded || !currentStage) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#60a5fa', fontSize: '16px', fontWeight: 800 }}>단어 DB 불러오는 중...</div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* 40챕터 x 20스테이지 폴백 네비게이터 모달 */}
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
              padding: '20px',
              width: '92%',
              maxWidth: '380px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#60a5fa', margin: 0 }}>
                챕터 & 스테이지 선택
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                해금: {maxUnlockedStage} / 800
              </span>
            </div>

            {/* 챕터 탭 슬라이더 (1~40) */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '8px',
                marginBottom: '12px',
              }}
            >
              {Array.from({ length: TOTAL_CHAPTERS }).map((_, idx) => {
                const chap = idx + 1;
                const isSelected = chap === selectedChapterTab;
                return (
                  <button
                    key={chap}
                    onClick={() => setSelectedChapterTab(chap)}
                    style={{
                      flexShrink: 0,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid #3b82f6' : '1px solid #334155',
                      background: isSelected ? '#2563eb' : '#1e293b',
                      color: isSelected ? '#fff' : '#94a3b8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Ch.{chap}
                  </button>
                );
              })}
            </div>

            {/* 선택된 챕터 내 20개 스테이지 그리드 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              {Array.from({ length: STAGES_PER_CHAPTER }).map((_, idx) => {
                const stageNumInChap = idx + 1;
                const globalNum = (selectedChapterTab - 1) * STAGES_PER_CHAPTER + stageNumInChap;
                const isUnlocked = globalNum <= maxUnlockedStage;
                const isCurrent = globalNum === currentGlobalStage;

                return (
                  <button
                    key={globalNum}
                    disabled={!isUnlocked}
                    onClick={() => handleSelectStage(globalNum)}
                    style={{
                      padding: '10px 0',
                      borderRadius: '8px',
                      border: isCurrent ? '2px solid #60a5fa' : '1px solid #334155',
                      background: isCurrent ? '#2563eb' : isUnlocked ? '#1e293b' : '#090d16',
                      color: isCurrent ? '#fff' : isUnlocked ? '#e2e8f0' : '#475569',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: isUnlocked ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {isUnlocked ? stageNumInChap : '🔒'}
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
              챕터 {currentChapter} - 스테이지 {stageInChapter} 완료!
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

      {/* 게임 보드 */}
      <WordTowerBoard
        key={gameKey}
        stage={currentStage}
        stageNumber={stageInChapter}
        chapterNumber={currentChapter}
        onClear={handleStageClear}
        onReset={handleResetStage}
        onOpenMenu={() => {
          setSelectedChapterTab(currentChapter);
          setIsMenuOpen(true);
        }}
      />
    </main>
  );
}