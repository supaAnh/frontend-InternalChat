import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut, Shield } from 'lucide-react';
import Styles from './Titles.module.css';
import UserInfo from '../../../Auth/Auth-component/UserInfo/UserInfo';
import PopupNotification from '../../../common/Popup/PopupNotification';

const Titles = ({ currentUser, onUpdateUser }) => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isUserInfoOpen, setIsUserInfoOpen] = useState(false);
    
    const popupRef = useRef(null);
    
    const [popup, setPopup] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    });

    const closePopup = () => {
        setPopup({ ...popup, isOpen: false });
    };

    useEffect(() => {
    // 1. Phải kiểm tra xem currentUser đã load xong chưa
    if (currentUser) {
        if (!currentUser.displayName || !currentUser.avatar) {
            setIsUserInfoOpen(true);
        }
    }
}, [currentUser]);


    // Xử lý click ra ngoài để đóng popup menu nhỏ
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setIsPopupOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Xử lý đăng xuất
    const handleLogout = async () => {
        try {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token'); 
            const currentUserId = currentUser?._id || currentUser?.id;

            // Gửi thông báo đăng xuất lên Backend kèm theo userId
            if (token && currentUserId) {
                const response = await fetch('http://localhost:5000/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ userId: currentUserId }) 
                });

                if (!response.ok) {
                    console.error("Backend báo lỗi không thể logout");
                }
            }
        } catch (error) {
            console.error("Lỗi kết nối khi thông báo đăng xuất cho BE:", error);
        } finally {
            // Đóng menu nhỏ
            setIsPopupOpen(false);

            // Hiển thị thông báo thành công
            setPopup({
                isOpen: true,
                type: 'success',
                title: 'Chúc mừng',
                message: 'Bạn đã đăng xuất thành công!'
            });

            // Chờ 1 giây để user đọc thông báo, sau đó xóa dữ liệu và chuyển hướng
            setTimeout(() => {
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('user');

                window.location.href = '/login'; 
            }, 1000);
        }
    };

    const handleProfile = () => {
        setIsPopupOpen(false);
        setIsUserInfoOpen(true);
    };

    return (
        <>
            <div className={Styles.titlesContainer}>
                <p className={Styles.logoText}>
                    LOWKEY<br />CHAT
                </p>

                {/* Vùng chứa Avatar và Popup Menu */}
                <div className={Styles.userSection} ref={popupRef}>
                    <div 
                        className={Styles.avatarWrapper}
                        onClick={() => setIsPopupOpen(!isPopupOpen)}
                        title="Menu tài khoản"
                    >
                        {/* Hiển thị avatar hoặc placeholder */}
                        {currentUser?.avatar ? (
                            <img src={currentUser.avatar} alt="avatar" className={Styles.avatar} />
                        ) : (
                            <div className={Styles.avatarPlaceholder}></div>
                        )}
                    </div>

                    {/* Khung Popup hiện lên khi click vào avatar */}
                    {isPopupOpen && (
                        <div className={`${Styles.popupMenu} glass-panel`}>
                            <button className={Styles.menuItem} onClick={handleProfile}>
                                <User size={18} />
                                <span>Thông tin cá nhân</span>
                            </button>
                            
                            <div className={Styles.divider}></div>

                            {(currentUser?.role === 'admin' || currentUser?.role === 'root-admin') && (
                                <>
                                    <button className={Styles.menuItem} onClick={() => window.location.href = '/admin'}>
                                        <Shield size={18} />
                                        <span>Chế độ Admin</span>
                                    </button>
                                    <div className={Styles.divider}></div>
                                </>
                            )}

                            <button className={`${Styles.menuItem} ${Styles.logoutBtn}`} onClick={handleLogout}>
                                <LogOut size={18} />
                                <span>Đăng xuất</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <UserInfo 
                isOpen={isUserInfoOpen} 
                onClose={() => setIsUserInfoOpen(false)} 
                currentUser={currentUser} 
                onUpdateUser={onUpdateUser} 
            />

            {/* Gọi Component Popup Notification */}
            <PopupNotification 
                isOpen={popup.isOpen}
                type={popup.type}
                title={popup.title}
                message={popup.message}
                onClose={closePopup}
            />
        </>
    );
};

export default Titles;