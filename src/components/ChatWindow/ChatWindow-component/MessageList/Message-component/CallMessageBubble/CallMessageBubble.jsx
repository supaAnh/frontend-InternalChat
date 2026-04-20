import React from 'react';
import { Phone, PhoneMissed, Video, VideoOff, PhoneOutgoing, PhoneIncoming } from 'lucide-react';
import Styles from './CallMessageBubble.module.css';

const CallMessageBubble = ({ message, onCallAgain, isMyMessage }) => {
    const isVideo = message.callType === 'video';
    const isMissed = message.callStatus === 'missed' || message.callStatus === 'declined';

    const getIcon = () => {
        if (isMissed) {
            return isVideo ? <VideoOff size={20} color="#ff3b30" /> : <PhoneMissed size={20} color="#ff3b30" />;
        }

        if (isVideo) {
            return <Video size={20} color="#1B1E2E" />;
        }

        return isMyMessage ? <PhoneOutgoing size={20} color="#1B1E2E" /> : <PhoneIncoming size={20} color="#1B1E2E" />;
    };

    return (
        <div className={`glass-panel ${Styles.callBubbleContainer} ${isMyMessage ? Styles.myCall : Styles.theirCall}`}>
            <div className={Styles.callHeader}>
                <div className={`${Styles.iconWrapper} ${isMissed ? Styles.missedBg : ''}`}>
                    {getIcon()}
                </div>
                <div className={Styles.callInfo}>
                    <h4 className={`${Styles.title} ${isMyMessage ? Styles.whiteText : ''}`}>
                        {isVideo ? 'Cuộc gọi video' : 'Cuộc gọi thoại'}
                    </h4>
                    <p className={`${Styles.subtitle} ${isMyMessage ? Styles.lightText : ''}`}>
                        {isMissed ? 'Cuộc gọi nhỡ' : `Thời lượng: ${message.callDuration || 0}s`}
                    </p>
                </div>
            </div>

            <div className={`${Styles.divider} ${isMyMessage ? Styles.myDivider : ''}`}></div>

            <div
                className={Styles.actionButton}
                onClick={() => onCallAgain(message.callType || 'voice')}
            >
                Gọi lại
            </div>
        </div>
    );
};

export default CallMessageBubble;