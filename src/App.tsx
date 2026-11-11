import React, { useEffect } from 'react';
import { HeaderCommandBar } from './components/HeaderCommandBar';
import { ActiveLaunchStage } from './components/ActiveLaunchStage';
import { AsymmetricPinnedShelf } from './components/AsymmetricPinnedShelf';
import { LibraryIndexTable } from './components/LibraryIndexTable';
import { StartupSplash } from './components/StartupSplash';
import { useLibraryStore } from './store/useLibraryStore';
import { Terminal } from 'lucide-react';

export const App: React.FC = () => {
  const {
    activeGameId,
    isBooting,
    toastMessage,
    triggerGameAction,
    completeBootAnimation,
    clearToast,
    setSearchQuery,
  } = useLibraryStore();

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isBooting) return;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInputFocused = tag === 'input' || tag === 'textarea';

      if (e.key === 'Enter' && !isInputFocused) {
        e.preventDefault();
        triggerGameAction(activeGameId);
      } else if (e.key === 'Escape') {
        setSearchQuery('');
        clearToast();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeGameId, isBooting, triggerGameAction, clearToast, setSearchQuery]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-gy-bg text-gy-ink flex flex-col">
      {/* Startup Turntable Boot Animation Overlay */}
      {isBooting && <StartupSplash onComplete={completeBootAnimation} />}

      {/* Zona 1: Top Command Header (64px) */}
      <HeaderCommandBar />

      {/* Main 2-Column Workspace below Header */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Zona 2: Left Active Launch Stage (440px fixed on desktop) */}
        <ActiveLaunchStage />

        {/* Zona 3: Right Library Workspace (Pinned Shelf + Execution Table) */}
        <main className="flex-1 min-w-0 overflow-y-auto p-6 space-y-6 bg-gy-bg">
          <AsymmetricPinnedShelf />
          <LibraryIndexTable />
        </main>
      </div>

      {/* Bottom Telemetry Status Toast Bar */}
      {toastMessage && (
        <div
          key={toastMessage}
          className="fixed bottom-4 right-6 z-50 bg-gy-surface border border-[#93F1F7] rounded-gySm px-4 py-2.5 flex items-center gap-3 font-mono text-xs text-gy-ink animate-gy-toast-enter"
        >
          <Terminal className="w-3.5 h-3.5 text-[#93F1F7] shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={clearToast}
            className="text-gy-muted hover:text-gy-ink ml-2 cursor-pointer"
          >
            [ESC]
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
