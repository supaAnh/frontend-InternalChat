import React, { useState } from 'react';
import styles from './AddUserForm.module.css';
import { API_URL } from '../../../../config/api';

const AddUserForm = ({ currentUser, onAddSuccess, onClose }) => {
    const [newUserForm, setNewUserForm] = useState({ username: '', email: '', password: '', role: 'user' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/users`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newUserForm)
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                setNewUserForm({ username: '', email: '', password: '', role: 'user' });
                onAddSuccess(); // Gọi hàm cập nhật danh sách
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert("Lỗi tạo user");
        }
    };

    return (
        <div className={`${styles.addUserForm} glass-panel`} style={{ padding: 20, marginBottom: 20, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ marginTop: 0 }}>Tạo tài khoản mới</h3>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'center' }}>
                <input placeholder="Tên đăng nhập" required value={newUserForm.username} onChange={e => setNewUserForm({ ...newUserForm, username: e.target.value })} className={styles.roleSelect} />
                <input type="email" placeholder="Email" required value={newUserForm.email} onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} className={styles.roleSelect} />
                <input type="password" placeholder="Mật khẩu" required value={newUserForm.password} onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })} className={styles.roleSelect} />
                <select value={newUserForm.role} onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })} className={styles.roleSelect}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    {currentUser.role === 'root-admin' && <option value="root-admin">Root Admin</option>}
                </select>
                <button type="submit" className={`${styles.actionBtn} ${styles.activateBtn}`}>Tạo Mới</button>
            </form>
        </div>
    );
};

export default AddUserForm;
