import React, { useEffect, useRef, useState } from 'react';
import { X, Edit2 } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message: string;
  placeholder: string;
  defaultValue: string;
  confirmText: string;
  cancelText?: string;
  isLoading?: boolean;
  validation?: (value: string) => string | null; // Returns error message or null if valid
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  placeholder,
  defaultValue,
  confirmText,
  cancelText = 'Cancel',
  isLoading = false,
  validation,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, defaultValue]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Enter' && !isLoading && !error) {
        onConfirm(value.trim());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm, value, isLoading, error]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (validation) {
      const err = validation(newValue);
      setError(err);
    } else {
      setError(null);
    }
  };

  const handleConfirm = () => {
    if (!error && value.trim() && !isLoading) {
      onConfirm(value.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-gy-drawer-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-modal-title"
      onClick={(e) => {
        if (e.target === overlayRef.current) {
          onClose();
        }
      }}
      ref={overlayRef}
    >
      <div
        className="w-full max-w-[480px] mx-4 bg-gy-surface border border-gy-border rounded-gyMd overflow-hidden animate-gy-drawer-open"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gy-border">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-gySm bg-[#93F1F7]/20 flex-shrink-0">
              <Edit2 className="w-5 h-5 text-[#93F1F7]" />
            </div>
            <div>
              <h2 id="prompt-modal-title" className="font-display font-bold text-base text-gy-ink">
                {title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="min-h-[44px] min-w-[44px] rounded-gySm bg-gy-elevated border border-gy-border text-gy-muted hover:text-gy-ink hover:border-gy-muted active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {message && (
            <p className="text-sm text-gy-muted leading-relaxed">
              {message}
            </p>
          )}
          <div className="space-y-2">
            <label htmlFor="prompt-input" className="block font-sans text-xs font-medium text-gy-muted">
              {placeholder}
            </label>
            <input
              ref={inputRef}
              id="prompt-input"
              type="text"
              value={value}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full min-h-[44px] px-4 py-2.5 rounded-gySm bg-gy-bg border font-sans text-sm text-gy-ink placeholder-gy-muted transition-colors ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-gy-border focus:border-[#93F1F7] focus:ring-1 focus:ring-[#93F1F7]'
              }`}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'prompt-error' : undefined}
            />
            {error && (
              <p id="prompt-error" className="text-xs text-red-400" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gy-border bg-gy-elevated/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="min-h-[44px] px-5 py-2 rounded-gySm bg-gy-elevated border border-gy-border text-gy-ink font-sans text-sm font-medium cursor-pointer hover:bg-gy-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || !value.trim() || !!error}
            className={`min-h-[44px] px-5 py-2 rounded-gySm font-sans text-sm font-medium cursor-pointer transition-colors bg-[#93F1F7] hover:bg-[#7ddbd2] text-black disabled:opacity-50 disabled:cursor-not-allowed ${
              !value.trim() || !!error ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};