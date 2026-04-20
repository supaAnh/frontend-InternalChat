import React from 'react';
import Styles from './Toggle.module.css';

const Toggle = ({ authMode, setAuthMode }) => {
  return (
    <div className={Styles.toggleContainer}>
        
        <div 
            className={Styles.toggleBg} 
            style={{ backgroundImage: `url('/wave-bg.png')` }} 
        ></div>
        
        {/* So sánh với 'login' */}
        <div className={`${Styles.activeSlider} ${authMode === 'login' ? Styles.sliderLeft : Styles.sliderRight} glass-panel`}></div>
        
        <button 
            className={`${Styles.toggleBtn} ${authMode === 'login' ? Styles.activeText : ''} `} 
            onClick={() => setAuthMode('login')}
            type="button"
        >
            Đăng nhập
        </button>
        <button 
            className={`${Styles.toggleBtn} ${authMode === 'register' ? Styles.activeText : ''}`} 
            onClick={() => setAuthMode('register')}
            type="button"
        >
            Đăng ký
        </button>
    </div>
  );
}

export default Toggle;