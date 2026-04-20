import React, { useState } from 'react';
import Styles from '../LoginForm/Form.module.css';
import PopupNotification from '../../../common/Popup/PopupNotification';
import { API_URL } from '../../../../config/api';

const ResetPassword = ({ setAuthMode }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        otp: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    const [popup, setPopup] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
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

    // Kiểm tra email và gửi OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email })
            });

            const data = await response.json();

            // Nếu Backend kiểm tra email tồn tại và gửi OTP thành công
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
                    title: 'Lỗi',
                    message: data.message || 'Email không tồn tại hoặc không thể gửi OTP.'
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
    
    // Kiểm tra OTP và đổi mật khẩu
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmNewPassword) {
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
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    otp: formData.otp,
                    newPassword: formData.newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                setPopup({
                    isOpen: true,
                    type: 'success',
                    title: 'Chúc mừng',
                    message: 'Bạn đã thay đổi mật khẩu thành công!'
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
                    message: data.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.'
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
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ color: 'white', marginBottom: '15px', marginTop: '0' }}>Quên mật khẩu</h2>
            
            <form className={Styles.formContainer} style={{ marginTop: '0' }} onSubmit={step === 1 ? handleSendOtp : handleSubmit}>
                
                {/* --- BƯỚC 1 --- */}
                {step === 1 && (
                    <>
                        <div className={Styles.formGroup}>
                            <label>Nhập email tài khoản của bạn:</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                        </div>
                        
                        <button type="submit" className={Styles.submitBtn} disabled={isLoading}>
                            {isLoading ? 'Đang xử lý...' : 'Tiếp tục'}
                        </button>

                        <div className={Styles.forgotPassword} style={{ textAlign: 'center', marginTop: '15px' }}>
                            <a href="#" onClick={(e) => { e.preventDefault(); setAuthMode('login'); }}>
                                Quay lại Đăng nhập
                            </a>
                        </div>
                    </>
                )}

                {/* --- BƯỚC 2 --- */}
                {step === 2 && (
                    <>
                        <div className={Styles.formGroup}>
                            <label>Nhập mã OTP (đã gửi tới email):</label>
                            <div className={Styles.otpWrapper}>
                                <input type="text" name="otp" value={formData.otp} onChange={handleChange} required className={Styles.otpInput} maxLength="6" />
                                <button type="button" className={Styles.getOtpBtn} onClick={handleSendOtp} disabled={isLoading}>
                                    Gửi lại
                                </button>
                            </div>
                        </div>
                        
                        <div className={Styles.formGroup}>
                            <label>Mật khẩu mới:</label>
                            <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} required />
                        </div>

                        <div className={Styles.formGroup}>
                            <label>Xác nhận mật khẩu mới:</label>
                            <input type="password" name="confirmNewPassword" value={formData.confirmNewPassword} onChange={handleChange} required />
                        </div>

                        <button type="submit" className={Styles.submitBtn} disabled={isLoading}>
                            {isLoading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
                        </button>

                        <div className={Styles.forgotPassword} style={{ textAlign: 'center', marginTop: '15px' }}>
                            <a href="#" onClick={(e) => { e.preventDefault(); setAuthMode('login'); }}>
                                Hủy và Quay lại Đăng nhập
                            </a>
                        </div>
                    </>
                )}
            </form>

            <PopupNotification 
                isOpen={popup.isOpen}
                type={popup.type}
                title={popup.title}
                message={popup.message}
                onConfirm={closePopup}
            />
        </div>
    );
};

export default ResetPassword;