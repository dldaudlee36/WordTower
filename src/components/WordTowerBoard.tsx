import React, { useEffect, useRef, useState } from 'react';
import { PixiWordEngine } from '../engine/PixiWordEngine';
import type { StageData } from '../types/game';

interface Props {
  stage: StageData;
  stageNumber: number;
  onClear: () => void;
  onReset: () => void;
  onOpenMenu: () => void; // 폴백 메뉴 트리거
}

export const WordTowerBoard: React.FC<Props> = ({
  stage,
  stageNumber,
  onClear,
  onReset,
  onOpenMenu,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PixiWordEngine | null>(null);
  const [clearedWords, setClearedWords] = useState<string[]>([]);

  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [hintPassword, setHintPassword] = useState('');
  const [hintIndex, setHintIndex] = useState(0);
  const [hintError, setHintError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    setClearedWords([]);
    setHintIndex(0);

    const engine = new PixiWordEngine({
      container: containerRef.current,
      rows: stage.rows,
      cols: stage.cols,
      onWordSubmit: (selectedChars, _) => {
        const word = selectedChars.join('');
        if (stage.targetWords.includes(word) && !clearedWords.includes(word)) {
          setClearedWords((prev) => {
            const next = [...prev, word];
            if (next.length === stage.targetWords.length) {
              setTimeout(onClear, 600);
            }
            return next;
          });
          return true;
        }
        return false;
      },
    });

    const clonedGrid = JSON.parse(JSON.stringify(stage.grid));
    engine.init(clonedGrid);
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [stage]);

  const handleApplyHint = () => {
    if (hintPassword.trim() === '대전a반최고') {
      const remainingWords = stage.targetWords.filter((w) => !clearedWords.includes(w));
      if (remainingWords.length > 0 && engineRef.current) {
        const currentTargetWord = remainingWords[hintIndex % remainingWords.length];
        const firstChar = currentTargetWord[0];
        engineRef.current.showHint(firstChar);
        setHintIndex((prev) => prev + 1);
      }
      setIsHintModalOpen(false);
      setHintPassword('');
      setHintError(false);
    } else {
      setHintError(true);
    }
  };

  const remainingCount = stage.targetWords.length - clearedWords.length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      
      {/* 1. 상단 헤더 영역 */}
      <div style={{ width: '100%', maxWidth: '380px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* 스테이지 선택 폴백 메뉴 버튼 */}
            <button
              onClick={onOpenMenu}
              title="스테이지 선택"
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              STAGE {stageNumber} ☰
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#60a5fa', margin: 0 }}>
              워드타워
            </h1>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '3px 0 0 0' }}>
            숨겨진 단어를 드래그하여 완성하세요
          </p>
        </div>

        {/* 카운터, 힌트, 다시하기 (높이 48px 완전 동기화) */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch', height: '48px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#1e293b',
              border: '2px solid #3b82f6',
              borderRadius: '10px',
              padding: '0 10px',
              minWidth: '64px',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, lineHeight: 1 }}>남은 단어</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#60a5fa', lineHeight: 1, marginTop: '3px' }}>
              {remainingCount}
            </span>
          </div>

          <button
            onClick={() => {
              setIsHintModalOpen(true);
              setHintError(false);
            }}
            title="힌트 받기"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#1e293b',
              border: '1px solid #eab308',
              color: '#eab308',
              borderRadius: '10px',
              padding: '0 12px',
              fontSize: '18px',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            💡
          </button>

          <button
            onClick={onReset}
            title="다시 하기"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              borderRadius: '10px',
              padding: '0 12px',
              fontSize: '18px',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            ↺
          </button>
        </div>
      </div>

      {/* 2. 캔버스 영역 */}
      <div
        ref={containerRef}
        style={{
          width: '360px',
          height: '400px',
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          border: '1px solid #334155',
          overflow: 'hidden',
          touchAction: 'none',
        }}
      />

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
              암호를 입력하면 첫 글자를 짚어줍니다.
            </p>

            {/* 희미한 글씨로 힌트 암호가 보이도록 처리된 입력창 */}
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
              className="placeholder:text-slate-600 placeholder:opacity-50"
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