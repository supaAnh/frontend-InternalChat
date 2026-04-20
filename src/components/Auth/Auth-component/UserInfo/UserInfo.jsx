import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Styles from './UserInfo.module.css';
const UserInfo = ({ isOpen, onClose, currentUser, onUpdateUser }) => {
    // Khởi tạo state từ dữ liệu user hiện tại
    const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
    const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar || null);
    const [selectedFile, setSelectedFile] = useState(null);

    const fileInputRef = useRef(null);

    // Kiểm tra xem user có đang bị thiếu thông tin không
    const isMissingInfo = !currentUser?.displayName || !currentUser?.avatar;

    // Cập nhật lại state nếu currentUser thay đổi
    useEffect(() => {
        if (currentUser) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDisplayName(currentUser?.displayName || '');
            setAvatarPreview(currentUser?.avatar || null);
        }
    }, [currentUser]);

    // Nếu không mở modal thì không render
    if (!isOpen) return null;

    // Xử lý chọn ảnh đại diện mới
    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setAvatarPreview(objectUrl);
        }
    };

    // Xử lý click ra ngoài overlay
    const handleOverlayClick = () => {
        if (isMissingInfo) return;
        onClose();
    };

    // Xử lý submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!displayName.trim()) {
            alert("Vui lòng điền tên hiển thị!");
            return;
        }

        // 1. Dùng FormData đính kèm file ảnh
        const formData = new FormData();
        formData.append('displayName', displayName);

        // Nếu user có chọn ảnh mới thì mới đính kèm vào
        if (selectedFile) {
            formData.append('avatar', selectedFile);
        }

        try {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token'); // Lấy token để xác thực

            // Gọi API cập nhật profile
            const response = await fetch('http://localhost:5000/api/users/update-profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`

                },
                body: formData // Truyền FormData (chứa displayName và file avatar) vào body
            });

            const data = await response.json();

            if (response.ok) {

                // 1. Cập nhật lại storage với thông tin user mới
                if (sessionStorage.getItem('user')) {
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                }
                if (localStorage.getItem('user')) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }

                // 2. Hiển thị thông báo
                alert("Cập nhật hồ sơ thành công!");

                // 3. Đóng khung popup UserInfo
                onClose();

                // 4. Báo cho component cha cập nhật lại Avatar và Tên ngay lập tức
                if (onUpdateUser) {
                    onUpdateUser(data.user);
                }

            } else {
                alert(data.message || "Cập nhật thất bại, vui lòng thử lại.");
            }

        } catch (error) {
            console.error("Lỗi gọi API cập nhật profile:", error);
            alert("Lỗi kết nối đến máy chủ.");
        }
    };

    return (
        <div className={Styles.modalOverlay} onClick={handleOverlayClick}>
            <div className={Styles.formContainer} onClick={(e) => e.stopPropagation()}>
                <h2 className={Styles.title}>Thông tin cá nhân</h2>

                {/* HIỂN THỊ THÔNG BÁO NẾU THIẾU THÔNG TIN */}
                {isMissingInfo && (
                    <div style={{ color: '#d9534f', backgroundColor: '#fdf7f7', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px', textAlign: 'center', border: '1px solid #d9534f' }}>
                        Chào mừng bạn mới! Vui lòng cập nhật <b>Ảnh đại diện</b> và <b>Tên hiển thị</b> để mọi người có thể nhận ra bạn nhé.
                    </div>
                )}

                <form onSubmit={handleSubmit} className={Styles.form}>
                    {/* Khu vực Avatar */}
                    <div className={Styles.avatarSection}>
                        <div className={Styles.avatarWrapper} onClick={handleAvatarClick}>
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar Preview" className={Styles.avatarImage} />
                            ) : (
                                <div className={Styles.avatarPlaceholder}></div>
                            )}

                            <div className={Styles.plusIconWrapper}>
                                <Plus size={16} color="#000" />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* Khu vực Input tên hiển thị */}
                    <div className={Styles.inputGroup}>
                        <label>Tên hiển thị:</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Nhập tên của bạn..."
                            required
                        />
                    </div>

                    {/* Nút lưu */}
                    <div className={Styles.buttonGroup}>
                        <button type="submit" className={Styles.submitBtn}>
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserInfo;