import React, { useState, useEffect, useRef } from 'react';
import Styles from './ChatHeader.module.css';
import HeaderInfo from './ChatHeader-component/HeaderInfo/HeaderInfo';
import HeaderActions from './ChatHeader-component/HeaderActions/HeaderActions';
import GroupMembersModal from './ChatHeader-component/GroupMembersModal/GroupMembersModal';
import RenameModal from './ChatHeader-component/RenameModal/RenameModal';
import GroupAvatarModal from './ChatHeader-component/GroupAvatarModal/GroupAvatarModal';
import ConfirmModal from './ChatHeader-component/ConfirmModal/ConfirmModal';

const ChatHeader = ({ currentChat, onStartCall, currentUser, socket, onLeaveGroup, onDeleteGroup, onGroupUpdated, onOpenLeftSidebar, onOpenRightSidebar }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsRef = useRef(null);

    // Modal visibility states
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false);

    // Leave/Delete loading states
    const [isLeaveLoading, setIsLeaveLoading] = useState(false);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);

    const currentUserId = currentUser?.id || currentUser?._id;
    const isAdmin = currentChat?.admin === currentUserId || currentChat?.adminId === currentUserId;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target)) {
                setIsSettingsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getDisplayName = () => {
        if (currentChat?.isGroup) {
            return currentChat?.name || currentChat?.groupName;
        }
        const otherUserId = currentChat?.otherUserId || currentChat?.id || currentChat?._id;
        const nicknameKey = `nickname_${currentUserId}_${otherUserId}`;
        const savedNickname = localStorage.getItem(nicknameKey);
        return savedNickname || currentChat?.name || currentChat?.displayName;
    };

    const getConvId = () => currentChat?.roomId || currentChat?.conversationId || currentChat?.id || currentChat?._id;

    const getRenameInitialName = () => {
        if (currentChat?.isGroup) {
            return currentChat?.name || currentChat?.groupName || '';
        }
        const otherUserId = currentChat?.otherUserId || currentChat?.id || currentChat?._id;
        const nicknameKey = `nickname_${currentUserId}_${otherUserId}`;
        return localStorage.getItem(nicknameKey) || currentChat?.name || currentChat?.displayName || '';
    };

    // Xử lý cập nhật nhóm từ modal con, chuyển lên ChatWindow
    const handleGroupUpdated = (updatedChat, systemMessage) => {
        if (onGroupUpdated) {
            onGroupUpdated(updatedChat, systemMessage);
        }
    };

    // ====== RỜI NHÓM ======
    const handleLeaveGroup = async () => {
        setIsLeaveLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/conversations/${getConvId()}/leave`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (socket) {
                    socket.emit('leave_group', {
                        conversationId: data.conversationId,
                        memberIds: data.memberIds,
                        systemMessage: data.systemMessage
                    });
                }
                if (onLeaveGroup) onLeaveGroup();
            } else {
                const err = await response.json();
                alert(err.message || "Lỗi rời nhóm!");
            }
        } catch (error) {
            console.error("Lỗi rời nhóm:", error);
            alert("Đã xảy ra lỗi kết nối!");
        }
        setIsLeaveLoading(false);
        setShowLeaveConfirm(false);
    };

    // ====== XOÁ NHÓM ======
    const handleDeleteGroup = async () => {
        setIsDeleteLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/conversations/${getConvId()}/group`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (socket) {
                    socket.emit('delete_group', {
                        conversationId: data.conversationId,
                        memberIds: data.memberIds,
                        groupName: data.groupName
                    });
                }
                if (onDeleteGroup) onDeleteGroup();
            } else {
                const err = await response.json();
                alert(err.message || "Lỗi xoá nhóm!");
            }
        } catch (error) {
            console.error("Lỗi xoá nhóm:", error);
            alert("Đã xảy ra lỗi kết nối!");
        }
        setIsDeleteLoading(false);
        setShowDeleteGroupConfirm(false);
    };

    // Callback tập trung để mở modal từ HeaderActions
    const handleOpenModal = (modalName) => {
        setIsSettingsOpen(false);
        if (modalName === 'avatar') setShowAvatarModal(true);
        else if (modalName === 'rename') setShowRenameModal(true);
        else if (modalName === 'members') setShowMembersModal(true);
        else if (modalName === 'leave') setShowLeaveConfirm(true);
        else if (modalName === 'deleteGroup') setShowDeleteGroupConfirm(true);
    };

    return (
        <>
            <div className={`${Styles.header} glass-panel`}>
                <HeaderInfo
                    currentChat={currentChat}
                    currentUserId={currentUserId}
                    currentTime={currentTime}
                    displayName={getDisplayName()}
                    onOpenLeftSidebar={onOpenLeftSidebar}
                />
                <HeaderActions
                    currentChat={currentChat}
                    isAdmin={isAdmin}
                    isSettingsOpen={isSettingsOpen}
                    settingsRef={settingsRef}
                    onStartCall={onStartCall}
                    onOpenRightSidebar={onOpenRightSidebar}
                    onToggleSettings={() => setIsSettingsOpen(prev => !prev)}
                    onOpenModal={handleOpenModal}
                />
            </div>

            {/* ====== MODAL QUẢN LÝ THÀNH VIÊN ====== */}
            {showMembersModal && (
                <GroupMembersModal
                    conversationId={getConvId()}
                    currentUserId={currentUserId}
                    socket={socket}
                    currentChat={currentChat}
                    onGroupUpdated={handleGroupUpdated}
                    onClose={() => setShowMembersModal(false)}
                />
            )}

            {/* ====== MODAL ĐỔI TÊN ====== */}
            {showRenameModal && (
                <RenameModal
                    isGroup={!!currentChat?.isGroup}
                    initialName={getRenameInitialName()}
                    conversationId={getConvId()}
                    currentChat={currentChat}
                    currentUserId={currentUserId}
                    socket={socket}
                    onGroupUpdated={handleGroupUpdated}
                    onClose={() => setShowRenameModal(false)}
                />
            )}

            {/* ====== MODAL ĐỔI ẢNH NHÓM ====== */}
            {showAvatarModal && (
                <GroupAvatarModal
                    conversationId={getConvId()}
                    currentAvatar={currentChat?.avatar || currentChat?.groupAvatar || ''}
                    currentChat={currentChat}
                    socket={socket}
                    onGroupUpdated={handleGroupUpdated}
                    onClose={() => setShowAvatarModal(false)}
                />
            )}

            {/* ====== CONFIRM RỜI NHÓM ====== */}
            {showLeaveConfirm && (
                <ConfirmModal
                    title="Rời nhóm?"
                    message={
                        <>
                            Bạn chắc chắn muốn rời khỏi nhóm <strong>{currentChat?.name || currentChat?.groupName}</strong>?
                            Bạn sẽ không thể xem tin nhắn trong nhóm nữa.
                        </>
                    }
                    confirmLabel="Rời nhóm"
                    isLoading={isLeaveLoading}
                    onConfirm={handleLeaveGroup}
                    onCancel={() => setShowLeaveConfirm(false)}
                />
            )}

            {/* ====== CONFIRM XOÁ NHÓM ====== */}
            {showDeleteGroupConfirm && (
                <ConfirmModal
                    title="Xoá nhóm?"
                    message={
                        <>
                            Bạn chắc chắn muốn xoá nhóm <strong>{currentChat?.name || currentChat?.groupName}</strong>?
                            Tất cả tin nhắn sẽ bị xoá vĩnh viễn và các thành viên sẽ nhận được thông báo.
                        </>
                    }
                    confirmLabel="Xoá nhóm"
                    isLoading={isDeleteLoading}
                    onConfirm={handleDeleteGroup}
                    onCancel={() => setShowDeleteGroupConfirm(false)}
                />
            )}
        </>
    );
};

export default ChatHeader;