import React from 'react';
import Styles from './RemoteGrid.module.css';

const getGridClass = (count) => {
    if (count === 1) return Styles.grid1;
    if (count === 2) return Styles.grid2;
    if (count <= 4) return Styles.grid4;
    return Styles.gridMany;
};

const RemoteGrid = ({ participants, remoteStreams, remoteVideoRefs }) => {
    if (participants.length === 0) {
        return (
            <div className={Styles.waitingScreen}>
                <p className={Styles.waitingText}>Đang đợi người khác tham gia...</p>
            </div>
        );
    }

    return (
        <div className={`${Styles.remoteGrid} ${getGridClass(participants.length)}`}>
            {participants.map((p) => {
                const userId = p.id || p._id || 'single';
                return (
                    <div key={userId} className={Styles.remoteCard}>
                        {/* Video stream thật */}
                        <video
                            ref={el => { remoteVideoRefs.current[userId] = el; }}
                            autoPlay
                            playsInline
                            className={Styles.remoteVideo}
                        />

                        {/* Nếu chưa có stream: hiển thị avatar + tên + trạng thái */}
                        {!remoteStreams?.[userId] && (
                            <div className={Styles.remoteOverlay}>
                                <div className={Styles.remoteAvatarWrapper}>
                                    {p?.avatar
                                        ? <img src={p.avatar} alt="avatar" className={Styles.remoteAvatar} />
                                        : <div className={Styles.remoteAvatarPlaceholder} />}
                                </div>
                                <p className={Styles.remoteName}>{p?.name || 'Người dùng'}</p>
                                <p className={`${Styles.remoteStatus} pulse-wave`}>Đang kết nối...</p>
                            </div>
                        )}

                        {/* Name tag góc dưới trái */}
                        <div className={Styles.nameTag}>{p?.name || 'Người dùng'}</div>
                    </div>
                );
            })}
        </div>
    );
};

export default RemoteGrid;
