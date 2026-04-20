import React, { useState } from 'react';
import Toggle from '../../components/Auth/Auth-component/Toggle/Toggle';
import LoginForm from '../../components/Auth/Auth-component/LoginForm/LoginForm';
import RegisterForm from '../../components/Auth/Auth-component/RegisterForm/RegisterForm';
import ResetPassword from '../../components/Auth/Auth-component/ResetPassword/ResetPassword'; // Import component mới
import Styles from './AuthPage.module.css';
import '../../index.css';

const AuthPage = () => {
    // Đổi state sang quản lý 3 trạng thái: 'login', 'register', 'forgot'
    const [authMode, setAuthMode] = useState('login');

    return (
        <div className={Styles.pageContainer}>
            <div className={`${Styles.authBox} glass-panel`}>

                {/* Chỉ hiển thị Toggle khi không nằm ở màn hình Quên mật khẩu */}
                {authMode !== 'forgot' && (
                    <Toggle authMode={authMode} setAuthMode={setAuthMode} />
                )}

                {/* Render Form tương ứng dựa trên state */}
                {authMode === 'login' && <LoginForm setAuthMode={setAuthMode} />}
                {authMode === 'register' && <RegisterForm setAuthMode={setAuthMode} />}
                {authMode === 'forgot' && <ResetPassword setAuthMode={setAuthMode} />}

            </div>
        </div>
    );
};

export default AuthPage;