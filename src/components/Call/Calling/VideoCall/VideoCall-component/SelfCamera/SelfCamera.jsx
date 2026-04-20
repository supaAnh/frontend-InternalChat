import React from 'react';
import Styles from './SelfCamera.module.css';
import { CameraOff, ChevronRight, ChevronLeft } from 'lucide-react';

const SelfCamera = ({ selfVideoRef, isCameraOn, isCamLoading, isSelfMinimized, onToggleMinimize }) => {
    return (
        <div className={`${Styles.selfCameraWrapper} ${isSelfMinimized ? Styles.minimized : ''}`}>
            <button
                className={Styles.toggleMinimizeBtn}
                onClick={onToggleMinimize}
                title={isSelfMinimized ? 'Hiện camera' : 'Ẩn camera'}
            >
                {isSelfMinimized
                    ? <ChevronLeft size={20} color="#1B1E2E" />
                    : <ChevronRight size={20} color="#1B1E2E" />}
            </button>

            <div className={`${Styles.selfCamera} glass-panel`}>
                {isCamLoading && isCameraOn && (
                    <div className={`${Styles.cameraPlaceholder} pulse-wave`}>Đang mở Cam...</div>
                )}
                <video
                    ref={selfVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={Styles.videoElement}
                    style={{ display: (isCameraOn && !isCamLoading) ? 'block' : 'none' }}
                />
                {!isCameraOn && (
                    <div className={Styles.cameraOffPlaceholder}>
                        <CameraOff size={28} color="#8B8D93" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SelfCamera;
