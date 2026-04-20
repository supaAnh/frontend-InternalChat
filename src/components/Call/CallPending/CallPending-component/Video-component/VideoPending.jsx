import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import {
    Volume2, Mic, MicOff, PhoneOff, Camera, CameraOff, SwitchCamera,
    ChevronRight, ChevronLeft
} from 'lucide-react';
import Styles from './VideoPending.module.css';
import '../../../../../index.css';
import useSoundEffect from '../../../../../hooks/useSoundEffect';

const videoConstraints = {
    facingMode: "user",
    width: 1280,
    height: 720
};

// 1. Thêm prop onCancelCall
const VideoPending = forwardRef(({ currentChat, isGroup = false, onCancelCall }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isSelfMinimized, setIsSelfMinimized] = useState(false);
    const [isCamLoading, setIsCamLoading] = useState(true);
    const { startRinging, stopRinging } = useSoundEffect('/SoundEffect/pending-phone-call.mp3', { loop: true, volume: 0.85 });

    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const startMediaStream = async () => {
        setIsCamLoading(true);
        try {
            // Gọi Video trước để hiển thị lên màn hình ngay lập tức
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });

            // Khởi tạo streamRef với Video Track
            streamRef.current = new MediaStream([videoStream.getVideoTracks()[0]]);

            if (videoRef.current) {
                videoRef.current.srcObject = streamRef.current;
                // Kích hoạt play ngay không chờ đợi lâu
                videoRef.current.play().catch(() => {});
                videoRef.current.onloadedmetadata = () => {
                    setIsCamLoading(false);
                };
            }

            // Gọi Audio ngầm ở background, không làm chậm việc hiển thị Video
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(audioStream => {
                    const audioTrack = audioStream.getAudioTracks()[0];
                    if (streamRef.current) {
                        streamRef.current.addTrack(audioTrack);
                        audioTrack.enabled = !isMuted;
                    }
                })
                .catch(() => {});

        } catch (error) {
            console.error("Lỗi khi truy cập Camera/Mic:", error);
            setIsCamLoading(false);
            alert("Không thể truy cập Camera. Vui lòng kiểm tra quyền trên trình duyệt!");
        }
    };

    // TẮT/BẬT CAMERA 
    const handleToggleCamera = async () => {
        if (isCameraOn) {
            if (streamRef.current) {
                streamRef.current.getVideoTracks().forEach(track => {
                    track.stop();
                    streamRef.current.removeTrack(track);
                });
            }
            setIsCameraOn(false);
        } else {
            setIsCamLoading(true);
            setIsCameraOn(true);

            try {
                // Chỉ xin lại quyền cho phần video dựa theo constraints tối ưu
                const newVideoStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
                const newVideoTrack = newVideoStream.getVideoTracks()[0];

                if (streamRef.current) {
                    streamRef.current.addTrack(newVideoTrack);
                } else {
                    streamRef.current = newVideoStream;
                }

                if (videoRef.current) {
                    videoRef.current.srcObject = streamRef.current;
                    videoRef.current.play().catch(() => {});
                    videoRef.current.onloadedmetadata = () => {
                        setIsCamLoading(false);
                    };
                }
            } catch (error) {
                console.error("Lỗi khi bật lại Camera:", error);
                setIsCamLoading(false);
                setIsCameraOn(false);
                alert("Không thể bật lại Camera!");
            }
        }
    };

    // TẮT/BẬT MIC ở cấp độ trình duyệt
    const handleToggleMute = () => {
        const newMutedState = !isMuted;

        if (streamRef.current) {
            // Lấy danh sách các track âm thanh
            const audioTracks = streamRef.current.getAudioTracks();

            if (audioTracks.length > 0) {
                audioTracks.forEach(track => {
                    track.enabled = !newMutedState; // false = trình duyệt ngắt thu âm
                });
            }
        }

        setIsMuted(newMutedState);
    };

    // Hàm tắt toàn bộ stream
    const stopMediaStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const handleEndCall = () => {
        stopRinging();
        setIsVisible(false);
        stopMediaStream();
        if (onCancelCall) {
            onCancelCall();
        }
    };

    useImperativeHandle(ref, () => ({
        startCall: () => {
            setIsVisible(true);
            setIsMuted(false);
            setIsSpeakerOn(true);
            setIsCameraOn(true);
            setIsSelfMinimized(false);
            startMediaStream();
            startRinging();
        },
        endCall: () => {
            handleEndCall();
        },
        forceEnd: () => {
            stopRinging();
            setIsVisible(false);
            stopMediaStream();
        }
    }));

    useEffect(() => {
        return () => {
            stopMediaStream();
        };
    }, []);

    if (!isVisible) return null;

    const participants = isGroup && currentChat?.members ? currentChat.members : [currentChat];

    return (
        <div className={Styles.videoContainer}>
            {/* Vùng Camera của bản thân có thể trượt ẩn đi */}
            <div className={`${Styles.selfCameraWrapper} ${isSelfMinimized ? Styles.minimized : ''}`}>
                <button
                    className={Styles.toggleMinimizeBtn}
                    onClick={() => setIsSelfMinimized(!isSelfMinimized)}
                    title={isSelfMinimized ? "Hiện camera" : "Ẩn camera"}
                >
                    {isSelfMinimized ? <ChevronLeft size={20} color="#1B1E2E" /> : <ChevronRight size={20} color="#1B1E2E" />}
                </button>

                <div className={`${Styles.selfCamera} glass-panel`}>

                    {isCamLoading && isCameraOn && (
                        <div className={`${Styles.cameraPlaceholder} pulse-wave`}>
                            Đang mở Cam...
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
                            <CameraOff size={32} color="#8B8D93" />
                        </div>
                    )}
                </div>
            </div>

            {/* Khung hiển thị người tham gia */}
            <div className={`${Styles.participantsGrid} ${participants.length > 1 ? Styles.groupGrid : ''}`}>
                {participants.map((p, index) => (
                    <div key={index} className={Styles.participantCard}>
                        <div className={Styles.avatarWrapper}>
                            {p?.avatar ? (
                                <img src={p.avatar} alt="avatar" className={Styles.avatar} />
                            ) : (
                                <div className={Styles.avatarPlaceholder}></div>
                            )}
                        </div>
                        <h2 className={Styles.name}>{p?.name || "Người dùng ẩn danh"}</h2>
                        <p className={`${Styles.status} pulse-wave`}>Đang gọi video...</p>
                    </div>
                ))}
            </div>

            {/* Thanh điều khiển */}
            <div className={`${Styles.controlsWrapper} glass-panel`}>
                <button
                    className={`${Styles.controlBtn} ${!isSpeakerOn ? Styles.btnOff : ''}`}
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    title="Loa ngoài"
                >
                    <Volume2 size={20} color={isSpeakerOn ? "#1B1E2E" : "#ffffff"} />
                </button>

                <button
                    className={`${Styles.controlBtn} ${isMuted ? Styles.btnOff : ''}`}
                    onClick={handleToggleMute}
                    title="Tắt/Bật Mic"
                >
                    {isMuted ? <MicOff size={20} color="#ffffff" /> : <Mic size={20} color="#1B1E2E" />}
                </button>

                <button
                    className={`${Styles.controlBtn} ${Styles.endCallBtn}`}
                    onClick={handleEndCall}
                    title="Kết thúc"
                >
                    <PhoneOff size={20} color="#ffffff" />
                </button>

                <button
                    className={`${Styles.controlBtn} ${!isCameraOn ? Styles.btnOff : ''}`}
                    onClick={handleToggleCamera}
                    title="Tắt/Bật Camera"
                >
                    {isCameraOn ? <Camera size={20} color="#1B1E2E" /> : <CameraOff size={20} color="#ffffff" />}
                </button>

                <button
                    className={Styles.controlBtn}
                    title="Đổi Camera"
                >
                    <SwitchCamera size={20} color="#1B1E2E" />
                </button>
            </div>
        </div>
    );
});

export default VideoPending;