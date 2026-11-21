import React, { useEffect, useRef } from 'react';
import { X, AlertTriangle, Trash2, FileInput } from 'lucide-react';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Enter' && !isLoading) {
        onConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm, isLoading]);

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

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      border: 'border-red-500/30',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      confirmBg: 'bg-red-500 hover:bg-red-400 text-white',
      confirmHover: 'hover:bg-red-400',
    },
    warning: {
      border: 'border-yellow-500/30',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
      confirmBg: 'bg-yellow-500 hover:bg-yellow-400 text-black',
      confirmHover: 'hover:bg-yellow-400',
    },
    info: {
      border: 'border-[#93F1F7]/30',
      iconBg: 'bg-[#93F1F7]/20',
      iconColor: 'text-[#93F1F7]',
      confirmBg: 'bg-[#93F1F7] hover:bg-[#7ddbd2] text-black',
      confirmHover: 'hover:bg-[#7ddbd2]',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-gy-drawer-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={(e) => {
        if (e.target === overlayRef.current) {
          onClose();
        }
      }}
      ref={overlayRef}
    >
      <div
        ref={contentRef}
        className={`w-full max-w-[480px] mx-4 bg-gy-surface border ${styles.border} rounded-gyMd overflow-hidden animate-gy-drawer-open`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gy-border">
          <div className="flex items-start gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-gySm ${styles.iconBg} flex-shrink-0`}>
              {variant === 'danger' && <Trash2 className={`w-5 h-5 ${styles.iconColor}`} />}
              {variant === 'warning' && <AlertTriangle className={`w-5 h-5 ${styles.iconColor}`} />}
              {variant === 'info' && <FileInput className={`w-5 h-5 ${styles.iconColor}`} />}
            </div>
            <div>
              <h2 id="confirm-modal-title" className="font-display font-bold text-base text-gy-ink">
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
        <div className="p-5">
          <p className="text-sm text-gy-muted leading-relaxed whitespace-pre-wrap">
            {message}
          </p>
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
            onClick={onConfirm}
            disabled={isLoading}
            className={`min-h-[44px] px-5 py-2 rounded-gySm font-sans text-sm font-medium cursor-pointer transition-colors ${styles.confirmBg} disabled:opacity-50 disabled:cursor-not-allowed`}
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