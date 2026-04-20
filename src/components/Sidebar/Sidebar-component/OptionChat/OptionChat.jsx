import React from 'react';
import Styles from './OptionChat.module.css';

//nhận activeTab và onTabChange từ Sidebar
function OptionChat({ activeTab, onTabChange }) {
    return (
        <div>
            <div className={Styles.optionChatBtn}>
                <button
                    className={`${Styles.btnSelection} ${activeTab === 'all' ? Styles.active : ''}`}
                    onClick={() => onTabChange('all')}
                >
                    Tất cả
                </button>

                <button
                    className={`${Styles.btnSelection} ${activeTab === 'unread' ? Styles.active : ''}`}
                    onClick={() => onTabChange('unread')}
                >
                    Chưa đọc
                </button>

                <button
                    className={`${Styles.btnSelection} ${activeTab === 'group' ? Styles.active : ''}`}
                    onClick={() => onTabChange('group')}
                >
                    Nhóm
                </button>
            </div>
        </div>
    );
}

export default OptionChat;
