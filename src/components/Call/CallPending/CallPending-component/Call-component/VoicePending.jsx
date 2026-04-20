import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Volume2, Mic, MicOff, PhoneOff } from 'lucide-react';
import Styles from './VoicePending.module.css';
import '../../../../../index.css';
import useSoundEffect from '../../../../../hooks/useSoundEffect';

const VoicePending = forwardRef(({ currentChat, onCancelCall }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const { startRinging, stopRinging } = useSoundEffect('/SoundEffect/pending-phone-call.mp3', { loop: true, volume: 0.85 });

    const handleEndCall = () => {
        stopRinging();
        setIsVisible(false);
        if (onCancelCall) {
            onCancelCall();
        }
    };

    const handleToggleMute = () => {
        setIsMuted(!isMuted);
    };

    useImperativeHandle(ref, () => ({
        startCall: () => {
            setIsVisible(true);
            setIsMuted(false);
            setIsSpeakerOn(true);
            startRinging();
        },
        forceEnd: () => {
            stopRinging();
            setIsVisible(false);
        }
    }));

    if (!isVisible) return null;

    const contactName = currentChat?.name || currentChat?.displayName || currentChat?.username || "Người dùng ẩn danh";
    const avatar = currentChat?.avatar;

    return (
        <div className={Styles.callContainer}>
            <div className={Styles.callerInfo}>
                <div className={Styles.avatarWrapper}>
                    {avatar ? (
                        <img src={avatar} alt="avatar" className={Styles.avatar} />
                    ) : (
                        <div className={Styles.avatarPlaceholder}></div>
                    )}
                </div>
                <h2 className={Styles.name}>{contactName}</h2>
                <p className={`${Styles.status} pulse-wave`}>Đang gọi...</p>
            </div>

            <div className={`${Styles.controlsWrapper} glass-panel`}>
                <button
                    className={`${Styles.controlBtn} ${!isSpeakerOn ? Styles.btnOff : ''}`}
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    title="Loa ngoài"
                >
                    <Volume2 size={24} color={isSpeakerOn ? "#1B1E2E" : "#ffffff"} />
                </button>

                <button
                    className={`${Styles.controlBtn} ${isMuted ? Styles.btnOff : ''}`}
                    onClick={handleToggleMute}
                    title="Tắt/Bật Mic"
                >
                    {isMuted ? <MicOff size={24} color="#ffffff" /> : <Mic size={24} color="#1B1E2E" />}
                </button>

                <button
                    className={`${Styles.controlBtn} ${Styles.endCallBtn}`}
                    onClick={handleEndCall}
                    title="Kết thúc"
                >
                    <PhoneOff size={24} color="#ffffff" />
                </button>
            </div>
        </div>
    );
});

export default VoicePending;