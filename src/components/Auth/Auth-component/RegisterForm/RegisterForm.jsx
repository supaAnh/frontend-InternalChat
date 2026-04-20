import React, { useState } from 'react';
import Styles from '../LoginForm/Form.module.css';
import PopupNotification from '../../../common/Popup/PopupNotification';

const RegisterForm = ({ setAuthMode }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        otp: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [popup, setPopup] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const closePopup = () => {
        setPopup({ ...popup, isOpen: false });
        if (popup.title === 'Chúc mừng' && setAuthMode) {
            setAuthMode('login');
        }
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();

        // 1. Kiểm tra mật khẩu khớp nhau
        if (formData.password !== formData.confirmPassword) {
            setPopup({
                isOpen: true,
                type: 'warning',
                title: 'Cảnh báo',
                message: 'Mật khẩu không khớp!'
            });
            return;
        }

        setIsLoading(true);
        try {
            // 2. Kiểm tra Email và Username đã tồn tại chưa
            const checkResponse = await fetch('http://localhost:5000/api/auth/check-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    username: formData.username
                })
            });

            const checkData = await checkResponse.json();

            // Nếu Backend trả về lỗi do trùng lặp
            if (!checkResponse.ok) {
                setPopup({
                    isOpen: true,
                    type: 'error',
                    title: 'Đăng ký thất bại',
                    message: checkData.message || 'Email hoặc Tên tài khoản đã tồn tại!'
                });
                setIsLoading(false);
                return; // Dừng lại, không gửi OTP nữa
            }

            // 3. Nếu không trùng lặp, tiến hành gửi OTP
            const response = await fetch('http://localhost:5000/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email })
            });

            const data = await response.json();

            if (response.ok) {
                setPopup({
                    isOpen: true,
                    type: 'success',
                    title: 'Gửi thành công',
                    message: 'Đã gửi mã OTP đến email của bạn!'
                });
                setStep(2);
            } else {
                setPopup({
                    isOpen: true,
                    type: 'error',
                    title: 'Gửi OTP thất bại',
                    message: data.message || 'Không thể gửi mã OTP.'
                });
            }

        } catch (error) {
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Lỗi kết nối',
                message: error.message || 'Không thể kết nối đến máy chủ.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    otp: formData.otp
                })
            });

            const data = await response.json();

            if (response.ok) {
                setPopup({
                    isOpen: true,
                    type: 'success',
                    title: 'Chúc mừng',
                    message: 'Bạn đã tạo tài khoản thành công!'
                });
                setTimeout(() => {
                    if (setAuthMode) {
                        setAuthMode('login');
                    }
                }, 2000);
            } else {
                setPopup({
                    isOpen: true,
                    type: 'error',
                    title: 'Thất bại',
                    message: data.message || 'Mã OTP không hợp lệ.'
                });
            }
        } catch (error) {
            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Lỗi kết nối',
                message: error.message || 'Không thể kết nối đến máy chủ.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <form className={Styles.formContainer} onSubmit={step === 1 ? handleSendOTP : handleRegister}>
                {step === 1 && (
                    <>
                        <div className={Styles.formGroup}>
                            <label>Nhập email:</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                        </div>

                        <div className={Styles.formGroup}>
                            <label>Tên tài khoản:</label>
                            <input type="text" name="username" value={formData.username} onChange={handleChange} required />
                        </div>

                        <div className={Styles.formGroup}>
                            <label>Mật khẩu:</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                        </div>

                        <div className={Styles.formGroup}>
                            <label>Xác nhận mật khẩu:</label>
                            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                        </div>

                        <button type="submit" className={Styles.submitBtn} disabled={isLoading}>
                            {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
                        </button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className={Styles.formGroup}>
                            <label>Nhập mã OTP (gồm 6 chữ số):</label>
                            <input type="number" name="otp" value={formData.otp} onChange={handleChange} required maxLength="6" />
                        </div>
                        <button type="submit" className={Styles.submitBtn} disabled={isLoading}>
                            {isLoading ? 'Đang xác thực...' : 'Hoàn tất đăng ký'}
                        </button>
                    </>
                )}
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

export default RegisterForm;