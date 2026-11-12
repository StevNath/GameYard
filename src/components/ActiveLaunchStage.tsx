import React, { useState } from 'react';
import {
  FolderOpen,
  FilePlus2,
  Pin,
  Terminal,
  Play,
  Square,
  KeyRound,
  Download,
  RefreshCcw,
  Timer,
} from 'lucide-react';
import { useLibraryStore } from '../store/useLibraryStore';
import { GameIconTile } from './GameIconTile';
import { formatBytesToGB, formatPlaytimeHours, ipcPickExecutable } from '../services/tauriBridge';

export const ActiveLaunchStage: React.FC = () => {
  const {
    games,
    activeGameId,
    triggerGameAction,
    toggleAutoKillRule,
    assignPinSlot,
    openGameFolder,
    importLocalExe,
  } = useLibraryStore();

  const [showImportBox, setShowImportBox] = useState(false);
  const [customExePath, setCustomExePath] = useState(
    'D:\\Games\\HadesII\\Ship\\Hades2.exe'
  );
  const [customExeTitle, setCustomExeTitle] = useState('Hades II');

  const activeGame = games.find((g) => g.id === activeGameId) || games[0];

  if (!activeGame) return null;

  const isRunningOrStarting =
    activeGame.install_state === 'starting' || activeGame.install_state === 'running';
  const isClosingClient = activeGame.install_state === 'closing_client';
  const isAuthRequired = activeGame.install_state === 'auth_required';
  const isUpdateNeeded = activeGame.install_state === 'update_needed';
  const isCloud = activeGame.install_state === 'cloud';

  const getPrimaryCtaLabel = () => {
    if (activeGame.install_state === 'starting') return `Starting ${activeGame.title}...`;
    if (activeGame.install_state === 'running')
      return `Stop ${activeGame.title} (Run Auto-Kill)`;
    if (isClosingClient) return `Auto-Killing ${activeGame.storefront}: ${activeGame.status_message}`;
    if (isAuthRequired) return `Relogin ${activeGame.storefront}`;
    if (isUpdateNeeded) return `Update ${activeGame.title}`;
    if (isCloud) return `Install ${activeGame.title}`;
    return `Launch ${activeGame.title}`;
  };

  const getPrimaryCtaIcon = () => {
    if (isClosingClient) return <Timer className="w-4 h-4 animate-spin" />;
    if (isRunningOrStarting) return <Square className="w-4 h-4 fill-current" />;
    if (isAuthRequired) return <KeyRound className="w-4 h-4" />;
    if (isUpdateNeeded) return <RefreshCcw className="w-4 h-4" />;
    if (isCloud) return <Download className="w-4 h-4" />;
    return <Play className="w-4 h-4 fill-current" />;
  };

  const handlePickExecutable = async () => {
    const selectedPath = await ipcPickExecutable();
    if (selectedPath) setCustomExePath(selectedPath);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customExePath.trim()) return;
    await importLocalExe(customExePath.trim(), customExeTitle.trim() || undefined);
    setShowImportBox(false);
  };

  return (
    <aside className="w-full lg:w-[440px] bg-gy-surface border-r border-gy-border p-6 flex flex-col justify-between shrink-0 select-none overflow-y-auto">
      <div key={activeGame.id} className="space-y-5 animate-gy-stage-enter">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-gy-muted">
            ACTIVE LAUNCH STAGE
          </span>
          <span className="font-mono text-[11px] text-gy-muted tabular-nums">
            ID: {activeGame.id}
          </span>
        </div>

        {/* Cover Art & Executable Binary Preview Slot (392x176) */}
        <div className="h-[176px] w-full rounded-gyMd bg-gy-elevated border border-gy-border p-4 flex flex-col justify-between relative overflow-hidden">
          {/* Top Row: Storefront Badge + Drive Letter + Status Pill */}
          <div className="flex items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-gySm bg-gy-surface border border-gy-border font-mono text-[11px] font-semibold text-gy-ink">
                {activeGame.storefront.toUpperCase()}
              </span>
              {activeGame.drive_letter && (
                <span className="px-2 py-1 rounded-gySm bg-gy-surface border border-gy-border font-mono text-[11px] text-gy-muted tabular-nums">
                  DRIVE {activeGame.drive_letter}
                </span>
              )}
            </div>

            <span
              className={`px-2.5 py-1 rounded-gySm font-mono text-[11px] font-semibold border transition-colors ${
                isRunningOrStarting || isClosingClient || activeGame.storefront === 'Local'
                  ? 'bg-[#0F1D22] border-[#21424D] text-[#93F1F7]'
                  : isAuthRequired
                    ? 'bg-[#17120A] border-[#92400E] text-gy-warning'
                    : 'bg-gy-surface border-gy-border text-gy-muted'
              }`}
            >
              {activeGame.status_message}
            </span>
          </div>

          {/* Center Watermark Monogram */}
          <div className="my-auto flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono text-gy-muted uppercase">
                TARGET EXECUTABLE PATH
              </div>
              <div className="font-display font-bold text-lg text-gy-ink tracking-tight">
                {activeGame.title}
              </div>
            </div>
            <span
              style={{ color: activeGame.icon_theme.text }}
              className="font-display font-extrabold text-4xl opacity-25 select-none"
            >
              {activeGame.short_code}
            </span>
          </div>

          {/* Bottom: Monospace Executable Path Bar */}
          <div className="bg-gy-bg border border-gy-border rounded-gySm px-3 py-2 flex items-center gap-2 font-mono text-[11px] text-gy-muted truncate">
            <Terminal className="w-3.5 h-3.5 text-[#93F1F7] shrink-0" />
            <span
              className="truncate select-all"
              title={activeGame.executable_path || activeGame.launch_uri}
            >
              {activeGame.executable_path || `${activeGame.launch_uri} (Cloud Only)`}
            </span>
          </div>
        </div>

        {/* Game Identity Row: 40x40 Icon + 24px Title + Telemetry */}
        <div className="flex items-start gap-3.5">
          <GameIconTile game={activeGame} size="md" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display font-bold text-[24px] leading-[30px] tracking-[-0.02em] text-gy-ink truncate">
              {activeGame.title}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-gy-muted tabular-nums">
              <span>{activeGame.storefront}</span>
              <span>|</span>
              <span>{formatBytesToGB(activeGame.size_bytes)}</span>
              <span>|</span>
              <span>{formatPlaytimeHours(activeGame.total_playtime_seconds)} played</span>
            </div>
          </div>
        </div>

        {/* Primary CTA Button (48px height, Single Accent #93F1F7 in Ready State) */}
        <button
          type="button"
          onClick={() => triggerGameAction(activeGame.id)}
          className={`relative overflow-hidden w-full min-h-[48px] px-4 rounded-gySm font-sans font-bold text-sm flex items-center justify-between active:scale-[0.985] transition-all cursor-pointer ${
            isAuthRequired
              ? 'bg-gy-warning text-black hover:opacity-95'
              : isRunningOrStarting || isClosingClient
                ? 'bg-[#0F1D22] border border-[#93F1F7] text-[#93F1F7] hover:opacity-95'
                : 'bg-gy-accent text-gy-accent-ink hover:opacity-95'
          }`}
        >
          {/* Sweep animation during starting */}
          {activeGame.install_state === 'starting' && (
            <span className="absolute bottom-0 left-0 h-[3px] w-2/5 bg-[#93F1F7] animate-gy-progress-sweep" />
          )}

          {/* 5-Second Shrinking Bar during Auto-Kill Grace Period */}
          {isClosingClient && (
            <span className="absolute bottom-0 left-0 h-[3px] w-full bg-[#93F1F7] animate-gy-countdown-shrink" />
          )}

          <span className="flex items-center gap-2.5 truncate pr-2">
            {getPrimaryCtaIcon()}
            <span className="truncate">{getPrimaryCtaLabel()}</span>
          </span>
          <kbd className="font-mono text-xs px-2 py-0.5 rounded bg-black/15 shrink-0">
            [Enter]
          </kbd>
        </button>

        {/* Launch Protocol & Smart Resource Saver Rules Box */}
        <div className="bg-gy-bg border border-gy-border rounded-gyMd p-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-gy-border pb-2">
            <span className="font-mono text-[11px] font-bold text-gy-muted uppercase">
              LAUNCH PROTOCOL &amp; RESOURCE RULES
            </span>
            <span className="font-mono text-[11px] text-[#93F1F7]">FOLDER WATCHER</span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-gy-muted">PROTOCOL:</span>
              <span
                className="text-gy-ink truncate max-w-[230px]"
                title={activeGame.launch_uri}
              >
                {activeGame.launch_uri}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-gy-muted">CLIENT MODE:</span>
              <span className="text-gy-ink">
                {activeGame.storefront === 'Local'
                  ? 'Direct .EXE (Zero Client)'
                  : 'Silent Background (-silent)'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-gy-muted">WATCH PATH:</span>
              <span
                className="text-gy-muted truncate max-w-[230px]"
                title={activeGame.install_dir || 'N/A'}
              >
                {activeGame.install_dir || 'Cloud Library'}
              </span>
            </div>

            <div className="pt-1 flex items-center justify-between gap-2 border-t border-gy-border/60">
              <span className="text-gy-muted">CLEANUP RULE:</span>
              <button
                type="button"
                onClick={() => toggleAutoKillRule(activeGame.id)}
                className={`min-h-[36px] px-2.5 py-1 rounded-gySm border font-mono text-[11px] font-semibold active:scale-[0.98] cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeGame.auto_kill_client
                    ? 'bg-[#0F1D22] border-[#21424D] text-[#93F1F7]'
                    : 'bg-gy-elevated border-gy-border text-gy-muted'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    activeGame.auto_kill_client
                      ? 'bg-[#93F1F7] animate-pulse'
                      : 'bg-gy-muted'
                  }`}
                />
                <span>
                  {activeGame.auto_kill_client
                    ? 'Auto-Kill Client (5s Grace): ON'
                    : 'Auto-Kill Client: OFF'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick-Switch Pinning Controls */}
        <div className="bg-gy-bg border border-gy-border rounded-gyMd p-3 flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-gy-muted flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 text-gy-ink" />
            <span>QUICK-SWITCH PIN:</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                assignPinSlot(activeGame.id, activeGame.pin_slot === 1 ? 0 : 1)
              }
              className={`min-h-[36px] px-2.5 rounded-gySm font-mono text-[11px] border active:scale-[0.97] cursor-pointer transition-all ${
                activeGame.pin_slot === 1
                  ? 'bg-gy-ink text-gy-bg border-gy-ink font-bold'
                  : 'bg-gy-elevated text-gy-muted border-gy-border hover:text-gy-ink'
              }`}
            >
              Slot 1 (7-Col)
            </button>
            <button
              type="button"
              onClick={() =>
                assignPinSlot(activeGame.id, activeGame.pin_slot === 2 ? 0 : 2)
              }
              className={`min-h-[36px] px-2.5 rounded-gySm font-mono text-[11px] border active:scale-[0.97] cursor-pointer transition-all ${
                activeGame.pin_slot === 2
                  ? 'bg-gy-ink text-gy-bg border-gy-ink font-bold'
                  : 'bg-gy-elevated text-gy-muted border-gy-border hover:text-gy-ink'
              }`}
            >
              Slot 2 (5-Col)
            </button>
          </div>
        </div>

        {/* Inline Custom .EXE Importer Form with Slide-Down Drawer Animation */}
        {showImportBox && (
          <form
            onSubmit={handleImportSubmit}
            className="bg-gy-bg border border-[#93F1F7] rounded-gyMd p-3.5 space-y-2.5 animate-gy-drawer-open"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-[#93F1F7]">
                ADD LOCAL .EXE GAME
              </span>
              <button
                type="button"
                onClick={() => setShowImportBox(false)}
                className="font-mono text-[11px] text-gy-muted hover:text-gy-ink cursor-pointer"
              >
                [Close]
              </button>
            </div>
            <input
              type="text"
              value={customExeTitle}
              onChange={(e) => setCustomExeTitle(e.target.value)}
              placeholder="Game Title (e.g. Hades II)"
              className="w-full min-h-[40px] px-3 bg-gy-surface border border-gy-border rounded-gySm text-xs text-gy-ink focus:border-[#93F1F7] focus:outline-none"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={customExePath}
                onChange={(e) => setCustomExePath(e.target.value)}
                placeholder="Full .exe path (e.g. D:\Games\Hades2.exe)"
                className="min-w-0 flex-1 min-h-[40px] px-3 bg-gy-surface border border-gy-border rounded-gySm font-mono text-xs text-gy-ink focus:border-[#93F1F7] focus:outline-none"
              />
              <button
                type="button"
                onClick={handlePickExecutable}
                className="min-h-[40px] px-3 rounded-gySm bg-gy-elevated border border-gy-border text-gy-ink text-xs font-semibold hover:border-[#93F1F7] cursor-pointer"
              >
                Browse
              </button>
            </div>
            <button
              type="submit"
              className="w-full min-h-[44px] bg-gy-ink text-gy-bg font-semibold text-xs rounded-gySm active:scale-[0.985] transition-transform cursor-pointer hover:opacity-90"
            >
              Extract Icon &amp; Save to SQLite
            </button>
          </form>
        )}
      </div>

      {/* Bottom 2 Utility Buttons (190x44 each) */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gy-border mt-4">
        <button
          type="button"
          onClick={() => openGameFolder(activeGame.id)}
          className="min-h-[44px] px-3 rounded-gySm bg-gy-elevated border border-gy-border text-gy-ink hover:border-gy-muted active:scale-[0.98] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <FolderOpen className="w-3.5 h-3.5 text-gy-muted" />
          <span>Open Install Folder</span>
        </button>

        <button
          type="button"
          onClick={() => setShowImportBox((prev) => !prev)}
          className="min-h-[44px] px-3 rounded-gySm bg-gy-elevated border border-gy-border text-gy-ink hover:border-gy-muted active:scale-[0.98] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <FilePlus2 className="w-3.5 h-3.5 text-[#93F1F7]" />
          <span>Import Local .EXE</span>
        </button>
      </div>
    </aside>
  );
};
