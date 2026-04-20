import React, { useState, useRef } from 'react';
import Styles from './GroupAvatarModal.module.css';
import { Plus } from 'lucide-react';
import { API_URL, getAvatarUrl } from '../../../../../../config/api';

const GroupAvatarModal = ({ conversationId, currentAvatar, currentChat, socket, onGroupUpdated, onClose }) => {
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(currentAvatar || '');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleChangeAvatar = async () => {
        if (!avatarFile) return;
        setIsLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', avatarFile);
            const response = await fetch(`${API_URL}/conversations/${conversationId}/avatar`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (response.ok) {
                const data = await response.json();
                if (socket) {
                    socket.emit('change_group_avatar', {
                        conversationId: data.conversationId,
                        memberIds: data.memberIds,
                        newAvatar: data.newAvatar,
                        systemMessage: data.systemMessage
                    });
                }
                if (onGroupUpdated) {
                    onGroupUpdated(
                        { ...currentChat, avatar: data.newAvatar, groupAvatar: data.newAvatar },
                        data.systemMessage
                    );
                }
            } else {
                const err = await response.json();
                alert(err.message || "Lỗi đổi ảnh nhóm!");
            }
        } catch (error) {
            console.error("Lỗi đổi ảnh nhóm:", error);
            alert("Đã xảy ra lỗi kết nối!");
        }
        setIsLoading(false);
        onClose();
    };

    return (
        <div className={Styles.modalOverlay} onClick={onClose}>
            <div className={Styles.modalBox} onClick={(e) => e.stopPropagation()}>
                <h2 className={Styles.modalTitle}>Đổi ảnh nhóm</h2>
                <div className={Styles.avatarUploadArea}>
                    <div className={Styles.avatarClickable} onClick={handleAvatarClick}>
                        {avatarPreview ? (
                            <img src={getAvatarUrl(avatarPreview)} alt="preview" className={Styles.avatarPreview} />
                        ) : (
                            <div className={Styles.avatarPreviewPlaceholder}></div>
                        )}
                        <div className={Styles.plusIconWrapper}>
                            <Plus size={16} color="#000" />
                        </div>
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleAvatarFileChange}
                    />
                </div>
                <div className={Styles.modalActions}>
                    <button
                        className={Styles.btnPrimary}
                        onClick={handleChangeAvatar}
                        disabled={!avatarFile || isLoading}
                    >
                        {isLoading ? 'Đang tải...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupAvatarModal;
