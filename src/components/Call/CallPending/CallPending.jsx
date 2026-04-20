import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import VoicePending from './CallPending-component/Call-component/VoicePending';
import VideoPending from './CallPending-component/Video-component/VideoPending';

const CallPending = forwardRef(({ currentChat, isGroup = false, onCancelCall }, ref) => {
    const voiceRef = useRef(null);
    const videoRef = useRef(null);

    useImperativeHandle(ref, () => ({
        // khi bấm nút Gọi thoại
        startVoiceCall: () => {
            if (voiceRef.current) voiceRef.current.startCall();
        },
        // Khi bấm nút Gọi video
        startVideoCall: () => {
            if (videoRef.current) videoRef.current.startCall();
        },
        // endCall để Mainpage đóng UI gọi khi bị từ chối
        endCall: () => {
            if (voiceRef.current && voiceRef.current.forceEnd) voiceRef.current.forceEnd();
            if (videoRef.current && videoRef.current.forceEnd) videoRef.current.forceEnd();
        }
    }));

    return (
        <>
            <VoicePending 
                ref={voiceRef} 
                currentChat={currentChat} 
                onCancelCall={onCancelCall} 
            />
            <VideoPending 
                ref={videoRef} 
                currentChat={currentChat} 
                isGroup={isGroup} 
                onCancelCall={onCancelCall} 
            />
        </>
    );
});

export default CallPending;