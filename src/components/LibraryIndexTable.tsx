import React from 'react';
import { FolderPlus } from 'lucide-react';
import { useLibraryStore } from '../store/useLibraryStore';
import { GameIconTile } from './GameIconTile';
import { formatBytesToGB, formatPlaytimeHours } from '../services/tauriBridge';
import { GameItem } from '../types/game';

export const LibraryIndexTable: React.FC = () => {
  const {
    games,
    activeGameId,
    selectedStorefront,
    searchQuery,
    setActiveGame,
    triggerGameAction,
    importLocalExe,
  } = useLibraryStore();

  const filteredGames = games.filter((game) => {
    const matchesStore =
      selectedStorefront === 'All' || game.storefront === selectedStorefront;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      game.title.toLowerCase().includes(q) ||
      game.storefront.toLowerCase().includes(q) ||
      game.launch_uri.toLowerCase().includes(q) ||
      (game.executable_path && game.executable_path.toLowerCase().includes(q));
    return matchesStore && matchesQuery;
  });

  const renderStatusCell = (game: GameItem) => {
    switch (game.install_state) {
      case 'starting':
      case 'running':
        return (
          <div className="flex flex-col">
            <span className="font-sans font-bold text-xs text-[#93F1F7] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#93F1F7] animate-ping" />
              <span>
                {game.install_state === 'running'
                  ? 'Running Process'
                  : 'Starting Process...'}
              </span>
            </span>
            <span className="font-mono text-[11px] text-[#93F1F7]">
              {game.status_message}
            </span>
          </div>
        );
      case 'closing_client':
        return (
          <div className="flex flex-col">
            <span className="font-sans font-bold text-xs text-[#93F1F7]">
              Auto-Kill Grace
            </span>
            <span className="font-mono text-[11px] text-[#93F1F7] tabular-nums">
              {game.status_message}
            </span>
          </div>
        );
      case 'auth_required':
        return (
          <div className="flex flex-col">
            <span className="font-sans font-bold text-xs text-gy-warning">
              Auth Required
            </span>
            <span className="font-mono text-[11px] text-gy-warning">
              {game.status_message}
            </span>
          </div>
        );
      case 'update_needed':
        return (
          <div className="flex flex-col">
            <span className="font-sans font-semibold text-xs text-gy-muted">
              Update Needed
            </span>
            <span className="font-mono text-[11px] text-gy-muted">
              {game.status_message}
            </span>
          </div>
        );
      case 'cloud':
        return (
          <div className="flex flex-col">
            <span className="font-sans font-semibold text-xs text-gy-muted/70">
              Not Installed (Cloud)
            </span>
            <span className="font-mono text-[11px] text-gy-muted/70">
              Steam Web API Sync
            </span>
          </div>
        );
      default:
        return (
          <div className="flex flex-col">
            <span className="font-sans font-bold text-xs text-gy-ink">
              Installed, Ready
            </span>
            <span className="font-mono text-[11px] text-gy-muted">
              {game.storefront === 'Local' ? 'DIRECT .EXE' : 'Silent URI Ready'}
            </span>
          </div>
        );
    }
  };

  const renderActionButton = (game: GameItem) => {
    const isRunningOrStarting =
      game.install_state === 'starting' || game.install_state === 'running';
    const isClosing = game.install_state === 'closing_client';
    const isAuth = game.install_state === 'auth_required';
    const isUpdate = game.install_state === 'update_needed';
    const isCloud = game.install_state === 'cloud';

    let label = 'Launch';
    let btnClass =
      'bg-gy-elevated border-gy-border text-gy-ink hover:border-gy-ink';

    if (isClosing) {
      label = 'Kill Client Now';
      btnClass = 'bg-[#0F1D22] border-[#93F1F7] text-[#93F1F7]';
    } else if (isRunningOrStarting) {
      label = game.install_state === 'running' ? 'Stop Game' : 'Cancel';
      btnClass = 'bg-[#0F1D22] border-[#93F1F7] text-[#93F1F7]';
    } else if (isAuth) {
      label = 'Relogin Ubisoft';
      btnClass = 'bg-gy-warning border-gy-warning text-black font-bold';
    } else if (isUpdate) {
      label = 'Update in Epic';
      btnClass = 'bg-gy-elevated border-gy-border text-gy-muted hover:text-gy-ink';
    } else if (isCloud) {
      label = 'Install via Steam';
      btnClass = 'bg-gy-bg border-gy-border text-gy-muted hover:text-gy-ink';
    } else if (game.storefront === 'Local') {
      label = 'Run .EXE';
    }

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          triggerGameAction(game.id);
        }}
        className={`relative overflow-hidden min-h-[44px] w-[148px] px-3 rounded-gySm border text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer shrink-0 ${btnClass}`}
      >
        {isClosing && (
          <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#93F1F7] animate-gy-countdown-shrink" />
        )}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <section aria-label="Installed and Cloud Library Index" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-display font-bold text-sm tracking-tight text-gy-ink uppercase">
            INSTALLED &amp; CLOUD LIBRARY INDEX
          </h2>
          <span className="font-mono text-[11px] text-gy-muted tabular-nums">
            ({filteredGames.length} items shown)
          </span>
        </div>
        <span className="font-mono text-[11px] text-gy-muted">
          Sorted by: Last Played | Tabular-Nums Active
        </span>
      </div>

      {/* High-Density Execution Table */}
      <div className="rounded-gyMd bg-gy-surface border border-gy-border overflow-hidden">
        {/* Table Column Headers */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gy-elevated border-b border-gy-border font-mono text-[11px] font-semibold text-gy-muted uppercase">
          <div className="col-span-5">GAME &amp; LAUNCH URI</div>
          <div className="col-span-3">DISK &amp; PLAYTIME</div>
          <div className="col-span-2">PROCESS STATUS</div>
          <div className="col-span-2 text-right">EXECUTION</div>
        </div>

        {/* Rows (72px min height per row) with Staggered Reveal & Left Active Accent Bar */}
        {filteredGames.length > 0 ? (
          <div key={selectedStorefront} className="divide-y divide-gy-border">
            {filteredGames.map((game, idx) => {
              const isSelected = game.id === activeGameId;
              return (
                <div
                  key={game.id}
                  onClick={() => setActiveGame(game.id)}
                  style={{ animationDelay: `${Math.min(idx * 35, 240)}ms` }}
                  className={`relative min-h-[72px] px-5 py-3 grid grid-cols-12 gap-4 items-center cursor-pointer transition-colors animate-gy-row-enter group ${
                    isSelected
                      ? 'bg-gy-elevated/90'
                      : 'hover:bg-gy-elevated/40'
                  }`}
                >
                  {/* Animated Left Accent Indicator Bar for Active Staged Game */}
                  <span
                    className={`absolute left-0 top-0 bottom-0 w-[3px] bg-[#93F1F7] transition-transform duration-200 origin-center ${
                      isSelected ? 'scale-y-100' : 'scale-y-0'
                    }`}
                  />

                  {/* Col 1: 40x40 Icon + Title + Monospace URI */}
                  <div className="col-span-5 flex items-center gap-3.5 min-w-0">
                    <div className="group-hover:scale-105 transition-transform">
                      <GameIconTile game={game} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-bold text-sm text-gy-ink truncate">
                          {game.title}
                        </span>
                        {isSelected && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-gy-bg border border-gy-border text-[#93F1F7]">
                            STAGED
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xs text-gy-muted truncate mt-0.5">
                        {game.launch_uri}
                      </div>
                    </div>
                  </div>

                  {/* Col 2: Disk Size + Playtime + Drive Letter */}
                  <div className="col-span-3 font-mono text-xs tabular-nums">
                    <div className="text-gy-ink font-medium">
                      {formatBytesToGB(game.size_bytes)}{' '}
                      <span className="text-gy-muted">
                        ({game.drive_letter || 'Cloud'})
                      </span>
                    </div>
                    <div className="text-gy-muted text-[11px] mt-0.5">
                      {formatPlaytimeHours(game.total_playtime_seconds)} total |{' '}
                      {game.storefront}
                    </div>
                  </div>

                  {/* Col 3: Honest Execution States */}
                  <div className="col-span-2">{renderStatusCell(game)}</div>

                  {/* Col 4: 148x44 Action Button */}
                  <div className="col-span-2 flex justify-end">
                    {renderActionButton(game)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center font-mono text-xs text-gy-muted">
            No games matched filter "{searchQuery || selectedStorefront}".
          </div>
        )}
      </div>

      {/* Zona 3C: Empty Storefront / Custom Directory Bar (952x76 equivalent) */}
      <div className="min-h-[76px] rounded-gyMd bg-gy-surface border border-gy-border px-5 py-3 flex items-center justify-between gap-4">
        <div>
          <div className="font-sans font-bold text-xs text-gy-ink">
            GOG Galaxy / Custom Portable Directory
          </div>
          <div className="font-mono text-[11px] text-gy-muted mt-0.5">
            No GOG manifest detected in default registry path. Point GameYard to a custom folder or portable .EXE binary.
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            importLocalExe(
              'D:\\GOG Games\\Cyberpunk 2077\\bin\\x64\\Cyberpunk2077.exe',
              'Cyberpunk 2077 (GOG DRM-Free)'
            )
          }
          className="min-h-[44px] px-4 rounded-gySm bg-gy-elevated border border-gy-border text-gy-ink hover:border-gy-ink active:scale-[0.98] text-xs font-semibold flex items-center gap-2 shrink-0 cursor-pointer transition-all"
        >
          <FolderPlus className="w-4 h-4 text-[#93F1F7]" />
          <span>Select Game Folder</span>
        </button>
      </div>
    </section>
  );
};
