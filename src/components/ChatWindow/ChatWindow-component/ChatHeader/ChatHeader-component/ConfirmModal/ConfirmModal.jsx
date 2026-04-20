import React from 'react';
import Styles from './ConfirmModal.module.css';


const ConfirmModal = ({ title, message, confirmLabel = 'Xác nhận', isLoading = false, onConfirm, onCancel }) => {
    return (
        <div className={Styles.modalOverlay} onClick={onCancel}>
            <div className={Styles.modalBox} onClick={(e) => e.stopPropagation()}>
                <h3 className={Styles.modalTitle}>{title}</h3>
                <p className={Styles.modalText}>{message}</p>
                <div className={Styles.modalActions}>
                    <button className={Styles.btnCancel} onClick={onCancel} disabled={isLoading}>
                        Huỷ
                    </button>
                    <button className={Styles.btnDanger} onClick={onConfirm} disabled={isLoading}>
                        {isLoading ? 'Đang xử lý...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
