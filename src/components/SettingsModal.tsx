import React, { useState } from 'react';
import { X, FolderPlus, Info, Award, Tag } from 'lucide-react';
import { CustomScanPathManager } from './CustomScanPathManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPathsChanged: () => void;
}

type SettingsTab = 'scan-paths' | 'about' | 'credits';

const APP_VERSION = '0.2.0';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onPathsChanged,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('scan-paths');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-gy-drawer-open">
      <div className="bg-gy-surface border border-gy-border rounded-gyMd w-full max-w-[720px] mx-4 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gy-border">
          <div>
            <h2 className="font-display font-bold text-[20px] leading-[28px] text-gy-ink">
              Settings & Info
            </h2>
            <p className="font-mono text-[11px] text-gy-muted mt-1">
              Configure scan paths, view system information and credits
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-gy-border bg-gy-elevated/50 px-6 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('scan-paths')}
            className={`min-h-[44px] px-4 font-sans text-xs font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'scan-paths'
                ? 'border-[#93F1F7] text-[#93F1F7]'
                : 'border-transparent text-gy-muted hover:text-gy-ink'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Custom Scan Paths</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`min-h-[44px] px-4 font-sans text-xs font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'about'
                ? 'border-[#93F1F7] text-[#93F1F7]'
                : 'border-transparent text-gy-muted hover:text-gy-ink'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>About</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('credits')}
            className={`min-h-[44px] px-4 font-sans text-xs font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'credits'
                ? 'border-[#93F1F7] text-[#93F1F7]'
                : 'border-transparent text-gy-muted hover:text-gy-ink'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Credits</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'scan-paths' && (
            <CustomScanPathManager
              isOpen={true}
              onClose={() => {}}
              onPathsChanged={onPathsChanged}
              embedded={true}
            />
          )}

          {activeTab === 'about' && (
            <div className="p-6 space-y-6">
              <div className="bg-gy-bg border border-gy-border rounded-gySm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gy-border pb-4">
                  <div>
                    <h3 className="font-display font-bold text-lg text-gy-ink">
                      GameYard Launcher
                    </h3>
                    <p className="font-mono text-xs text-gy-muted mt-0.5">
                      Unified Desktop PC Game Launcher & Library Manager
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-gySm bg-gy-surface border border-gy-border font-mono text-xs text-[#93F1F7]">
                    <Tag className="w-3.5 h-3.5" />
                    <span>v{APP_VERSION}</span>
                  </div>
                </div>

                <div className="text-xs text-gy-muted space-y-2 leading-relaxed">
                  <p>
                    GameYard is a lightweight, high-speed PC game launcher built using Tauri v2, Rust, React, and SQLite WAL.
                    Designed under strict utilitarian principles to provide an instant, zero-bloat overview of your local and cloud library.
                  </p>
                  <p>
                    Key features include silent launcher URI protocols, direct executable import, auto-kill background processes with a 5s grace period, and Candy-on-Black UI.
                  </p>
                </div>
              </div>

              {/* Technical Spec Summary */}
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-gy-bg border border-gy-border rounded-gySm p-3">
                  <div className="text-gy-muted text-[10px] uppercase">Framework</div>
                  <div className="text-gy-ink font-semibold mt-1">Tauri v2 + Rust</div>
                </div>
                <div className="bg-gy-bg border border-gy-border rounded-gySm p-3">
                  <div className="text-gy-muted text-[10px] uppercase">UI Stack</div>
                  <div className="text-gy-ink font-semibold mt-1">React 19 + Tailwind</div>
                </div>
                <div className="bg-gy-bg border border-gy-border rounded-gySm p-3">
                  <div className="text-gy-muted text-[10px] uppercase">Database</div>
                  <div className="text-gy-ink font-semibold mt-1">SQLite WAL</div>
                </div>
                <div className="bg-gy-bg border border-gy-border rounded-gySm p-3">
                  <div className="text-gy-muted text-[10px] uppercase">Font System</div>
                  <div className="text-gy-ink font-semibold mt-1">Native System UI</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'credits' && (
            <div className="p-6 space-y-4">
              <div className="bg-gy-bg border border-gy-border rounded-gySm p-5 space-y-3">
                <h3 className="font-display font-bold text-sm text-gy-ink uppercase tracking-tight">
                  DEVELOPMENT & DESIGN
                </h3>
                <div className="space-y-2 text-xs text-gy-muted">
                  <div className="flex justify-between border-b border-gy-border/50 pb-2">
                    <span className="text-gy-ink font-semibold">Author / Creator</span>
                    <span className="font-mono">Steven Nathanael</span>
                  </div>
                  <div className="flex justify-between border-b border-gy-border/50 pb-2">
                    <span className="text-gy-ink font-semibold">Design System</span>
                    <span className="font-mono">Candy-on-Black (B01-V3)</span>
                  </div>
                  <div className="flex justify-between border-b border-gy-border/50 pb-2">
                    <span className="text-gy-ink font-semibold">Version</span>
                    <span className="font-mono text-[#93F1F7]">v{APP_VERSION}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-gy-ink font-semibold">Repository</span>
                    <span className="font-mono text-[#93F1F7]">github.com/StevNath/GameYard</span>
                  </div>
                </div>
              </div>

              <div className="bg-gy-bg border border-gy-border rounded-gySm p-5 space-y-3">
                <h3 className="font-display font-bold text-sm text-gy-ink uppercase tracking-tight">
                  OPEN SOURCE LIBRARIES
                </h3>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-gy-muted">
                  <div>• Tauri Framework v2</div>
                  <div>• Lucide React Icons</div>
                  <div>• Zustand State Engine</div>
                  <div>• Rusqlite (SQLite3)</div>
                  <div>• Tailwind CSS</div>
                  <div>• Vite Build Tool</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gy-border bg-gy-elevated flex items-center justify-between text-xs font-mono text-gy-muted">
          <div>GameYard &copy; 2026 Steven Nathanael</div>
          <div>Version {APP_VERSION}</div>
        </div>
      </div>
    </div>
  );
};