import React, { useEffect, useState } from 'react';
import { GameYardLogo } from './GameYardLogo';

interface StartupSplashProps {
  onComplete: () => void;
}

const BOOT_STEPS = [
  { progress: 28, text: 'MOUNTING LOCAL SQLITE WAL [gameyard.db]...' },
  { progress: 68, text: 'SCANNING STEAM VDF | EPIC .ITEM | UBISOFT REGISTRY...' },
  { progress: 100, text: '3 DRIVES INDEXED (7 INSTALLED, 1 CLOUD) - READY.' },
];

export const StartupSplash: React.FC<StartupSplashProps> = ({ onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setStepIndex(1), 380);
    const t2 = setTimeout(() => setStepIndex(2), 820);
    const t3 = setTimeout(() => setIsExiting(true), 1280);
    const t4 = setTimeout(() => onComplete(), 1520);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  const currentStep = BOOT_STEPS[stepIndex];

  return (
    <div
      className={`fixed inset-0 z-[100] bg-gy-bg flex flex-col items-center justify-center select-none transition-opacity duration-200 ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-[360px] bg-gy-surface border border-gy-border rounded-gyLg p-8 flex flex-col items-center text-center">
        {/* Animated B01-V3 Turntable Switchyard Logomark */}
        <div className="w-24 h-24 rounded-gyLg bg-gy-bg border border-gy-border flex items-center justify-center mb-5">
          <GameYardLogo size={60} mode="boot" />
        </div>

        {/* Wordmark & Subtitle */}
        <div className="font-display font-extrabold text-2xl tracking-[-0.03em] text-gy-ink">
          GAMEYARD
        </div>
        <div className="font-mono text-[11px] text-gy-muted mt-1">
          UNIFIED DESKTOP GAME SWITCHYARD
        </div>

        {/* Crisp 2px Progress Track */}
        <div className="w-full h-[3px] bg-gy-border rounded-full overflow-hidden mt-6 mb-3">
          <div
            style={{ width: `${currentStep.progress}%` }}
            className="h-full bg-[#93F1F7] transition-all duration-300 ease-out"
          />
        </div>

        {/* Boot Telemetry Readout */}
        <div className="w-full flex items-center justify-between font-mono text-[11px] tabular-nums">
          <span className="text-[#93F1F7] truncate pr-2">{currentStep.text}</span>
          <span className="text-gy-muted shrink-0">{currentStep.progress}%</span>
        </div>
      </div>
    </div>
  );
};
