import React from 'react';
import { Play, FolderOpen, RefreshCw, Zap, Search, Shield, Award } from 'lucide-react';
import { useLibraryStore } from '../store/useLibraryStore';

export const ConsoleGridMode: React.FC = () => {
  const {
    games,
    activeGameId,
    setActiveGame,
    triggerGameAction,
    searchQuery,
    setSearchQuery,
    selectedStorefront,
    setSelectedStorefront,
    openGameFolder,
    toggleAutoKillRule,
  } = useLibraryStore();

  const activeGame = games.find((g) => g.id === activeGameId) || games[0];

  const filteredGames = games.filter((game) => {
    const matchesSearch =
      !searchQuery ||
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.developer?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStore =
      selectedStorefront === 'All' || game.storefront === selectedStorefront;
    return matchesSearch && matchesStore;
  });

  const storefronts = ['All', 'Steam', 'Epic', 'Ubisoft', 'GOG', 'EA', 'Local'] as const;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gy-bg text-gy-ink p-6 space-y-6">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {storefronts.map((store) => (
            <button
              key={store}
              type="button"
              onClick={() => setSelectedStorefront(store)}
              className={`px-4 py-2 rounded-full font-mono text-xs font-semibold cursor-pointer transition-all ${
                selectedStorefront === store
                  ? 'bg-gy-elevated text-gy-accent border border-gy-accent shadow-[0_0_12px_rgba(74,222,128,0.2)]'
                  : 'bg-gy-surface text-gy-muted hover:text-gy-ink border border-gy-border'
              }`}
            >
              {store}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gy-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search library..."
            className="w-full bg-gy-surface border border-gy-border rounded-full pl-9 pr-4 py-2 font-mono text-xs text-gy-ink focus:outline-none focus:border-gy-accent"
          />
        </div>
      </div>

      {/* Featured Hero Banner */}
      {activeGame && (
        <div className="relative rounded-2xl bg-gy-surface border border-gy-border p-6 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-3 z-10 max-w-xl">
            <div className="flex items-center gap-2 font-mono text-xs text-gy-accent">
              <span className="px-2 py-0.5 rounded bg-gy-accent/10 border border-gy-accent/30">
                {activeGame.storefront}
              </span>
              <span>{activeGame.install_state.toUpperCase()}</span>
            </div>
            <h1 className="font-display font-black text-3xl md:text-4xl text-gy-ink tracking-tight">
              {activeGame.title}
            </h1>
            <p className="text-xs text-gy-muted font-mono line-clamp-2">
              {activeGame.install_dir || activeGame.executable_path || 'Indexed binary location'}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => triggerGameAction(activeGame.id)}
                className="px-6 py-3 rounded-xl bg-gy-accent text-gy-accent-ink font-sans font-bold text-sm flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(74,222,128,0.3)] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>PLAY NOW</span>
              </button>

              <button
                type="button"
                onClick={() => openGameFolder(activeGame.id)}
                className="p-3 rounded-xl bg-gy-elevated border border-gy-border text-gy-muted hover:text-gy-ink cursor-pointer transition-colors"
                title="Open Folder"
              >
                <FolderOpen className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => toggleAutoKillRule(activeGame.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                  activeGame.auto_kill_client
                    ? 'bg-gy-accent/10 border-gy-accent text-gy-accent'
                    : 'bg-gy-elevated border-gy-border text-gy-muted hover:text-gy-ink'
                }`}
                title="Auto-Kill Launcher"
              >
                <Zap className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Game Icon / Artwork Preview */}
          <div className="w-44 h-44 rounded-xl bg-gy-elevated border border-gy-border shrink-0 flex items-center justify-center overflow-hidden">
            {activeGame.icon_cache_path ? (
              <img
                src={activeGame.icon_cache_path}
                alt={activeGame.title}
                className="w-28 h-28 object-contain"
              />
            ) : (
              <div className="font-display font-bold text-4xl text-gy-muted/30">
                {activeGame.title.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6-Column Console Poster Grid */}
      <div className="flex-1 overflow-y-auto pr-2">
        <h2 className="font-mono text-xs text-gy-muted uppercase tracking-wider mb-4">
          Library ({filteredGames.length} items)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredGames.map((game) => {
            const isActive = game.id === activeGameId;
            return (
              <div
                key={game.id}
                onClick={() => setActiveGame(game.id)}
                className={`group relative aspect-[2/3] rounded-xl bg-gy-surface border transition-all cursor-pointer overflow-hidden flex flex-col justify-between p-3 ${
                  isActive
                    ? 'border-gy-accent ring-2 ring-gy-accent/50 scale-[1.03] shadow-[0_0_24px_rgba(74,222,128,0.25)]'
                    : 'border-gy-border hover:border-gy-muted hover:scale-[1.01]'
                }`}
              >
                {/* Store Badge */}
                <div className="flex items-center justify-between z-10">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/60 backdrop-blur border border-white/10 text-gy-ink">
                    {game.storefront}
                  </span>
                  {game.auto_kill_client && (
                    <Zap className="w-3 h-3 text-gy-accent" />
                  )}
                </div>

                {/* Center Icon / Placeholder */}
                <div className="flex-1 flex items-center justify-center my-2">
                  {game.icon_cache_path ? (
                    <img
                      src={game.icon_cache_path}
                      alt={game.title}
                      className="w-16 h-16 object-contain group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="font-display font-bold text-3xl text-gy-muted/40 group-hover:text-gy-accent/80 transition-colors">
                      {game.title.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Bottom Title Info */}
                <div className="z-10 bg-black/70 backdrop-blur rounded-lg p-2 border border-white/5">
                  <div className="font-sans font-bold text-xs text-gy-ink truncate">
                    {game.title}
                  </div>
                  <div className="font-mono text-[10px] text-gy-muted truncate mt-0.5">
                    {game.install_state}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
