import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import styles from './VoiceMessagePlayer.module.css';

const VoiceMessagePlayer = ({ audioUrl }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(null);

    // Mảng chiều cao giả lập cho waveform 
    const waveformBars = [30, 60, 40, 80, 50, 100, 70, 40, 90, 60, 30, 70, 50, 80, 40, 90, 60, 30, 70, 50];

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Cập nhật thời gian đang phát và tính % tiến độ để tô màu trắng
        const updateTime = () => {
            setCurrentTime(audio.currentTime);
            setProgress((audio.currentTime / audio.duration) * 100);
        };

        // Lấy tổng thời gian của file audio khi vừa load xong
        const handleLoadedMetadata = () => {
            if (audio.duration !== Infinity && !isNaN(audio.duration)) {
                setDuration(audio.duration);
            }
        };

        // Reset lại khi phát xong
        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    // Hàm chuyển đổi giây sang định dạng mm:ss
    const formatTime = (time) => {
        if (!time || isNaN(time)) return "00:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Nếu đang phát thì đếm từ 0 -> duration. Nếu chưa phát hoặc đã phát xong thì hiện tổng thời gian.
    const displayTime = (currentTime > 0 && currentTime < duration) ? formatTime(currentTime) : formatTime(duration);

    return (
        <div className={`${styles.playerContainer} glass-panel`}>
            {/* Thẻ audio ẩn đi, chỉ dùng để xử lý logic */}
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            <button className={styles.playBtn} onClick={togglePlayPause}>
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>

            {/* Khung chứa các thanh sóng âm */}
            <div className={styles.waveform}>
                {waveformBars.map((height, index) => {
                    const barPercentage = (index / waveformBars.length) * 100;
                    // Nếu % của thanh hiện tại nhỏ hơn % tiến độ bài hát => tô màu trắng
                    const isPlayed = barPercentage <= progress; 
                    return (
                        <div
                            key={index}
                            className={styles.bar}
                            style={{
                                height: `${height}%`,
                                backgroundColor: isPlayed ? '#ffffff' : '#000000' 
                            }}
                        />
                    );
                })}
            </div>

            <span className={styles.timeDisplay}>
                {displayTime}
            </span>
        </div>
    );
};

export default VoiceMessagePlayer;