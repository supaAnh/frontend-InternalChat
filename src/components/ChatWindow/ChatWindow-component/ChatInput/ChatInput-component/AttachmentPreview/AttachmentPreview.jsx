import React from 'react';
import Styles from './AttachmentPreview.module.css';
import { Mic, X, File } from 'lucide-react';

const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const AttachmentPreview = ({
    activeMode,
    imagePreviewUrl,
    selectedFile,
    isRecording,
    recordingTime,
    onClear,
    onStopRecording,
    onSendVoice,
}) => {
    if (!activeMode) return null;

    return (
        <div className={`${Styles.previewArea} glass-panel`}>

            {/* Preview Ảnh */}
            {activeMode === 'image' && imagePreviewUrl && (
                <div className={Styles.previewItem}>
                    <img src={imagePreviewUrl} alt="Preview" className={Styles.imagePreview} />
                    <button className={Styles.removeBtn} onClick={onClear}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Preview File */}
            {activeMode === 'file' && selectedFile && (
                <div className={Styles.previewItem}>
                    <div className={Styles.filePreview}>
                        <File size={24} color="#8B8D93" />
                        <span className={Styles.fileName}>{selectedFile.name}</span>
                    </div>
                    <button className={Styles.removeBtn} onClick={onClear}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Preview Voice */}
            {activeMode === 'voice' && (
                <div className={Styles.previewItem}>
                    <div className={Styles.voicePreview}>
                        {isRecording ? (
                            <>
                                <span className={Styles.recordingDot}></span>
                                <span style={{ color: '#EF4444' }}>Đang ghi âm... {formatTime(recordingTime)}</span>
                            </>
                        ) : (
                            <>
                                <Mic size={20} color="#3b82f6" />
                                <span style={{ color: '#ffffff' }}>Bản ghi âm hoàn tất ({formatTime(recordingTime)})</span>
                            </>
                        )}
                    </div>
                    <div className={Styles.voiceActions}>
                        {isRecording ? (
                            <button className={Styles.stopBtn} onClick={onStopRecording}>Dừng</button>
                        ) : (
                            <button className={Styles.sendVoiceBtn} onClick={onSendVoice}>Gửi</button>
                        )}
                        <button className={Styles.removeBtn} onClick={onClear}>
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttachmentPreview;
