import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import Styles from './VideoCall.module.css';
import CallHUD from './VideoCall-component/CallHUD/CallHUD';
import SelfCamera from './VideoCall-component/SelfCamera/SelfCamera';
import RemoteGrid from './VideoCall-component/RemoteGrid/RemoteGrid';
import CallControls from './VideoCall-component/CallControls/CallControls';

const VideoCall = forwardRef(({ currentChat, remoteStreams, localStream, currentUser, activeCallParticipants, isGroup = false, onReplaceVideoTrack, onEndCall }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [facingMode, setFacingMode] = useState("user");
    const [isSelfMinimized, setIsSelfMinimized] = useState(false);
    const [isCamLoading, setIsCamLoading] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const getDynamicConstraints = (mode) => ({
        video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    });

    // Danh sách người tham gia remote
    const participantsRaw = isGroup ? activeCallParticipants : [currentChat];
    const participants = participantsRaw.filter(p => {
        if (!p) return false;
        const pId = String(p.id || p._id);
        const myId = String(currentUser?.id || currentUser?._id);
        return pId !== myId;
    });

    // local video
    const selfVideoRef = useRef(null);
    const selfStreamRef = useRef(null);
    const remoteVideoRefs = useRef({});
    const timerRef = useRef(null);

    // ====== TIMER ======
    const startTimer = () => {
        setCallDuration(0);
        timerRef.current = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // ====== LOCAL CAMERA ======
    const startSelfCamera = async () => {
        setIsCamLoading(true);
        try {
            const videoStream = await navigator.mediaDevices.getUserMedia(getDynamicConstraints(facingMode));
            selfStreamRef.current = new MediaStream([videoStream.getVideoTracks()[0]]);

            if (selfVideoRef.current) {
                selfVideoRef.current.srcObject = selfStreamRef.current;
                selfVideoRef.current.onloadedmetadata = () => setIsCamLoading(false);
            }
        } catch (err) {
            console.error('Lỗi mở Camera:', err);
            setIsCamLoading(false);
        }
    };

    const stopSelfCamera = () => {
        if (selfStreamRef.current) {
            selfStreamRef.current.getTracks().forEach(t => t.stop());
            selfStreamRef.current = null;
        }
    };

    // ====== TOGGLE CAMERA ======
    const handleToggleCamera = async () => {
        if (isCameraOn) {
            // Tắt camera đối với đối phương (WebRTC)
            if (localStream) {
                localStream.getVideoTracks().forEach(t => { t.enabled = false; });
            }
            // Tắt camera preview bản thân
            selfStreamRef.current?.getVideoTracks().forEach(t => { t.stop(); selfStreamRef.current?.removeTrack(t); });
            setIsCameraOn(false);
        } else {
            setIsCamLoading(true);
            setIsCameraOn(true);
            try {
                // Bật lại camera đối với đối phương (WebRTC)
                if (localStream) {
                    localStream.getVideoTracks().forEach(t => { t.enabled = true; });
                }
                const ns = await navigator.mediaDevices.getUserMedia(getDynamicConstraints(facingMode));
                const nv = ns.getVideoTracks()[0];
                if (selfStreamRef.current) selfStreamRef.current.addTrack(nv);
                else selfStreamRef.current = ns;

                if (selfVideoRef.current) {
                    selfVideoRef.current.srcObject = selfStreamRef.current;
                    selfVideoRef.current.onloadedmetadata = () => setIsCamLoading(false);
                }
            } catch (err) {
                console.error('Lỗi bật lại Camera:', err);
                setIsCamLoading(false);
                setIsCameraOn(false);
            }
        }
    };

    // ====== ĐỔI CAMERA TRƯỚC/SAU ======
    const handleSwitchCamera = async () => {
        setIsCamLoading(true);
        const newMode = facingMode === "user" ? "environment" : "user";
        setFacingMode(newMode);

        try {
            const ns = await navigator.mediaDevices.getUserMedia(getDynamicConstraints(newMode));
            const previewTrack = ns.getVideoTracks()[0];
            const webrtcTrack = previewTrack.clone();

            // Đổi track preview
            if (selfStreamRef.current) {
                selfStreamRef.current.getVideoTracks().forEach(t => { t.stop(); selfStreamRef.current.removeTrack(t); });
                selfStreamRef.current.addTrack(previewTrack);
            } else {
                selfStreamRef.current = new MediaStream([previewTrack]);
            }

            if (selfVideoRef.current) {
                selfVideoRef.current.srcObject = selfStreamRef.current;
                selfVideoRef.current.onloadedmetadata = () => setIsCamLoading(false);
            }

            // Gửi callback thay track RTCPeerConnection bên Mainpage
            if (onReplaceVideoTrack) onReplaceVideoTrack(webrtcTrack);

            // Phục hồi lại nút toggle cam (nếu đang bị tắt cam)
            if (!isCameraOn) {
                if (localStream) localStream.getVideoTracks().forEach(t => { t.enabled = true; });
                setIsCameraOn(true);
            }
        } catch (err) {
            console.error('Lỗi chuyển Camera:', err);
            setIsCamLoading(false);
        }
    };

    // ====== TOGGLE MIC ======
    const handleToggleMute = () => {
        const next = !isMuted;
        if (localStream) {
            localStream.getAudioTracks().forEach(t => { t.enabled = !next; });
        }
        setIsMuted(next);
    };

    // ====== END CALL ======
    const handleEndCall = () => {
        stopTimer();
        stopSelfCamera();
        setIsVisible(false);
        if (onEndCall) onEndCall(callDuration);
    };

    // ====== TOGGLE FULLSCREEN ======
    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
                .then(() => setIsFullscreen(true))
                .catch(() => {});
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen()
                    .then(() => setIsFullscreen(false))
                    .catch(() => {});
            }
        }
    };

    // Stream khi remoteStreams thay đổi
    useEffect(() => {
        if (!remoteStreams) return;
        Object.entries(remoteStreams).forEach(([userId, stream]) => {
            const el = remoteVideoRefs.current[userId];
            if (el) {
                if (el.srcObject !== stream) {
                    el.srcObject = stream;
                }
                el.play().catch(() => {});
            }
        });
    }, [remoteStreams, participants.length]);

    useEffect(() => {
        Object.values(remoteVideoRefs.current).forEach(el => {
            if (el) el.muted = !isSpeakerOn;
        });
    }, [isSpeakerOn]);

    useImperativeHandle(ref, () => ({
        startCall: () => {
            setIsVisible(true);
            setIsMuted(false);
            setIsSpeakerOn(true);
            setIsCameraOn(true);
            setIsSelfMinimized(false);
            setCallDuration(0);
            startTimer();
            startSelfCamera();
        },
        endCall: () => handleEndCall(),
        forceEnd: () => {
            stopTimer();
            stopSelfCamera();
            setIsVisible(false);
        }
    }));

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            stopTimer();
            stopSelfCamera();
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div className={`${Styles.videoContainer} ${isFullscreen ? Styles.fullscreen : ''}`}>

            {/* Timer + Fullscreen */}
            <CallHUD
                callDuration={callDuration}
                isFullscreen={isFullscreen}
                onToggleFullscreen={handleToggleFullscreen}
            />

            {/* Local camera preview */}
            <SelfCamera
                selfVideoRef={selfVideoRef}
                isCameraOn={isCameraOn}
                isCamLoading={isCamLoading}
                isSelfMinimized={isSelfMinimized}
                onToggleMinimize={() => setIsSelfMinimized(p => !p)}
            />

            {/* Remote participants grid */}
            <RemoteGrid
                participants={participants}
                remoteStreams={remoteStreams}
                remoteVideoRefs={remoteVideoRefs}
            />

            {/* Controls bar */}
            <CallControls
                isSpeakerOn={isSpeakerOn}
                isMuted={isMuted}
                isCameraOn={isCameraOn}
                onToggleSpeaker={() => setIsSpeakerOn(s => !s)}
                onToggleMute={handleToggleMute}
                onEndCall={handleEndCall}
                onToggleCamera={handleToggleCamera}
                onSwitchCamera={handleSwitchCamera}
            />
        </div>
    );
});

export default VideoCall;
