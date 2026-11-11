import React from 'react';
import { Play, Zap } from 'lucide-react';
import { useLibraryStore } from '../store/useLibraryStore';
import { GameIconTile } from './GameIconTile';
import { formatBytesToGB, formatPlaytimeHours } from '../services/tauriBridge';

export const AsymmetricPinnedShelf: React.FC = () => {
  const { games, activeGameId, setActiveGame, triggerGameAction } = useLibraryStore();

  const primaryPin = games.find((g) => g.pin_slot === 1) || games[0];
  const secondaryPin = games.find((g) => g.pin_slot === 2) || games[1];

  return (
    <section aria-label="Pinned Quick-Switch Shelf" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-display font-bold text-sm tracking-tight text-gy-ink uppercase">
            PINNED QUICK-SWITCH (ASYMMETRIC 2-SLOT)
          </h2>
          <span className="font-mono text-[11px] text-gy-muted">
            | 7-Col Heavy Campaign + 5-Col Instant .EXE
          </span>
        </div>
        <span className="font-mono text-[11px] text-gy-muted">
          Click card to stage | Click CTA to execute
        </span>
      </div>

      {/* 12-Column Asymmetric Grid: 7 Cols Primary + 5 Cols Secondary */}
      <div className="grid grid-cols-12 gap-6">
        {/* Slot 1: 7 Columns (Primary Pin) */}
        {primaryPin && (
          <div
            key={`pin1_${primaryPin.id}`}
            onClick={() => setActiveGame(primaryPin.id)}
            className={`col-span-12 xl:col-span-7 min-h-[148px] rounded-gyMd bg-gy-surface border p-5 flex flex-col justify-between cursor-pointer transition-all animate-gy-card-swap group ${
              activeGameId === primaryPin.id
                ? 'border-gy-ink'
                : 'border-gy-border hover:border-gy-muted'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="group-hover:scale-105 transition-transform">
                  <GameIconTile game={primaryPin} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-gy-elevated border border-gy-border text-gy-muted">
                      PIN SLOT 01 | {primaryPin.storefront.toUpperCase()}
                    </span>
                    {primaryPin.auto_kill_client && (
                      <span className="font-mono text-[10px] text-[#93F1F7]">
                        AUTO-KILL ON
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-base text-gy-ink truncate mt-1">
                    {primaryPin.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerGameAction(primaryPin.id);
                }}
                className="min-h-[44px] px-4 rounded-gySm bg-gy-ink text-gy-bg font-sans font-bold text-xs flex items-center gap-2 shrink-0 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {primaryPin.install_state === 'running'
                    ? 'Running'
                    : primaryPin.install_state === 'starting'
                      ? 'Starting...'
                      : primaryPin.install_state === 'closing_client'
                        ? 'Closing...'
                        : `Launch ${primaryPin.title}`}
                </span>
              </button>
            </div>

            <div className="pt-3 border-t border-gy-border flex items-center justify-between gap-4 font-mono text-xs text-gy-muted tabular-nums">
              <span className="truncate">{primaryPin.launch_uri}</span>
              <span className="shrink-0">
                {formatBytesToGB(primaryPin.size_bytes)} |{' '}
                {formatPlaytimeHours(primaryPin.total_playtime_seconds)}
              </span>
            </div>
          </div>
        )}

        {/* Slot 2: 5 Columns (Secondary Local .EXE Pin) */}
        {secondaryPin && (
          <div
            key={`pin2_${secondaryPin.id}`}
            onClick={() => setActiveGame(secondaryPin.id)}
            className={`col-span-12 xl:col-span-5 min-h-[148px] rounded-gyMd bg-gy-surface border p-5 flex flex-col justify-between cursor-pointer transition-all animate-gy-card-swap group ${
              activeGameId === secondaryPin.id
                ? 'border-gy-ink'
                : 'border-gy-border hover:border-gy-muted'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="group-hover:scale-105 transition-transform">
                  <GameIconTile game={secondaryPin} />
                </div>
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-[#0F1D22] border border-[#21424D] text-[#93F1F7]">
                    <Zap className="w-3 h-3" />
                    <span>DIRECT .EXE</span>
                  </span>
                  <h3 className="font-display font-bold text-base text-gy-ink truncate mt-1">
                    {secondaryPin.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerGameAction(secondaryPin.id);
                }}
                className="min-h-[44px] px-3.5 rounded-gySm bg-gy-elevated border border-gy-border text-gy-ink hover:border-gy-ink active:scale-[0.98] font-sans font-semibold text-xs shrink-0 cursor-pointer transition-all"
              >
                {secondaryPin.install_state === 'running'
                  ? 'Running'
                  : 'Run Executable'}
              </button>
            </div>

            <div className="pt-3 border-t border-gy-border flex items-center justify-between gap-2 font-mono text-xs text-gy-muted tabular-nums">
              <span className="truncate">
                {secondaryPin.drive_letter || 'C:\\'} | Zero Launcher Overhead
              </span>
              <span className="shrink-0">
                {formatBytesToGB(secondaryPin.size_bytes)}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
