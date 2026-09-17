import React, { useEffect, useRef, useState } from 'react';
import { PixiWordEngine } from '../engine/PixiWordEngine';
import type { StageData } from '../types/game';

interface Props {
  stage: StageData;
  stageNumber: number;
  chapterNumber?: number;
  onClear: () => void;
  onReset: () => void;
  onOpenMenu: () => void;
}

export const WordTowerBoard: React.FC<Props> = ({
  stage,
  stageNumber,
  chapterNumber = 1,
  onClear,
  onReset,
  onOpenMenu,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PixiWordEngine | null>(null);
  const [clearedWords, setClearedWords] = useState<string[]>([]);

  // 힌트 모달 상태
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [hintPassword, setHintPassword] = useState('');
  const [hintIndex, setHintIndex] = useState(0);
  const [hintError, setHintError] = useState(false);

  // 게임 설명서 모달 상태
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

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
      
     {/* 1. 상단 헤더 영역 (2단 정렬 구조로 개편) */}
      <div style={{ width: '100%', maxWidth: '360px', marginBottom: '12px' }}>
        
        {/* 상단 1열: 스테이지 뱃지, 타이틀, 액션 버튼 3종 */}
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

          {/* 액션 버튼 그룹 (❓, 💡, ↺) - 정사각 36px 규격 통일 */}
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
              onClick={onReset}
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

        {/* 상단 2열: 안내 문구 & 남은 단어 배지 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      </div>

      {/* 2. 캔버스 영역 */}
      <div
        ref={containerRef}
        style={{
          width: '360px',
          height: '450px',
          backgroundColor: '#0f172a',
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
                <strong style={{ color: '#f8fafc' }}>1. 단어 연결 규칙</strong>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8' }}>
                  손가락이나 마우스로 <strong>상하좌우·대각선(8방향)</strong> 인접한 글자들을 이어서 숨겨진 단어를 드래그하세요.
                </p>
              </div>

              <div style={{ background: '#1e293b', padding: '10px 12px', borderRadius: '10px', borderLeft: '3px solid #f59e0b' }}>
                <strong style={{ color: '#f8fafc' }}>2. 타워 중력 법칙 (핵심!)</strong>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8' }}>
                  단어가 맞춰지면 타일이 사라지고 위의 글자들이 아래로 떨어집니다. <strong>순서를 잘못 맞추면 글자가 끊겨 클리어가 불가능</strong>해질 수 있습니다.
                </p>
              </div>

              <div style={{ background: '#1e293b', padding: '10px 12px', borderRadius: '10px', borderLeft: '3px solid #10b981' }}>
                <strong style={{ color: '#f8fafc' }}>3. 막혔을 때의 팁</strong>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8' }}>
                  순서가 꼬였다면 <strong>↺ (다시하기)</strong> 버튼으로 초기 배치로 되돌리세요. 첫 글자가 안 보일 땐 <strong>💡 (힌트)</strong>를 활용할 수 있습니다.
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
              암호를 입력하면 첫 글자를 짚어줍니다.
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
