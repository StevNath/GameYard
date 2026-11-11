import React from 'react';
import { GameItem } from '../types/game';

interface GameIconTileProps {
  game: GameItem;
  size?: 'sm' | 'md';
}

export const GameIconTile: React.FC<GameIconTileProps> = ({ game, size = 'md' }) => {
  const dimensionClass = size === 'sm' ? 'w-9 h-9 text-xs' : 'w-10 h-10 text-xs';

  if (game.icon_cache_path) {
    return (
      <img
        src={game.icon_cache_path}
        alt={game.title}
        className={`${dimensionClass} rounded-gyMd object-cover shrink-0 border border-gy-border`}
      />
    );
  }

  return (
    <div
      style={{
        backgroundColor: game.icon_theme.bg,
        borderColor: game.icon_theme.border,
        color: game.icon_theme.text,
      }}
      className={`${dimensionClass} rounded-gyMd border flex items-center justify-center font-display font-bold tracking-tight shrink-0 select-none`}
      title={`${game.title} (${game.storefront})`}
    >
      {game.short_code}
    </div>
  );
};
