import React, { useState, useRef, useEffect } from 'react';
import Styles from './ChatInput.module.css';
import { Image as ImageIcon, Paperclip, Mic, SendHorizontal } from 'lucide-react';
import AttachmentPreview from './ChatInput-component/AttachmentPreview/AttachmentPreview';

const ChatInput = ({ onSendMessage, onTyping, isLoading }) => {
    const [message, setMessage] = useState('');
    const [activeMode, setActiveMode] = useState(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

    // --- CÁC STATE CHO GHI ÂM ---
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);

    const imageInputRef = useRef(null);
    const fileInputRef = useRef(null);

    // --- REF CHO GHI ÂM ---
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Logic đếm thời gian khi đang ghi âm
    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime((prevTime) => prevTime + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const clearAttachments = () => {
        // Tắt micro nếu đang ghi âm
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }

        setActiveMode(null);
        setImagePreviewUrl(null);
        setSelectedFile(null);

        setIsRecording(false);
        setRecordingTime(0);
        setAudioBlob(null);
        audioChunksRef.current = [];

        if (imageInputRef.current) imageInputRef.current.value = '';
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // BẮT ĐẦU GHI ÂM
    const startRecording = async () => {
        try {
            // Xin quyền truy cập micro
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                // Đóng gói các đoạn âm thanh thành 1 Blob chuẩn audio/webm
                const audioBlobData = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(audioBlobData);

                // Tắt các track của micro để giải phóng thiết bị
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            setActiveMode('voice');

        } catch (error) {
            console.error("Lỗi khi truy cập micro:", error);
            alert("Không thể truy cập micro. Vui lòng cấp quyền trong cài đặt trình duyệt.");
            clearAttachments();
        }
    };

    // DỪNG GHI ÂM
    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    const handleIconClick = (mode) => {
        if (isLoading) return;

        if (activeMode === mode) {
            clearAttachments();
            return;
        }
        clearAttachments();

        if (mode === 'image') {
            imageInputRef.current.click();
        } else if (mode === 'file') {
            fileInputRef.current.click();
        } else if (mode === 'voice') {
            startRecording();
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
            setActiveMode('image');
        }
        e.target.value = null;
    };

    const handleFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setActiveMode('file');
        }
        e.target.value = null;
    };

    // --- TYPING LOGIC ---
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);

    const handleTextChange = (e) => {
        setMessage(e.target.value);
        if (activeMode === 'voice') return;

        if (onTyping) {
            if (!isTypingRef.current) {
                isTypingRef.current = true;
                onTyping(true);
            }

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                isTypingRef.current = false;
                onTyping(false);
            }, 1500);
        }
    };

    // GỬI FILE GHI ÂM
    const handleSendVoice = () => {
        if (isLoading || !audioBlob) return;

        const voiceFile = new window.File([audioBlob], `voice-${Date.now()}.webm`, {
            type: 'audio/webm'
        });

        const tempAudioUrl = URL.createObjectURL(audioBlob);

        onSendMessage({
            text: "",
            type: "voice",
            file: voiceFile,
            previewUrl: tempAudioUrl,
            fileName: voiceFile.name
        });

        clearAttachments();
    };

    const handleSend = () => {
        if (isLoading) return;

        if (activeMode === 'voice') {
            handleSendVoice();
            return;
        }

        if (message.trim() === '' && !selectedFile) return;

        onSendMessage({
            text: message.trim(),
            type: activeMode || 'text',
            file: selectedFile,
            previewUrl: imagePreviewUrl,
            fileName: selectedFile?.name
        });

        setMessage('');
        clearAttachments();

        // Dừng typing khi gửi
        if (onTyping && isTypingRef.current) {
            clearTimeout(typingTimeoutRef.current);
            isTypingRef.current = false;
            onTyping(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={Styles.bottomArea}>

            {/* Khu vực Preview — tách ra thành AttachmentPreview */}
            <AttachmentPreview
                activeMode={activeMode}
                imagePreviewUrl={imagePreviewUrl}
                selectedFile={selectedFile}
                isRecording={isRecording}
                recordingTime={recordingTime}
                onClear={clearAttachments}
                onStopRecording={handleStopRecording}
                onSendVoice={handleSendVoice}
            />

            {/* Khu vực Input chính */}
            <div className={Styles.inputArea}>
                <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                    ref={imageInputRef}
                    onChange={handleImageChange}
                    hidden
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    hidden
                />

                <div className={Styles.attachActions}>
                    <ImageIcon
                        className={`${Styles.icon} ${activeMode === 'image' ? Styles.activeIcon : ''}`}
                        size={24}
                        onClick={() => handleIconClick('image')}
                    />
                    <Paperclip
                        className={`${Styles.icon} ${activeMode === 'file' ? Styles.activeIcon : ''}`}
                        size={24}
                        onClick={() => handleIconClick('file')}
                    />
                    <Mic
                        className={`${Styles.icon} ${activeMode === 'voice' ? Styles.activeIcon : ''}`}
                        size={24}
                        onClick={() => handleIconClick('voice')}
                    />
                </div>

                <div className={`${Styles.inputWrapper} glass-panel`}>
                    <input
                        type="text"
                        placeholder={activeMode === 'voice' ? "Vui lòng thao tác ở hộp ghi âm..." : "Nhập tin nhắn..."}
                        value={message}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        className={Styles.textInput}
                        disabled={isLoading || activeMode === 'voice'}
                    />
                </div>

                <div className={Styles.sendAction} onClick={handleSend}>
                    <SendHorizontal
                        className={Styles.sendIcon}
                        size={24}
                        color={message.trim() || (activeMode && activeMode !== 'voice') || (activeMode === 'voice' && !isRecording) ? '#3b82f6' : '#a0a0a0'}
                    />
                </div>
            </div>
        </div>
    );
};

export default ChatInput;