    import React, { useState } from 'react';
    import Styles from './Form.module.css';
    import PopupNotification from '../../../common/Popup/PopupNotification';
import { API_URL } from '../../../../config/api';
    
    // Nhận setAuthMode từ AuthPage
    const LoginForm = ({ setAuthMode }) => {
        const [isLoading, setIsLoading] = useState(false);
        const [formData, setFormData] = useState({
            username: '',
            password: ''
        });
        const handleChange = (e) => {
            setFormData({ ...formData, [e.target.name]: e.target.value});
        };

        const [popup, setPopup] = useState({
            isOpen: false,
            type: 'success',
            title: '',
            message: '',
        });
        const closePopup = () => {
            setPopup({
                ...popup, isOpen: false
            });
        };

        const handleLogin = async (e) => {
        e.preventDefault();

        // 1. Kiểm tra đầu vào
        if (!formData.username || !formData.password) {
            setPopup({
                isOpen: true,
                type: 'warning',
                title: 'Cảnh báo',
                message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu'
            });
            return;
        }

        setIsLoading(true);

        try {
            // 2. Gọi API Login
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('user', JSON.stringify(data.user));

                setPopup({
                    isOpen: true,
                    type: 'success',
                    title: 'Chúc mừng',
                    message: 'Bạn đã đăng nhập tài khoản thành công!'
                });
                
                // Chuyển hướng sau khi hiện thông báo thành công
                setTimeout(() => {
                    window.location.href = '/';
                }, 500);

            } else {
                setPopup({
                    isOpen: true,
                    type: 'error',
                    title: 'Đăng nhập thất bại',
                    message: data.message || 'Thông tin đăng nhập không chính xác'
                });
            }
        } catch (error) {
            console.error('Lỗi API Login', error);
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Lỗi hệ thống',
                message: 'Không thể kết nối đến máy chủ, vui lòng thử lại sau.'
            });
        } finally {
            setIsLoading(false);
        }
    };

        return (
            <>
                <form className={Styles.formContainer} onSubmit={handleLogin}>
                <div className={Styles.formGroup}>
                    <label>Tên đăng nhập:</label>
                    <input 
                        type="text" 
                        value={formData.username} 
                        onChange={handleChange} 
                        name="username"
                        required 
                    />
                </div>
                
                <div className={Styles.formGroup}>
                    <label>Mật khẩu:</label>
                    <input 
                        type="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        name="password"
                        required 
                    />
                </div>

                <div className={Styles.forgotPassword}>
                    {/* Gọi setAuthMode('forgot') khi click */}
                    <a href="#" onClick={(e) => {
                        e.preventDefault();
                        setAuthMode('forgot');
                    }}>Quên mật khẩu?</a>
                </div>

                <button type="submit" className={Styles.submitBtn} disabled={isLoading}>
                    {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                </button>
            </form>

            {/* POPUP */}
                <PopupNotification 
                    isOpen={popup.isOpen}
                    type={popup.type}
                    title={popup.title}
                    message={popup.message}
                    onConfirm={closePopup}
                />
            </>
        );
    };

    export default LoginForm;