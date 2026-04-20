import React, { useState, useEffect } from 'react';
import Styles from './RightSidebar.module.css';

const formatTimeAgo = (lastActive, currentTime) => {
    if (!lastActive) return "";
    
    const past = new Date(lastActive); 
    if (isNaN(past.getTime())) {
        console.error("Lỗi Date format:", lastActive);
        return ""; 
    }

    const now = currentTime || new Date(); 
    
    const diffInSeconds = Math.floor((now - past) / 1000); 
    
    if (diffInSeconds < 0) return "Vừa mới truy cập";
    
    const diffInMinutes = Math.floor(diffInSeconds / 60); 
    
    if (diffInMinutes < 1) return "Vừa mới truy cập";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    return `${Math.floor(diffInHours / 24)} ngày trước`;
};

const RightSidebar = ({ onlineUsers, onSelectContact, selectedChatId }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [displayCount, setDisplayCount] = useState(15);

    const handleScroll = (e) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            setDisplayCount(prev => Math.min(prev + 15, onlineUsers.length));
        }
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000); 

        return () => clearInterval(timer);
    }, []);

    return (
        <div className={Styles.rightSidebarContainer}>
            <h2 className={Styles.title}>Người liên hệ</h2>
            <p className={Styles.subtitle}>Trạng thái hoạt động</p>
            
            <div className={Styles.contactList} onScroll={handleScroll}>
                {onlineUsers.slice(0, displayCount).map((user) => {
                    const isUserOnline = user.isOnline === true;
                    
                    const userId = user.id || user._id; 

                    return (
                        <div 
                            key={userId} 
                            className={`${Styles.contactItem} ${selectedChatId === userId ? Styles.active : ''}`}
                            onClick={() => onSelectContact(userId)} 
                        >
                            <div className={Styles.avatarWrapper}>
                                {user.avatar ? (
                                    <img src={user.avatar} alt="avatar" className={Styles.avatar} />
                                ) : (
                                    <div className={Styles.avatarPlaceholder}>
                                        {user.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            
                            <div className={Styles.contactInfoWrapper}>
                                <span className={Styles.contactName}>{user.name}</span>
                                
                                {!isUserOnline && user.lastActive && (
                                    <span className={Styles.offlineTime}>
                                        {formatTimeAgo(user.lastActive, currentTime)}
                                    </span>
                                )}
                                
                                {isUserOnline && (
                                    <span className={Styles.onlineStatusText}>Đang hoạt động</span>
                                )}
                            </div>

                            <span className={`${Styles.statusDot} ${isUserOnline ? Styles.online : Styles.offline}`}></span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RightSidebar;