import React, { useState, useEffect } from 'react';
import Styles from './GroupMembersModal.module.css';
import { Plus, Shield, UserMinus } from 'lucide-react';

/**
 * GroupMembersModal - Modal quản lý thành viên nhóm
 * Props:
 *   - conversationId: string
 *   - currentUserId: string
 *   - socket: object
 *   - currentChat: object
 *   - onGroupUpdated: fn(updatedChat, systemMessage)
 *   - onClose: fn
 */
const GroupMembersModal = ({ conversationId, currentUserId, socket, currentChat, onGroupUpdated, onClose }) => {
    const [members, setMembers] = useState([]);
    const [adminId, setAdminId] = useState(null);

    // Add member states
    const [showAddMember, setShowAddMember] = useState(false);
    const [addMemberSearch, setAddMemberSearch] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);

    // Context menu state (right-click on member)
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, memberId: null, memberName: '' });

    // Đóng context menu khi click ra ngoài
    useEffect(() => {
        const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
        if (contextMenu.visible) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu.visible]);

    // Filter khi gõ tìm
    useEffect(() => {
        if (!addMemberSearch.trim()) {
            setFilteredUsers(allUsers);
            return;
        }
        const keyword = addMemberSearch.toLowerCase();
        setFilteredUsers(allUsers.filter(u => {
            const name = u.displayName || u.username || '';
            return name.toLowerCase().includes(keyword);
        }));
    }, [addMemberSearch, allUsers]);

    const fetchMembers = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/conversations/${conversationId}/members`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMembers(data.members || []);
                setAdminId(data.adminId);
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách thành viên:", error);
        }
    };

    // Fetch members khi mount
    useEffect(() => {
        fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

    const handleToggleAddMember = async () => {
        if (showAddMember) {
            setShowAddMember(false);
            setAddMemberSearch('');
            setFilteredUsers([]);
            return;
        }
        setShowAddMember(true);
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/users/get-all-user', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const users = data.users || data;
                const memberIds = members.map(m => String(m._id || m.id));
                const available = users.filter(u => !memberIds.includes(String(u._id || u.id)));
                setAllUsers(available);
                setFilteredUsers(available);
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách users:", error);
        }
    };

    const handleAddMember = async (userId) => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/conversations/${conversationId}/add-member`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId: userId })
            });
            if (response.ok) {
                const data = await response.json();
                if (socket) {
                    socket.emit('add_member', {
                        conversationId: data.conversationId,
                        memberIds: data.memberIds,
                        systemMessage: data.systemMessage,
                        addedMemberId: data.addedMemberId
                    });
                }
                if (onGroupUpdated) {
                    onGroupUpdated({ ...currentChat }, data.systemMessage);
                }
                fetchMembers();
            } else {
                const err = await response.json();
                alert(err.message || "Lỗi thêm thành viên!");
            }
        } catch (error) {
            console.error("Lỗi thêm thành viên:", error);
        }
    };

    const handleMemberRightClick = (e, member) => {
        e.preventDefault();
        const memberId = String(member._id || member.id);
        if (String(currentUserId) !== String(adminId) || memberId === String(currentUserId)) return;
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            memberId: memberId,
            memberName: member.displayName || member.username || 'Người dùng'
        });
    };

    const handleRemoveMember = async () => {
        if (!contextMenu.memberId) return;
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/conversations/${conversationId}/remove-member`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId: contextMenu.memberId })
            });
            if (response.ok) {
                const data = await response.json();
                if (socket) {
                    socket.emit('remove_member', {
                        conversationId: data.conversationId,
                        memberIds: data.memberIds,
                        systemMessage: data.systemMessage,
                        removedMemberId: data.removedMemberId
                    });
                }
                if (onGroupUpdated) {
                    onGroupUpdated({ ...currentChat }, data.systemMessage);
                }
                fetchMembers();
            } else {
                const err = await response.json();
                alert(err.message || "Lỗi xoá thành viên!");
            }
        } catch (error) {
            console.error("Lỗi xoá thành viên:", error);
        }
        setContextMenu({ visible: false, x: 0, y: 0, memberId: null, memberName: '' });
    };

    return (
        <>
            <div className={Styles.modalOverlay} onClick={onClose}>
                <div className={Styles.modalBox} onClick={(e) => e.stopPropagation()}>
                    <div className={Styles.modalHeader}>
                        <h3 className={Styles.modalTitle}>Thành viên nhóm</h3>
                        <button className={Styles.addMemberBtn} onClick={handleToggleAddMember} title="Thêm thành viên">
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* KHU VỰC THÊM THÀNH VIÊN */}
                    {showAddMember && (
                        <div className={Styles.addMemberSection}>
                            <input
                                type="text"
                                className={Styles.addMemberSearch}
                                placeholder="Tìm kiếm người dùng..."
                                value={addMemberSearch}
                                onChange={(e) => setAddMemberSearch(e.target.value)}
                                autoFocus
                            />
                            <div className={Styles.searchResults}>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map(user => {
                                        const userId = String(user._id || user.id);
                                        const userName = user.displayName || user.username || 'Người dùng';
                                        return (
                                            <div key={userId} className={Styles.searchResultItem}>
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt="avatar" className={Styles.memberAvatar} />
                                                ) : (
                                                    <div className={Styles.memberAvatarPlaceholder}>
                                                        {userName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className={Styles.memberName}>{userName}</span>
                                                <button className={Styles.addBtnSmall} onClick={() => handleAddMember(userId)}>Thêm</button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className={Styles.noResults}>Không tìm thấy người dùng</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* DANH SÁCH THÀNH VIÊN */}
                    <div className={Styles.memberList}>
                        {members.map((member) => {
                            const memberId = String(member._id || member.id);
                            const isGroupAdmin = memberId === adminId;
                            const memberName = member.displayName || member.username || 'Người dùng';

                            return (
                                <div
                                    key={memberId}
                                    className={Styles.memberItem}
                                    onContextMenu={(e) => handleMemberRightClick(e, member)}
                                >
                                    {member.avatar ? (
                                        <img src={member.avatar} alt="avatar" className={Styles.memberAvatar} />
                                    ) : (
                                        <div className={Styles.memberAvatarPlaceholder}>
                                            {memberName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className={Styles.memberInfo}>
                                        <span className={Styles.memberName}>
                                            {memberName}
                                            {isGroupAdmin && (
                                                <span className={Styles.adminBadge}>
                                                    <Shield size={10} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                                                    Trưởng nhóm
                                                </span>
                                            )}
                                        </span>
                                        <span className={Styles.memberRole}>
                                            {isGroupAdmin ? 'Quản trị viên' : 'Thành viên'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className={Styles.modalActions}>
                        <button className={Styles.btnCancel} onClick={onClose}>Đóng</button>
                    </div>
                </div>
            </div>

            {/* CONTEXT MENU XOÁ THÀNH VIÊN */}
            {contextMenu.visible && (
                <div
                    className={Styles.memberContextMenu}
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className={Styles.contextMenuItem} onClick={handleRemoveMember}>
                        <UserMinus size={16} />
                        <span>Xoá {contextMenu.memberName}</span>
                    </button>
                </div>
            )}
        </>
    );
};

export default GroupMembersModal;
