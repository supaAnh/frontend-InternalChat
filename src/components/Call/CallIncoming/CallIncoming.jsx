import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import Styles from './CallIncoming.module.css';
import '../../../index.css';
import useSoundEffect from '../../../hooks/useSoundEffect';
import { getAvatarUrl } from '../../../config/api';

const CallIncoming = forwardRef(({ callerInfo, isVideoCall, onAccept, onDecline }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const { startRinging, stopRinging } = useSoundEffect('/SoundEffect/incoming-call.mp3', { loop: true, volume: 1 });

    useImperativeHandle(ref, () => ({
        showCall: () => {
            setIsVisible(true);
            startRinging();
        },
        hideCall: () => {
            stopRinging();
            setIsVisible(false);
        }
    }));

    if (!isVisible) return null;

    const contactName = callerInfo?.name;
    const avatar = callerInfo?.avatar;

    const handleAccept = () => {
        stopRinging();
        setIsVisible(false);
        if (onAccept) onAccept();
    };

    const handleDecline = () => {
        stopRinging();
        setIsVisible(false);
        if (onDecline) onDecline();
    };

    return (
        <div className={Styles.callContainer}>
            <div className={Styles.callerInfo}>
                <div className={Styles.avatarWrapper}>
                    {avatar ? (
                        <img src={getAvatarUrl(avatar)} alt="avatar" className={Styles.avatar} />
                    ) : (
                        <div className={Styles.avatarPlaceholder}></div>
                    )}
                </div>
                <h2 className={Styles.name}>{contactName}</h2>

                <p className={`${Styles.status} pulse-wave`}>
                    {isVideoCall ? "Cuộc gọi video đến..." : "Cuộc gọi đến..."}
                </p>
            </div>

            <div className={`${Styles.controlsWrapper} glass-panel`}>
                <button
                    className={`${Styles.controlBtn} ${Styles.acceptCallBtn}`}
                    onClick={handleAccept}
                    title="Trả lời"
                >
                    {isVideoCall ? (
                        <Video size={24} color="#ffffff" />
                    ) : (
                        <Phone size={24} color="#ffffff" />
                    )}
                </button>

                <button
                    className={`${Styles.controlBtn} ${Styles.endCallBtn}`}
                    onClick={handleDecline}
                    title="Từ chối"
                >
                    <PhoneOff size={24} color="#ffffff" />
                </button>
            </div>
        </div>
    );
});

export default CallIncoming;