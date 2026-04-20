import React from 'react';
import Styles from './TypingIndicator.module.css';

const TypingIndicator = ({ typingUsers }) => {
    if (!typingUsers || typingUsers.length === 0) return null;

    return (
        <div className={Styles.wrapper}>
            <div className={Styles.text}>
                {typingUsers.length === 1
                    ? `${typingUsers[0].name} đang nhập`
                    : `${typingUsers.length} người đang nhập`}
            </div>
            <div className={Styles.bubble}>
                <div className={Styles.dot}></div>
                <div className={Styles.dot}></div>
                <div className={Styles.dot}></div>
            </div>
        </div>
    );
};

export default TypingIndicator;
