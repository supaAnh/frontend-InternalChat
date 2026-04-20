import React from 'react';
import ReactDOM from 'react-dom';
import { BadgeCheck, XCircle, AlertTriangle } from 'lucide-react';
import Styles from './Popup.module.css';
import '../../../index.css'; 

const PopupNotification = ({ 
    isOpen, 
    type = 'success', 
    title, 
    message, 
    onConfirm 
}) => {
    if (!isOpen) return null;

    const renderIcon = () => {
        switch (type) {
            case 'success':
                return <BadgeCheck size={55} fill="#10B981" color="#1B1E2E" />;
            case 'error':
                return <XCircle size={55} fill="#EF4444" color="#1B1E2E" />;
            case 'warning':
                return <AlertTriangle size={55} fill="#F59E0B" color="#1B1E2E" />;
            default:
                return <BadgeCheck size={55} fill="#10B981" color="#1B1E2E" />;
        }
    };

    return ReactDOM.createPortal(
        <div className={Styles.overlay}>
            <div className={`${Styles.popupBox} glass-panel`}>
                
                <div className={Styles.iconWrapper}>
                    {renderIcon()}
                </div>
                
                <h2 className={Styles.title}>{title}</h2>
                <p className={Styles.message}>{message}</p>
                
                <button className={Styles.confirmBtn} onClick={onConfirm}>
                    Xác nhận
                </button>

            </div>
        </div>,
        document.body
    );
};

export default PopupNotification;