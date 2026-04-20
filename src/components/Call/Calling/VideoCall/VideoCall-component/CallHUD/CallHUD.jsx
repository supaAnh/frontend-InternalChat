import React from 'react';
import Styles from './CallHUD.module.css';
import { Maximize2, Minimize2 } from 'lucide-react';

const CallHUD = ({ callDuration, isFullscreen, onToggleFullscreen }) => {
    const formatDuration = (secs) => {
        const m = String(Math.floor(secs / 60)).padStart(2, '0');
        const s = String(secs % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className={Styles.hud}>
            <div className={Styles.callTimer}>{formatDuration(callDuration)}</div>
            <button
                className={Styles.fullscreenBtn}
                onClick={onToggleFullscreen}
                title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
                {isFullscreen
                    ? <Minimize2 size={18} color="#fff" />
                    : <Maximize2 size={18} color="#fff" />}
            </button>
        </div>
    );
};

export default CallHUD;
