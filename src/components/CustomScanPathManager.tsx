import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Trash2, Check } from 'lucide-react';
import { CustomScanPath } from '../types/game';
import {
  ipcAddCustomScanPath,
  ipcRemoveCustomScanPath,
  ipcListCustomScanPaths,
  ipcSetCustomScanPathEnabled,
} from '../services/tauriBridge';

interface CustomScanPathManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onPathsChanged: () => void;
  embedded?: boolean;
}

export const CustomScanPathManager: React.FC<CustomScanPathManagerProps> = ({
  isOpen,
  onClose,
  onPathsChanged,
  embedded = false,
}) => {
  const [paths, setPaths] = useState<CustomScanPath[]>([]);
  const [newPath, setNewPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPaths = async () => {
    try {
      const loadedPaths = await ipcListCustomScanPaths();
      setPaths(loadedPaths);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Failed to load paths: ${msg}`);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPaths();
      setNewPath('');
      setError(null);
    }
  }, [isOpen]);

  const handleAddPath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPath.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      await ipcAddCustomScanPath(newPath.trim());
      setNewPath('');
      await loadPaths();
      onPathsChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Failed to add path: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePath = async (id: number) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await ipcRemoveCustomScanPath(id);
      await loadPaths();
      onPathsChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Failed to remove path: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnabled = async (id: number, currentEnabled: boolean) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await ipcSetCustomScanPathEnabled(id, !currentEnabled);
      await loadPaths();
      onPathsChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Failed to toggle path: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen && !embedded) return null;

  const modalContent = (
    <div className={embedded ? "w-full flex flex-col h-full overflow-hidden" : "bg-gy-surface border border-gy-border rounded-gyMd w-full max-w-[720px] mx-4 flex flex-col max-h-[80vh] overflow-hidden"}>
        {/* Header */}
        {!embedded && (
          <div className="flex items-center justify-between p-6 border-b border-gy-border">
            <div>
              <h2 className="font-display font-bold text-[20px] leading-[28px] text-gy-ink">
                Custom Scan Paths
              </h2>
              <p className="font-mono text-[11px] text-gy-muted mt-1">
                Add folders to scan for .exe games during drive scan
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] rounded-gySm bg-gy-elevated border border-gy-border text-gy-muted hover:text-gy-ink hover:border-gy-muted active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Add Path Form */}
        <div className="p-6 border-b border-gy-border">
          <form onSubmit={handleAddPath} className="flex gap-3">
            <input
              type="text"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              placeholder="D:\Games\CustomFolder"
              disabled={isLoading}
              className="flex-1 min-h-[44px] px-4 bg-gy-bg border border-gy-border rounded-gySm font-mono text-xs text-gy-ink placeholder:text-gy-muted focus:border-[#93F1F7] focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !newPath.trim()}
              className="min-h-[44px] px-4 rounded-gySm bg-gy-accent text-gy-accent-ink font-semibold text-sm flex items-center gap-2 hover:opacity-95 active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Add Path</span>
            </button>
          </form>

          {error && (
            <div className="mt-3 px-3 py-2 bg-[#17120A] border border-[#92400E] rounded-gySm text-xs text-gy-warning font-mono">
              {error}
            </div>
          )}
        </div>

        {/* Paths List */}
        <div className="flex-1 overflow-y-auto p-6">
          {paths.length === 0 ? (
            <div className="text-center py-8">
              <FolderPlus className="w-8 h-8 text-gy-muted mx-auto mb-3 opacity-40" />
              <p className="text-sm text-gy-muted">
                No custom scan paths added yet
              </p>
              <p className="text-xs text-gy-muted mt-1 font-mono">
                Add folders above to include them in drive scans
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {paths.map((path) => (
                <div
                  key={path.id}
                  className="bg-gy-bg border border-gy-border rounded-gySm p-3 flex items-center gap-3"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleEnabled(path.id, path.enabled)}
                    disabled={isLoading}
                    className={`min-h-[40px] min-w-[40px] rounded-gySm border flex items-center justify-center cursor-pointer transition-all active:scale-[0.95] disabled:opacity-50 ${
                      path.enabled
                        ? 'bg-[#0F1D22] border-[#21424D] text-[#93F1F7]'
                        : 'bg-gy-elevated border-gy-border text-gy-muted'
                    }`}
                    title={path.enabled ? 'Enabled (click to disable)' : 'Disabled (click to enable)'}
                  >
                    <Check className="w-4 h-4" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-mono text-xs truncate ${
                        path.enabled ? 'text-gy-ink' : 'text-gy-muted'
                      }`}
                      title={path.path}
                    >
                      {path.path}
                    </div>
                    <div className="font-mono text-[10px] text-gy-muted mt-0.5">
                      Added {new Date(path.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemovePath(path.id)}
                    disabled={isLoading}
                    className="min-h-[40px] min-w-[40px] rounded-gySm bg-gy-elevated border border-gy-border text-gy-muted hover:text-gy-warning hover:border-gy-warning active:scale-[0.95] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                    title="Remove path"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gy-border bg-gy-elevated">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#93F1F7] mt-1.5 shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gy-ink font-medium">
                Enabled paths are scanned automatically during drive scans
              </p>
              <p className="text-[10px] text-gy-muted font-mono mt-1">
                Recursive scan up to 3 levels deep | .exe files only
              </p>
            </div>
          </div>
        </div>
      </div>
  );

  if (embedded) {
    return modalContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-gy-drawer-open">
      {modalContent}
    </div>
  );
};
