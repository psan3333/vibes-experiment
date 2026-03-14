'use client';

import * as React from 'react';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ 
    show, 
    onClose, 
    title,
    children
  }, ref: React.Ref<HTMLDivElement>) => {
    if (!show) {
      return null;
    }

    return (
      <div
        ref={ref}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <div 
          className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">{title}</h2>
            <button 
              className="rounded-full p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <div className="space-y-4">
            {children}
          </div>
        </div>
      </div>
    );
  }
);
Modal.displayName = 'Modal';