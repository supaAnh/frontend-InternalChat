import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { Volume2, Mic, MicOff, PhoneOff } from 'lucide-react';
import Styles from '../../CallPending/CallPending-component/Call-component/VoicePending.module.css';

const VoiceCall = forwardRef(({ currentChat, remoteStreams, localStream, currentUser, activeCallParticipants, isGroup = false, onEndCall }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [callDuration, setCallDuration] = useState(0); // Lưu số giây

    const remoteAudioRefs = useRef({});

    // Mở khóa hàm cho Mainpage điều khiển
    useImperativeHandle(ref, () => ({
        startCall: () => {
            setIsVisible(true);
            setCallDuration(0);
        },
        endCall: () => {
            setIsVisible(false);
        }
    }));

    // Logic đếm thời gian mỗi giây
    useEffect(() => {
        let timerInterval;
        if (isVisible) {
            timerInterval = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerInterval);
        }
        return () => clearInterval(timerInterval);
    }, [isVisible]);

    // Gắn luồng âm thanh của đối phương vào thẻ Audio để phát ra loa
    useEffect(() => {
        if (!remoteStreams) return;
        Object.entries(remoteStreams).forEach(([userId, stream]) => {
            const el = remoteAudioRefs.current[userId];
            if (el && el.srcObject !== stream) {
                el.srcObject = stream;
                el.play().catch(error => {
                });
            }
        });
    }, [remoteStreams, isVisible]);

    // Xử lý logic tắt/bật loa ngoài thực sự
    useEffect(() => {
        Object.values(remoteAudioRefs.current).forEach((el) => {
            if (el) el.muted = !isSpeakerOn;
        });
    }, [isSpeakerOn]);

    // Hàm format số giây thành dạng MM:SS
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleEndCall = () => {
        setIsVisible(false);
        // Gửi thời gian gọi ra ngoài để Mainpage gửi lên Server lưu Database
        if (onEndCall) {
            onEndCall(callDuration);
        }
    };

    // Xử lý logic cắt Mic thực sự
    const handleToggleMute = () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);

        // Can thiệp trực tiếp vào Track âm thanh của bạn đang gửi đi
        if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            if (audioTracks.length > 0) {
                // Nếu newMutedState là true (đang tắt mic) enabled = false (cắt tiếng)
                audioTracks[0].enabled = !newMutedState;
            }
        }
    };

    if (!isVisible) return null;

    const contactName = currentChat?.name || currentChat?.displayName || currentChat?.username || "Người dùng ẩn danh";
    const avatar = currentChat?.avatar;

    const participantsRaw = isGroup ? activeCallParticipants : [currentChat];
    const participants = participantsRaw.filter(p => {
        if (!p) return false;
        const pId = String(p.id || p._id);
        const myId = String(currentUser?.id || currentUser?._id);
        return pId !== myId;
    });

    return (
        <div className={Styles.callContainer}>
            <div className={Styles.callerInfo}>
                {isGroup ? (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', marginBottom: '20px', maxWidth: '80%', padding: '0 20px', minHeight: '80px' }}>
                        {participants.length === 0 ? (
                            <p style={{ color: '#888', fontStyle: 'italic', fontSize: '14px', marginTop: '30px' }}>Đang đợi người khác tham gia...</p>
                        ) : participants.map((p) => {
                            const pId = p.id || p._id;
                            const isConnected = !!remoteStreams?.[pId];
                            return (
                                <div key={pId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: isConnected ? '3px solid #4CAF50' : '3px solid transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }}>
                                        {p.avatar ? (
                                            <img src={p.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{color: 'white'}}>{(p.name || 'U')[0].toUpperCase()}</span>
                                        )}
                                    </div>
                                    <span style={{ color: 'white', fontSize: '13px', marginTop: '8px', opacity: isConnected ? 1 : 0.6 }}>{p.name || 'Người dùng'}</span>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className={Styles.avatarWrapper}>
                        {avatar ? (
                            <img src={avatar} alt="avatar" className={Styles.avatar} />
                        ) : (
                            <div className={Styles.avatarPlaceholder}></div>
                        )}
                    </div>
                )}
                <h2 className={Styles.name}>{contactName}</h2>

                <p className={Styles.status} style={{ fontSize: '18px', fontWeight: '500', letterSpacing: '1px' }}>
                    {formatTime(callDuration)}
                </p>
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

            {/* Thẻ audio ẩn dùng để phát tiếng của người đang nói chuyện */}
            {Object.keys(remoteStreams || {}).map(userId => (
                <audio key={userId} ref={el => { remoteAudioRefs.current[userId] = el; }} autoPlay style={{ display: 'none' }} />
            ))}
        </div>
    );
});

export default VoiceCall;