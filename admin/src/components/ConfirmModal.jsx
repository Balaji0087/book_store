import React, { useState, useEffect } from 'react';
import { styles } from '../assets/dummyStyles';

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
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className={`${styles.modalContainer} transform transition-all duration-200 ease-out ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>{title}</h3>
            {description && <p className={styles.modalSubtitle}>{description}</p>}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <div className="w-full flex justify-center gap-4">
            <button type="button" onClick={onCancel} className={styles.modalCancelButton} disabled={loading}>
              {cancelLabel}
            </button>

            <button type="button" onClick={onConfirm} className={styles.modalConfirmButton} disabled={loading}>
              {loading ? 'Processing...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
