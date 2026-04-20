import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import {
    Phone, PhoneOff, Video, CameraOff,
    ChevronRight, ChevronLeft
} from 'lucide-react';
import Styles from './VideoIncoming.module.css';
import useSoundEffect from '../../../hooks/useSoundEffect';

const videoConstraints = {
    facingMode: "user",
    width: { ideal: 1280 },
    height: { ideal: 720 }
};

const VideoIncoming = forwardRef(({ callerInfo, onAccept, onDecline }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isCamLoading, setIsCamLoading] = useState(true);
    const [isSelfMinimized, setIsSelfMinimized] = useState(false);
    const { startRinging, stopRinging } = useSoundEffect('/SoundEffect/incoming-call.mp3', { loop: true, volume: 1 });

    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const startCameraPreview = async () => {
        setIsCamLoading(true);
        try {
            const vs = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
            streamRef.current = new MediaStream([vs.getVideoTracks()[0]]);

            if (videoRef.current) {
                videoRef.current.srcObject = streamRef.current;
                videoRef.current.onloadedmetadata = () => setIsCamLoading(false);
            }
        } catch (err) {
            console.warn('VideoIncoming – không mở được camera:', err);
            setIsCamLoading(false);
            setIsCameraOn(false);
        }
    };

    const stopCameraPreview = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
    };

    const handleAccept = () => {
        stopCameraPreview();
        stopRinging();
        setIsVisible(false);
        if (onAccept) onAccept();
    };

    const handleDecline = () => {
        stopCameraPreview();
        stopRinging();
        setIsVisible(false);
        if (onDecline) onDecline();
    };

    useImperativeHandle(ref, () => ({
        showCall: () => {
            setIsVisible(true);
            setIsCameraOn(true);
            setIsSelfMinimized(false);
            startCameraPreview();
            startRinging();
        },
        hideCall: () => {
            stopCameraPreview();
            stopRinging();
            setIsVisible(false);
        }
    }));

    useEffect(() => () => stopCameraPreview(), []);

    if (!isVisible) return null;

    const contactName = callerInfo?.name;
    const avatar = callerInfo?.avatar;

    return (
        <div className={Styles.videoContainer}>

            <div className={`${Styles.selfCameraWrapper} ${isSelfMinimized ? Styles.minimized : ''}`}>
                <button
                    className={Styles.toggleMinimizeBtn}
                    onClick={() => setIsSelfMinimized(p => !p)}
                    title={isSelfMinimized ? 'Hiện camera' : 'Ẩn camera'}
                >
                    {isSelfMinimized
                        ? <ChevronLeft size={20} color="#1B1E2E" />
                        : <ChevronRight size={20} color="#1B1E2E" />}
                </button>

                <div className={`${Styles.selfCamera} glass-panel`}>
                    {isCamLoading && isCameraOn && (
                        <div className={`${Styles.cameraPlaceholder} pulse-wave`}>
                            Camera bản thân
                        </div>
                    )}

                    <video
                        ref={videoRef}
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

            <div className={Styles.callerInfo}>
                <div className={Styles.avatarWrapper}>
                    {avatar
                        ? <img src={avatar} alt="avatar" className={Styles.avatar} />
                        : <div className={Styles.avatarPlaceholder} />}
                </div>

                <h2 className={Styles.name}>{contactName}</h2>
                <p className={`${Styles.status} pulse-wave`}>Cuộc gọi video đến...</p>
            </div>

            <div className={`${Styles.controlsWrapper} glass-panel`}>
                {/* Nhận */}
                <div className={Styles.btnGroup}>
                    <button
                        id="video-incoming-accept"
                        className={`${Styles.controlBtn} ${Styles.acceptCallBtn}`}
                        onClick={handleAccept}
                        title="Nhận cuộc gọi video"
                    >
                        <Video size={24} color="#ffffff" />
                    </button>
                    <span className={Styles.btnLabel}>Nhận</span>
                </div>

                {/* Từ chối */}
                <div className={Styles.btnGroup}>
                    <button
                        id="video-incoming-decline"
                        className={`${Styles.controlBtn} ${Styles.endCallBtn}`}
                        onClick={handleDecline}
                        title="Từ chối"
                    >
                        <PhoneOff size={24} color="#ffffff" />
                    </button>
                    <span className={Styles.btnLabel}>Từ chối</span>
                </div>
            </div>
        </div>
    );
});

export default VideoIncoming;
