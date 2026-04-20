import React, { useState } from 'react';
import Styles from './RenameModal.module.css';
import { API_URL } from '../../../../../../config/api';


const RenameModal = ({ isGroup, initialName, conversationId, currentChat, currentUserId, socket, onGroupUpdated, onClose }) => {
    const [newName, setNewName] = useState(initialName || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleRename = async () => {
        if (!newName.trim()) return;
        setIsLoading(true);
        try {
            if (isGroup) {
                const token = sessionStorage.getItem('token');
                const response = await fetch(`${API_URL}/conversations/${conversationId}/rename`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newName: newName.trim() })
                });
                if (response.ok) {
                    const data = await response.json();
                    if (socket) {
                        socket.emit('rename_group', {
                            conversationId: data.conversationId,
                            memberIds: data.memberIds,
                            newName: data.newName,
                            systemMessage: data.systemMessage
                        });
                    }
                    if (onGroupUpdated) {
                        onGroupUpdated(
                            { ...currentChat, name: data.newName, groupName: data.newName },
                            data.systemMessage
                        );
                    }
                } else {
                    const err = await response.json();
                    alert(err.message || "Lỗi đổi tên nhóm!");
                }
            } else {
                // Đổi nickname 1-1 — lưu localStorage
                const otherUserId = currentChat?.otherUserId || currentChat?.id || currentChat?._id;
                const nicknameKey = `nickname_${currentUserId}_${otherUserId}`;
                localStorage.setItem(nicknameKey, newName.trim());
                if (onGroupUpdated) {
                    onGroupUpdated({
                        ...currentChat,
                        name: newName.trim(),
                        displayName: newName.trim(),
                        nicknameChanged: true
                    });
                }
            }
        } catch (error) {
            console.error("Lỗi đổi tên:", error);
            alert("Đã xảy ra lỗi kết nối!");
        }
        setIsLoading(false);
        onClose();
    };

    return (
        <div className={Styles.modalOverlay} onClick={onClose}>
            <div className={Styles.modalBox} onClick={(e) => e.stopPropagation()}>
                <h2 className={Styles.modalTitle}>
                    {isGroup ? 'Đổi tên nhóm' : 'Đổi tên hiển thị'}
                </h2>
                <p style={{ color: '#A0A3B1', fontSize: '14px', textAlign: 'center', marginBottom: '30px' }}>
                    {isGroup
                        ? 'Tên nhóm mới sẽ hiển thị cho tất cả thành viên.'
                        : 'Tên hiển thị mới chỉ hiện ở phía bạn, người kia sẽ không thấy thay đổi.'
                    }
                </p>
                <div className={Styles.inputWrapper}>
                    <label className={Styles.inputLabel}>Tên mới:</label>
                    <input
                        type="text"
                        className={Styles.modalInput}
                        placeholder="Nhập tên mới..."
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        autoFocus
                    />
                </div>
                <div className={Styles.modalActions}>
                    <button
                        className={Styles.btnPrimary}
                        onClick={handleRename}
                        disabled={!newName.trim() || isLoading}
                    >
                        {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RenameModal;
