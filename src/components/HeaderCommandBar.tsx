import React, { useEffect, useRef } from 'react';
import { RefreshCw, Search, Sun, Moon, AlertTriangle } from 'lucide-react';
import { GameYardLogo } from './GameYardLogo';
import { StoreFilter, useLibraryStore } from '../store/useLibraryStore';

const STORE_TABS: { id: StoreFilter; label: string }[] = [
  { id: 'All', label: 'All Library' },
  { id: 'Steam', label: 'Steam' },
  { id: 'Epic', label: 'Epic' },
  { id: 'Ubisoft', label: 'Ubisoft' },
  { id: 'GOG', label: 'GOG' },
  { id: 'Local', label: 'Local .EXE' },
];

export const HeaderCommandBar: React.FC = () => {
  const {
    games,
    selectedStorefront,
    searchQuery,
    theme,
    drivesCount,
    isScanning,
    rotorAngle,
    setSelectedStorefront,
    setSearchQuery,
    toggleTheme,
    replayBootAnimation,
    scanDrives,
  } = useLibraryStore();

  const searchInputRef = useRef<HTMLInputElement>(null);

  const readyCount = games.filter((g) => g.is_installed).length;
  const ubisoftExpiredCount = games.filter(
    (g) => g.storefront === 'Ubisoft' && g.install_state === 'auth_required'
  ).length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-16 w-full bg-gy-surface border-b border-gy-border px-6 flex items-center justify-between gap-4 shrink-0">
      {/* Left: Brand Identity (Click to Replay Turntable Boot Animation) + Drive Telemetry Badge */}
      <div className="flex items-center gap-4 min-w-0">
        <button
          type="button"
          onClick={replayBootAnimation}
          title="Click to replay GameYard Turntable Startup Animation"
          className="min-h-[44px] flex items-center gap-2.5 cursor-pointer group focus:outline-none"
        >
          <GameYardLogo
            size={28}
            mode={isScanning ? 'spinning' : 'static'}
            rotorAngle={rotorAngle}
          />
          <span className="font-display font-bold text-[18px] leading-[27px] tracking-[-0.03em] text-gy-ink select-none group-hover:text-[#93F1F7] transition-colors">
            GAMEYARD
          </span>
        </button>

        <div className="hidden xl:flex items-center gap-2 bg-gy-elevated border border-gy-border rounded-gySm px-2.5 py-1.5 font-mono text-[11px] text-gy-muted tabular-nums">
          <span className="w-2 h-2 rounded-full bg-[#93F1F7] inline-block animate-pulse" />
          <span>
            {drivesCount} Drives Indexed ({readyCount} Ready)
          </span>
        </div>

        <button
          type="button"
          onClick={() => scanDrives()}
          disabled={isScanning}
          title="Rescan local drives (Steam VDF, Epic Manifests, Ubisoft Registry)"
          className="min-h-[44px] px-3 rounded-gySm bg-gy-elevated border border-gy-border text-gy-muted hover:text-gy-ink hover:border-gy-muted active:scale-[0.98] transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-[#93F1F7]' : ''}`} />
          <span className="hidden 2xl:inline">{isScanning ? 'Scanning...' : 'Rescan'}</span>
        </button>
      </div>

      {/* Center: Command Filter Input [Ctrl+K] */}
      <div className="relative w-[280px] lg:w-[310px] shrink-0">
        <Search className="w-3.5 h-3.5 text-gy-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter title, URI, or executable..."
          className="w-full min-h-[44px] pl-9 pr-16 bg-gy-bg border border-gy-border focus:border-[#93F1F7] rounded-gySm text-xs text-gy-ink placeholder:text-gy-muted focus:outline-none transition-colors"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-gy-muted hover:text-gy-ink px-1.5 py-0.5 rounded bg-gy-elevated cursor-pointer"
          >
            ESC
          </button>
        ) : (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-gy-ink pointer-events-none select-none">
            [Ctrl+K]
          </kbd>
        )}
      </div>

      {/* Right: Storefront Filter Tabs + Theme Toggle */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {STORE_TABS.map((tab) => {
          const isActive = selectedStorefront === tab.id;
          const count =
            tab.id === 'All'
              ? games.length
              : games.filter((g) => g.storefront === tab.id).length;
          const isUbisoftWarning = tab.id === 'Ubisoft' && ubisoftExpiredCount > 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStorefront(tab.id)}
              className={`min-h-[44px] px-3 rounded-gySm text-xs font-semibold active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                isActive
                  ? 'bg-gy-ink text-gy-bg border-gy-ink'
                  : isUbisoftWarning
                    ? 'bg-gy-elevated text-gy-warning border-gy-warning/70 hover:border-gy-warning'
                    : 'bg-gy-elevated text-gy-muted border-gy-border hover:text-gy-ink'
              }`}
            >
              {isUbisoftWarning && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
              <span>{tab.label}</span>
              <span
                className={`font-mono text-[11px] tabular-nums ${
                  isActive
                    ? 'text-gy-bg/80'
                    : isUbisoftWarning
                      ? 'text-gy-warning'
                      : 'text-gy-muted'
                }`}
              >
                {isUbisoftWarning ? `(${count} - Relogin)` : `(${count})`}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={toggleTheme}
          title={
            theme === 'dark'
              ? 'Switch to Daylight Mode'
              : 'Switch to Candy-on-Black Dark Mode'
          }
          className="min-h-[44px] min-w-[44px] px-2.5 rounded-gySm bg-gy-elevated border border-gy-border text-gy-muted hover:text-gy-ink active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer ml-1"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
