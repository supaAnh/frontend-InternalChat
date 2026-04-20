import React, { useRef, useEffect } from 'react';
import Styles from './MessageList.module.css';
import MessageItem from './Message-component/MessageItem/MessageItem';

// PROPS ĐỂ NÚT "GỌI LẠI" CÓ THỂ HOẠT ĐỘNG
const MessageList = ({ messages, typingUsers, isLoading, currentChat, currentUser, onStartCall }) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUsers]);

    if (isLoading) {
        return (
            <div className={Styles.messagesArea}>
                <div className={Styles.skeletonContainer}>
                    <div className={`${Styles.skeletonMessage} ${Styles.skeletonLeft}`}>
                        <div className={Styles.skeletonAvatar}></div>
                        <div className={`${Styles.skeletonBubble} ${Styles.short}`}></div>
                    </div>
                    <div className={`${Styles.skeletonMessage} ${Styles.skeletonRight}`}>
                        <div className={`${Styles.skeletonBubble} ${Styles.medium}`}></div>
                    </div>
                </div>
            </div>
        );
    }

    const currentUserId = currentUser?._id || currentUser?.id;

    return (
        <div className={Styles.messagesArea}>
            <div className={Styles.messagesList}>
                {messages.length === 0 ? (
                    <div style={{ color: '#8B8D93', textAlign: 'center', marginTop: '20px' }}>
                        Bắt đầu cuộc trò chuyện với {currentChat?.name || currentChat?.chatName}
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <MessageItem
                            key={msg._id || msg.id || index}
                            msg={msg}
                            index={index}
                            currentUserId={currentUserId}
                            currentUser={currentUser}
                            onStartCall={onStartCall}
                        />
                    ))
                )}

                {/* HIỂN THỊ ĐÃ XEM CHO TIN NHẮN CUỐI CÙNG CỦA MÌNH */}
                {messages.length > 0 &&
                    (messages[messages.length - 1].senderId?._id || messages[messages.length - 1].senderId?.id || messages[messages.length - 1].senderId) === currentUserId &&
                    messages[messages.length - 1].isSeen && (
                        <div className={Styles.seenStatus}>
                            Đã xem
                        </div>
                    )}

                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default MessageList;