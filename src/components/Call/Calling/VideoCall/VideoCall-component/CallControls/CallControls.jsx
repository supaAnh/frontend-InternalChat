import React from 'react';
import Styles from './CallControls.module.css';
import { Volume2, VolumeX, Mic, MicOff, PhoneOff, Camera, CameraOff, SwitchCamera } from 'lucide-react';

const CallControls = ({
    isSpeakerOn,
    isMuted,
    isCameraOn,
    onToggleSpeaker,
    onToggleMute,
    onEndCall,
    onToggleCamera,
    onSwitchCamera,
}) => {
    return (
        <div className={`${Styles.controlsWrapper} glass-panel`}>
            <button
                className={`${Styles.controlBtn} ${!isSpeakerOn ? Styles.btnOff : ''}`}
                onClick={onToggleSpeaker}
                title="Loa ngoài"
            >
                {isSpeakerOn
                    ? <Volume2 size={20} color="#1B1E2E" />
                    : <VolumeX size={20} color="#ffffff" />}
            </button>

            <button
                className={`${Styles.controlBtn} ${isMuted ? Styles.btnOff : ''}`}
                onClick={onToggleMute}
                title="Tắt/Bật Mic"
            >
                {isMuted
                    ? <MicOff size={20} color="#ffffff" />
                    : <Mic size={20} color="#1B1E2E" />}
            </button>

            <button
                className={`${Styles.controlBtn} ${Styles.endCallBtn}`}
                onClick={onEndCall}
                title="Kết thúc"
            >
                <PhoneOff size={20} color="#ffffff" />
            </button>

            <button
                className={`${Styles.controlBtn} ${!isCameraOn ? Styles.btnOff : ''}`}
                onClick={onToggleCamera}
                title="Tắt/Bật Camera"
            >
                {isCameraOn
                    ? <Camera size={20} color="#1B1E2E" />
                    : <CameraOff size={20} color="#ffffff" />}
            </button>

            <button
                className={Styles.controlBtn}
                onClick={onSwitchCamera}
                title="Đổi Camera"
            >
                <SwitchCamera size={20} color="#1B1E2E" />
            </button>
        </div>
    );
};

export default CallControls;
