import React, { useState, useRef, useEffect } from 'react';
import Styles from './CreateGroupChat.module.css';

const CreateGroupChat = ({ isOpen, onClose, onGroupCreated, socket }) => {
    const [groupName, setGroupName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    
    const [showConfirmCancel, setShowConfirmCancel] = useState(false);
    
    const formRef = useRef(null);

    // Lấy danh sách người dùng khi mở modal
    useEffect(() => {
        if (!isOpen) return;

        const fetchUsers = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/users/get-all-user', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const usersList = data.users || data;
                    const formatted = usersList.map(u => ({
                        id: u._id || u.id,
                        name: u.displayName || u.username,
                        avatar: u.avatar
                    }));
                    setUsers(formatted);
                }
            } catch (error) {
                console.error("Lỗi lấy danh sách user tạo nhóm:", error);
            }
        };

        fetchUsers();
    }, [isOpen]);

    // Xử lý click ra ngoài form
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && formRef.current && !formRef.current.contains(event.target)) {
                setShowConfirmCancel(true); 
            }
        };

        if (!showConfirmCancel) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, showConfirmCancel]);

    if (!isOpen) return null;

    // Xử lý chọn/bỏ chọn thành viên
    const handleToggleMember = (userId) => {
        setSelectedMembers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId) 
                : [...prev, userId]                
        );
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            alert("Vui lòng nhập tên nhóm!");
            return;
        }
        if (selectedMembers.length === 0) {
            alert("Vui lòng chọn ít nhất 1 thành viên!");
            return;
        }
        
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/conversations/group', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    groupName: groupName,
                    members: selectedMembers
                })
            });

            if (response.ok) {
                const newGroup = await response.json();
                // Emit socket để báo cho các thành viên trong nhóm
                if (socket) {
                    socket.emit('group_created', {
                        group: newGroup,
                        memberIds: selectedMembers
                    });
                }
                if (onGroupCreated) onGroupCreated(newGroup);
                resetAndClose();
            } else {
                alert("Lỗi khi tạo nhóm!");
            }
        } catch (error) {
            // lỗi tạo nhóm đã được thông báo qua alert
            alert("Đã xảy ra lỗi kết nối!");
        }
    };

    const handleConfirmCancel = (confirm) => {
        setShowConfirmCancel(false);
        if (confirm) {
            resetAndClose();
        }
    };

    const resetAndClose = () => {
        setGroupName('');
        setSelectedMembers([]);
        setSearchQuery('');
        onClose();
    };

    const filteredUsers = users.filter((user) => {
        if (!user.name) return false;
        return user.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className={Styles.modalOverlay}>
            <div className={Styles.formContainer} ref={formRef}>
                
                {/* --- Header --- */}
                <div className={Styles.header}>
                    <h2 className={Styles.title}>Nhóm mới</h2>
                    <button className={Styles.createBtn} onClick={handleCreateGroup}>Tạo</button>
                </div>

                {/* --- Nhập tên nhóm --- */}
                <div className={Styles.inputGroup}>
                    <label>Tên nhóm (bắt buộc):</label>
                    <input 
                        type="text" 
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className={Styles.textInput}
                    />
                </div>

                {/* --- Thanh tìm kiếm nội bộ --- */}
                <div className={Styles.inputGroup}>
                    <label>Thêm thành viên (bắt buộc):</label>
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm bạn bè..."
                        className={Styles.textInput}
                    />
                </div>

                {/* --- Danh sách thành viên --- */}
                <div className={Styles.memberListSection}>
                    <label>Danh sách thành viên:</label>
                    <div className={Styles.memberList}>
                        {filteredUsers.map(user => (
                            <div 
                                key={user.id} 
                                className={Styles.memberItem} 
                                onClick={() => handleToggleMember(user.id)}
                            >
                                <div className={Styles.userInfo}>
                                    <div className={Styles.avatarWrapper}>
                                        {user.avatar ? (
                                            <img src={user.avatar} alt="avatar" className={Styles.avatar} />
                                        ) : (
                                            <div className={Styles.avatarPlaceholder}></div>
                                        )}
                                    </div>
                                    <span className={Styles.userName}>{user.name}</span>
                                </div>
                                <input 
                                    type="checkbox" 
                                    className={Styles.checkbox}
                                    checked={selectedMembers.includes(user.id)}
                                    readOnly
                                />
                            </div>
                        ))}
                        {filteredUsers.length === 0 && (
                            <p style={{ color: '#8B8D93', textAlign: 'center', marginTop: '20px' }}>
                                Không tìm thấy kết quả.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Popup Xác nhận Hủy --- */}
            {showConfirmCancel && (
                <div className={Styles.confirmOverlay}>
                    <div className={Styles.confirmBox}>
                        <h3>Hủy tạo nhóm?</h3>
                        <p>Bạn chắc chắn muốn hủy bỏ việc tạo nhóm? Các thông tin bạn vừa nhập sẽ không được lưu lại.</p>
                        <div className={Styles.confirmActions}>
                            <button className={Styles.btnCancel} onClick={() => handleConfirmCancel(false)}>Tiếp tục</button>
                            <button className={Styles.btnAccept} onClick={() => handleConfirmCancel(true)}>Huỷ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateGroupChat;