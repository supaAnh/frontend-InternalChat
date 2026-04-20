import React from 'react';
import Styles from './HeaderInfo.module.css';
import { Menu } from 'lucide-react';

const formatTimeAgo = (lastActive, currentTime) => {
    if (!lastActive) return "";
    const past = new Date(lastActive);
    if (isNaN(past.getTime())) return "";

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

const HeaderInfo = ({ currentChat, currentUserId, currentTime, displayName, onOpenLeftSidebar }) => {
    return (
        <div className={Styles.userInfo}>
            <Menu
                className={`${Styles.icon} ${Styles.mobileMenuBtnTarget}`}
                size={28}
                color="#ffffff"
                onClick={onOpenLeftSidebar}
                style={{ marginRight: 10 }}
            />
            {currentChat?.avatar || currentChat?.groupAvatar ? (
                <img
                    src={currentChat.avatar || currentChat.groupAvatar}
                    alt="avatar"
                    className={Styles.avatar}
                />
            ) : (
                <div className={Styles.avatarPlaceholder}>
                    {displayName?.charAt(0).toUpperCase()}
                </div>
            )}
            <div className={Styles.userDetails}>
                <h3 className={Styles.userName}>{displayName}</h3>
                <span className={Styles.status}>
                    {!currentChat?.isGroup && (
                        <>
                            <span className={`${Styles.statusDot} ${currentChat?.isOnline ? Styles.online : ''}`}></span>
                            {(() => {
                                if (currentChat?.isOnline) return 'Đang hoạt động';
                                if (!currentChat?.lastActive) return 'Offline';
                                const timeAgo = formatTimeAgo(currentChat.lastActive, currentTime);
                                return timeAgo === 'Vừa mới truy cập' ? timeAgo : `Hoạt động ${timeAgo}`;
                            })()}
                        </>
                    )}
                    {currentChat?.isGroup && `${currentChat?.memberCount || currentChat?.members?.length || 0} thành viên`}
                </span>
            </div>
        </div>
    );
};

export default HeaderInfo;
