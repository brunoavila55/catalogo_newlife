import { useEffect, useRef } from 'react';
import FocusTrap from 'focus-trap-react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isLoading = false
}: ConfirmModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <FocusTrap focusTrapOptions={{ initialFocus: false, fallbackFocus: () => cancelBtnRef.current! }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => !isLoading && onCancel()}
        />
        
        {/* Modal Content */}
        <div className="relative bg-slate-900 border border-slate-800 shadow-2xl rounded-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
          <button 
            onClick={onCancel}
            disabled={isLoading}
            className="absolute top-4 right-4 text-slate-400 hover:text-white disabled:opacity-50"
          >
            <X size={20} />
          </button>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">{title}</h3>
              <p className="text-slate-400 mt-2 text-sm">{message}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              ref={cancelBtnRef}
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}
