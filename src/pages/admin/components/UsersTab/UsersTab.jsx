import React, { useState } from 'react';
import styles from './UsersTab.module.css';
import { API_URL, getAvatarUrl } from '../../../../config/api';
import AddUserForm from '../AddUserForm/AddUserForm';

const UsersTab = ({ users, currentUser, fetchData, handleRoleChange, handleToggleStatus }) => {
    const [showAddUser, setShowAddUser] = useState(false);
    const [filterUserRole, setFilterUserRole] = useState('all');
    const [filterUserStatus, setFilterUserStatus] = useState('all');

    // Kiểm tra quyền (trả về bool)
    const canManageUser = (targetUser) => {
        if (!currentUser) return false;
        if (targetUser._id === currentUser.id || targetUser._id === currentUser._id) return false; // Không tự xử chính mình

        if (currentUser.role === 'admin') {
            if (targetUser.role === 'admin' || targetUser.role === 'root-admin') return false;
        }
        return true; // root-admin có thể sửa tất cả trừ chính mình
    };

    const handleAddSuccess = () => {
        setShowAddUser(false);
        fetchData(); // Cập nhật lại list sau khi add
    };

    const filteredUsers = users.filter(u => {
        let matchRole = filterUserRole === 'all' || u.role === filterUserRole;
        let matchStatus = true;
        if (filterUserStatus === 'active') matchStatus = u.isActive === true;
        if (filterUserStatus === 'inactive') matchStatus = u.isActive === false;
        return matchRole && matchStatus;
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Danh sách Nhân sự</h2>
                <button className={`${styles.actionBtn} ${styles.activateBtn}`} onClick={() => setShowAddUser(!showAddUser)}>
                    {showAddUser ? 'Đóng Form' : '+ Thêm Tài Khoản'}
                </button>
            </div>

            {showAddUser && (
                <AddUserForm currentUser={currentUser} onAddSuccess={handleAddSuccess} onClose={() => setShowAddUser(false)} />
            )}

            <div className={`${styles.logFilters}`} style={{ marginBottom: 20, borderBottom: 'none' }}>
                <span style={{ marginRight: 10, color: '#8B8D93' }}>BỘ LỌC NHÂN SỰ:</span>
                <select value={filterUserRole} onChange={(e) => setFilterUserRole(e.target.value)} className={styles.roleSelect}>
                    <option value="all">Tất cả Quyền</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="root-admin">Root-Admin</option>
                </select>
                <select value={filterUserStatus} onChange={(e) => setFilterUserStatus(e.target.value)} className={styles.roleSelect}>
                    <option value="all">Tất cả Trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Đã Khoá</option>
                </select>
            </div>

            <div className={`${styles.tableContainer} glass-panel`}>
                <table className={styles.userTable}>
                    <thead>
                        <tr>
                            <th>Nhân viên</th>
                            <th>Quyền (Role)</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u._id}>
                                <td data-label="Nhân viên">
                                    <div className={styles.userInfo}>
                                        <img src={getAvatarUrl(u.avatar || '/default-avatar.png')} alt="avatar" className={styles.userAvatar} />
                                        <div className={styles.userDetails}>
                                            <div className={styles.userName}>{u.displayName || u.username}</div>
                                            <div className={styles.userEmail} style={{ fontSize: '0.8rem', color: '#888' }}>{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td data-label="Quyền">
                                    <span className={`${styles.badge} ${u.role === 'root-admin' ? styles.rootAdmin : (u.role === 'admin' ? styles.admin : styles.user)}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td data-label="Trạng thái">
                                    <span className={`${styles.badge} ${u.isActive ? styles.active : styles.inactive}`} style={{ marginRight: 5 }}>
                                        {u.isActive ? 'Hoạt động' : 'Đã Khoá'}
                                    </span>
                                    {u.isOnline && <span className={`${styles.badge} ${styles.online}`}>Online</span>}
                                </td>
                                <td data-label="Thao tác">
                                    <select
                                        className={styles.roleSelect}
                                        style={{ marginRight: 10 }}
                                        value={u.role}
                                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                        disabled={!canManageUser(u)}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                        {currentUser.role === 'root-admin' && <option value="root-admin">Root Admin</option>}
                                    </select>

                                    <button
                                        className={`${styles.actionBtn} ${u.isActive ? styles.deactivateBtn : styles.activateBtn}`}
                                        onClick={() => handleToggleStatus(u._id, u.isActive)}
                                        disabled={!canManageUser(u)}
                                    >
                                        {u.isActive ? 'Khoá TK' : 'Mở TK'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && <p style={{ color: '#8B8D93', padding: '20px', textAlign: 'center' }}>Không tìm thấy nhân sự nào khớp với bộ lọc.</p>}
            </div>
        </div>
    );
};

export default UsersTab;
