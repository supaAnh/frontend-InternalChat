import React from 'react';
import Styles from './HeaderActions.module.css';
import { Phone, Video, Settings, Image as ImageIcon, Edit3, Users, Trash2, LogOut, Info } from 'lucide-react';

const HeaderActions = ({
    currentChat,
    isAdmin,
    isSettingsOpen,
    settingsRef,
    onStartCall,
    onOpenRightSidebar,
    onToggleSettings,
    onOpenModal,
}) => {
    return (
        <div className={Styles.headerActions}>
            <Phone
                className={Styles.icon}
                size={22}
                onClick={() => onStartCall('voice')}
                title="Gọi thoại"
            />
            <Video
                className={Styles.icon}
                size={24}
                onClick={() => onStartCall('video')}
                title="Gọi video"
            />
            <Info
                className={`${Styles.icon} ${Styles.mobileMenuBtnTarget}`}
                size={24}
                onClick={onOpenRightSidebar}
                title="Thông tin"
            />

            <div className={Styles.settingsContainer} ref={settingsRef}>
                <Settings
                    className={Styles.icon}
                    size={22}
                    title="Cài đặt"
                    onClick={onToggleSettings}
                />

                {isSettingsOpen && (
                    <div className={`${Styles.settingsMenu} glass-panel`}>
                        {currentChat?.isGroup && (
                            <button
                                className={Styles.settingsMenuItem}
                                onClick={() => onOpenModal('avatar')}
                            >
                                <ImageIcon size={18} />
                                <span>Đổi ảnh nhóm</span>
                            </button>
                        )}

                        <button
                            className={Styles.settingsMenuItem}
                            onClick={() => onOpenModal('rename')}
                        >
                            <Edit3 size={18} />
                            <span>Đổi tên hiển thị</span>
                        </button>

                        {currentChat?.isGroup && (
                            <button
                                className={Styles.settingsMenuItem}
                                onClick={() => onOpenModal('members')}
                            >
                                <Users size={18} />
                                <span>Quản lý thành viên</span>
                            </button>
                        )}

                        {currentChat?.isGroup && (
                            <>
                                <div className={Styles.divider}></div>
                                <button
                                    className={`${Styles.settingsMenuItem} ${Styles.leaveItem}`}
                                    onClick={() => onOpenModal('leave')}
                                >
                                    <LogOut size={18} />
                                    <span>Rời nhóm</span>
                                </button>
                            </>
                        )}

                        {currentChat?.isGroup && isAdmin && (
                            <button
                                className={`${Styles.settingsMenuItem} ${Styles.deleteItem}`}
                                onClick={() => onOpenModal('deleteGroup')}
                            >
                                <Trash2 size={18} />
                                <span>Xoá nhóm</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeaderActions;
