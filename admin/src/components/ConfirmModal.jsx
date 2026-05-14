import React, { useState, useEffect } from 'react';

const ConfirmModal = ({
  isOpen,
  title = 'Confirm',
  description = '',
  onConfirm,
  onCancel,
  loading = false,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // trigger entrance animation after mount
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className={`bg-white shadow-xl rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-200 ease-out ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 p-6 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            {description && <p className="text-gray-600 text-sm mt-2">{description}</p>}
          </div>
        </div>

        <div className="p-6 flex justify-center gap-4">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors" disabled={loading}>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50" disabled={loading}>
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
