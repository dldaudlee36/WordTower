import React, { useEffect, useRef, useState } from 'react';
import { PixiWordEngine } from '../engine/PixiWordEngine';
import type { StageData } from '../types/game';

interface Props {
  stage: StageData;
  stageNumber: number;
  chapterNumber?: number;
  globalStageNumber: number;
  onClear: () => void;
  onReset: () => void;
  onOpenMenu: () => void;
}

export const WordTowerBoard: React.FC<Props> = ({
  stage,
  stageNumber,
  chapterNumber = 1,
  globalStageNumber,
  onClear,
  onReset,
  onOpenMenu,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PixiWordEngine | null>(null);

  const storageKey = `wt_cleared_words_v10_stage_${globalStageNumber}`;
  
  const [clearedWords, setClearedWords] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const clearedWordsRef = useRef<string[]>(clearedWords);
  useEffect(() => {
    clearedWordsRef.current = clearedWords;
  }, [clearedWords]);

  const [revealedCountMap, setRevealedCountMap] = useState<Record<string, number>>({});
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [hintPassword, setHintPassword] = useState('');
  const [hintError, setHintError] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      setClearedWords(parsed);
      clearedWordsRef.current = parsed;
    } catch {
      setClearedWords([]);
      clearedWordsRef.current = [];
    }
    setRevealedCountMap({});
  }, [globalStageNumber, storageKey]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const engine = new PixiWordEngine({
      container: containerRef.current,
      rows: stage.rows,
      cols: stage.cols,
      onWordSubmit: (selectedChars) => {
        const word = selectedChars.join('');
        const currentCleared = clearedWordsRef.current;

        if (stage.targetWords.includes(word) && !currentCleared.includes(word)) {
          const next = [...currentCleared, word];
          clearedWordsRef.current = next;
          setClearedWords(next);
          localStorage.setItem(storageKey, JSON.stringify(next));

          if (next.length >= stage.targetWords.length) {
            setTimeout(onClear, 400);
          }
          return true;
        }
        return false;
      },
      onInvalidSubmit: () => {
        showToast('일치하는 단어가 없습니다. 천천히 다시 연결해 보세요! 😊');
      },
    });

    const clonedGrid = JSON.parse(JSON.stringify(stage.grid));
    engine.init(clonedGrid, clearedWordsRef.current);
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [stage, globalStageNumber]);

const handleApplyHint = () => {
    if (hintPassword.trim() === '대전a반최고') {
      const remainingWords = stage.targetWords.filter((w) => !clearedWordsRef.current.includes(w));
      
      // 아직 모든 글자가 다 공개되지 않은 단어만 선별
      const eligibleWord = remainingWords.find(
        (w) => (revealedCountMap[w] || 0) < w.length
      );

      if (eligibleWord && engineRef.current) {
        const currentRevealed = revealedCountMap[eligibleWord] || 0;
        
        // 글자 수 내에서만 안전하게 힌트 표시
        if (currentRevealed < eligibleWord.length) {
          const nextRevealed = currentRevealed + 1;
          setRevealedCountMap((prev) => ({
            ...prev,
            [eligibleWord]: nextRevealed,
          }));

          engineRef.current.showHintForWord(eligibleWord, currentRevealed);
        }
      } else {
        showToast('더 이상 표시할 힌트가 없습니다!');
      }

      setIsHintModalOpen(false);
      setHintPassword('');
      setHintError(false);
    } else {
      setHintError(true);
    }
  };

  const handleResetCurrentStage = () => {
    localStorage.removeItem(storageKey);
    setClearedWords([]);
    clearedWordsRef.current = [];
    setRevealedCountMap({});
    onReset();
  };

  const remainingCount = Math.max(0, stage.targetWords.length - new Set(clearedWords).size);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative' }}>
      
      {toastMessage && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            background: '#1e293b',
            border: '1px solid #38bdf8',
            color: '#f8fafc',
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            zIndex: 100,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* 헤더 */}
      <div style={{ width: '100%', maxWidth: '360px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <button
              onClick={onOpenMenu}
              title="스테이지 선택"
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              CH.{chapterNumber} - STAGE {stageNumber} ☰
            </button>
            <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#60a5fa', margin: 0, whiteSpace: 'nowrap' }}>
              워드타워
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={() => setIsHelpModalOpen(true)}
              title="게임 설명서"
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#1e293b',
                border: '1px solid #38bdf8',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              ❓
            </button>

            <button
              onClick={() => {
                setIsHintModalOpen(true);
                setHintError(false);
              }}
              title="힌트 받기"
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#1e293b',
                border: '1px solid #eab308',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              💡
            </button>

            <button
              onClick={handleResetCurrentStage}
              title="다시 하기"
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#94a3b8',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              ↺
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, whiteSpace: 'nowrap' }}>
            숨겨진 6개 단어를 드래그해 완성하세요
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#1e293b',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              padding: '2px 8px',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>남은 단어</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#60a5fa' }}>{remainingCount}</span>
          </div>
        </div>

        {/* 힌트 슬롯 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            background: '#0f172a',
            padding: '8px',
            borderRadius: '10px',
            border: '1px solid #1e293b',
          }}
        >
          {stage.targetWords.map((word, idx) => {
            const isCleared = clearedWords.includes(word);
            const revealedCount = revealedCountMap[word] || 0;
            const visiblePart = word.slice(0, revealedCount);
            const hiddenPart = '●'.repeat(Math.max(0, word.length - revealedCount));

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '28px',
                  borderRadius: '6px',
                  background: isCleared
                    ? 'rgba(37, 99, 235, 0.25)'
                    : revealedCount > 0
                    ? 'rgba(234, 179, 8, 0.15)'
                    : '#1e293b',
                  border: isCleared
                    ? '1px solid #3b82f6'
                    : revealedCount > 0
                    ? '1px solid #eab308'
                    : '1px dashed #475569',
                  transition: 'all 0.25s ease',
                }}
              >
                {isCleared ? (
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.5px' }}>
                    {word}
                  </span>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                    {visiblePart && (
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#facc15', letterSpacing: '0.5px' }}>
                        {visiblePart}
                      </span>
                    )}
                    {hiddenPart && (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', letterSpacing: '1.5px', marginLeft: visiblePart ? '2px' : '0' }}>
                        {hiddenPart}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          width: '360px',
          height: '430px',
          backgroundColor: '#070b14',
          borderRadius: '16px',
          border: '1px solid #334155',
          overflow: 'hidden',
          touchAction: 'none',
        }}
      />

      {/* 게임 설명서 모달 */}
      {isHelpModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 80,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #38bdf8',
              borderRadius: '20px',
              padding: '24px 20px',
              width: '90%',
              maxWidth: '340px',
              boxShadow: '0 25px 50px -12px rgba(56, 189, 248, 0.25)',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '24px' }}>📜</span>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#38bdf8', margin: 0 }}>
                워드타워 게임 설명서
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
              <div style={{ background: '#1e293b', padding: '10px 12px', borderRadius: '10px', borderLeft: '3px solid #38bdf8' }}>
                <strong style={{ color: '#f8fafc' }}>1. 공통 고정 스테이지</strong>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8' }}>
                  모든 플레이어는 스테이지 번호마다 <strong>동일한 6개의 단어와 동일한 격자 배치</strong>를 공유합니다.
                </p>
              </div>

              <div style={{ background: '#1e293b', padding: '10px 12px', borderRadius: '10px', borderLeft: '3px solid #10b981' }}>
                <strong style={{ color: '#f8fafc' }}>2. 중력 없는 편안한 플레이</strong>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8' }}>
                  타일이 떨어지지 않으므로 원하는 단어부터 자유롭게 맞추세요. <strong>잘못 연결하면 친절한 안내와 함께 재시도</strong>할 수 있습니다.
                </p>
              </div>

              <div style={{ background: '#1e293b', padding: '10px 12px', borderRadius: '10px', borderLeft: '3px solid #f59e0b' }}>
                <strong style={{ color: '#f8fafc' }}>3. 진행도 자동 보존</strong>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8' }}>
                  새로고침을 하더라도 <strong>이미 맞춘 단어는 유지</strong>되며, 남은 단어만 이어서 풀 수 있습니다.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsHelpModalOpen(false)}
              style={{
                width: '100%',
                marginTop: '18px',
                padding: '11px',
                background: '#0284c7',
                color: '#fff',
                fontWeight: 800,
                fontSize: '14px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              이해했습니다
            </button>
          </div>
        </div>
      )}

      {/* 힌트 모달 */}
      {isHintModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #eab308',
              borderRadius: '16px',
              padding: '24px',
              width: '85%',
              maxWidth: '300px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>💡</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px 0' }}>힌트 잠금 해제</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0' }}>
              암호를 입력하면 다음 글자를 하나씩 알려줍니다.
            </p>

            <input
              type="text"
              value={hintPassword}
              onChange={(e) => setHintPassword(e.target.value)}
              placeholder=" 대전a반최고"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: hintError ? '1px solid #ef4444' : '1px solid #334155',
                background: '#1e293b',
                color: '#fff',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                marginBottom: hintError ? '6px' : '14px',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyHint()}
            />

            {hintError && (
              <p style={{ fontSize: '11px', color: '#ef4444', margin: '0 0 12px 0' }}>암호가 일치하지 않습니다.</p>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsHintModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#334155',
                  color: '#94a3b8',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handleApplyHint}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#eab308',
                  color: '#0f172a',
                  fontWeight: 800,
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
