import React from 'react';
import Styles from './MessageItem.module.css';
import MessageAttachment from '../MessageAttachment';
import VoiceMessagePlayer from '../VoiceMessagePlayer';
import CallMessageBubble from '../CallMessageBubble/CallMessageBubble';

const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const MessageItem = ({ msg, index, currentUserId, currentUser, onStartCall }) => {
    // === TIN NHẮN HỆ THỐNG ===
    if (msg.type === 'system' || msg.mediaType === 'system') {
        return (
            <div key={msg._id || msg.id || index} className={Styles.systemMessage}>
                <span className={Styles.systemMessageText}>{msg.text}</span>
            </div>
        );
    }

    // Xử lý dữ liệu người gửi
    const senderObj = typeof msg.senderId === 'object' ? msg.senderId : null;
    const senderIdStr = senderObj ? (senderObj._id || senderObj.id) : msg.senderId;

    const isMyMessage = senderIdStr === currentUserId;

    const displayName = isMyMessage
        ? "Tôi"
        : (senderObj?.displayName || senderObj?.name || senderObj?.username || "Người dùng");

    const avatarUrl = isMyMessage
        ? (currentUser?.avatar || '/default-avatar.png')
        : (senderObj?.avatar || '/default-avatar.png');

    const timeString = formatMessageTime(msg.createdAt || msg.timestamp);
    const isCallMessage = msg.type === 'call';

    return (
        <div
            key={msg._id || msg.id || index}
            className={`${Styles.messageWrapper} ${isMyMessage ? Styles.myMessage : Styles.theirMessage}`}
        >
            {/* Avatar người khác */}
            {!isMyMessage && (
                <img src={avatarUrl} alt="avatar" className={Styles.messageAvatar} />
            )}

            <div className={Styles.messageBody}>
                {/* Info người gửi + thời gian */}
                <div className={Styles.messageInfo}>
                    <span className={Styles.senderName}>{displayName}</span>
                    <span className={Styles.messageTime}>{timeString}</span>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    alignItems: isMyMessage ? 'flex-end' : 'flex-start',
                    maxWidth: '100%'
                }}>
                    {isCallMessage ? (
                        <CallMessageBubble
                            message={msg}
                            isMyMessage={isMyMessage}
                            onCallAgain={(type) => {
                                if (onStartCall) onStartCall(type);
                            }}
                        />
                    ) : (
                        <>
                            {(msg.mediaUrl || msg.fileUrl || msg.previewUrl || msg.imageUrl) &&
                                msg.mediaType !== 'voice' && msg.type !== 'voice' && (
                                    <MessageAttachment
                                        fileUrl={msg.mediaUrl || msg.fileUrl || msg.previewUrl || msg.imageUrl}
                                        fileName={msg.fileName || (msg.mediaType === 'image' || msg.type === 'image' ? 'hinh-anh.jpg' : 'Tệp đính kèm')}
                                        fileSize={msg.fileSize || ""}
                                        fileType={msg.fileMimeType || msg.fileType || (msg.mediaType === 'image' || msg.type === 'image' ? 'image/jpeg' : 'application/octet-stream')}
                                    />
                                )}

                            {(msg.mediaType === 'voice' || msg.type === 'voice') && (
                                <VoiceMessagePlayer audioUrl={msg.mediaUrl || msg.fileUrl || msg.previewUrl || msg.url} />
                            )}

                            {msg.text && (
                                <div className={`${Styles.messageBubble} glass-panel`}>
                                    <div className={Styles.messageText} style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                        {msg.text}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Avatar của mình */}
            {isMyMessage && (
                <img src={avatarUrl} alt="avatar" className={Styles.messageAvatar} />
            )}
        </div>
    );
};

export default MessageItem;
