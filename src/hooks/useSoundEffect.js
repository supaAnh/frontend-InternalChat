import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook quản lý âm thanh và rung thiết bị
 * @param {string} src - Đường dẫn tới file âm thanh trong /public
 * @param {Object} options
 * @param {boolean} options.loop - Lặp lại vô tận (cho ringtone)
 * @param {number} options.volume - Âm lượng từ 0 đến 1
 */
const useSoundEffect = (src, { loop = false, volume = 1 } = {}) => {
    const audioRef = useRef(null);
    const vibrationTimerRef = useRef(null);

    const playVibration = useCallback((pattern) => {
        try {
            if ('vibrate' in navigator) {
                // Kiểm tra xem người dùng đã tương tác với trang chưa để tránh lỗi Intervention của Chrome
                if (navigator.userActivation && !navigator.userActivation.hasBeenActive) {
                    return;
                }
                navigator.vibrate(pattern);
            }
        } catch (error) {
        }
    }, []);

    const stopVibration = useCallback(() => {
        try {
            if ('vibrate' in navigator) {
                if (!navigator.userActivation || navigator.userActivation.hasBeenActive) {
                    navigator.vibrate(0);
                }
            }
        } catch (error) {
        }

        if (vibrationTimerRef.current) {
            clearInterval(vibrationTimerRef.current);
            vibrationTimerRef.current = null;
        }
    }, []);

    // Khởi tạo Audio trước và xin quyền Autoplay 
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio(src);
            audioRef.current.preload = 'auto';

            // Hàm lấy quyền phát âm thanh nền từ trình duyệt
            const unlockAudio = () => {
                if (audioRef.current) {
                    const p = audioRef.current.play();
                    if (p !== undefined) {
                        p.then(() => {
                            audioRef.current.pause();
                            audioRef.current.currentTime = 0;
                        }).catch(() => { });
                    }
                }
                // Xin quyền 1 lần duy nhất rồi xoá event
                document.removeEventListener('click', unlockAudio);
                document.removeEventListener('keydown', unlockAudio);
                document.removeEventListener('touchstart', unlockAudio);
            };

            document.addEventListener('click', unlockAudio);
            document.addEventListener('keydown', unlockAudio);
            document.addEventListener('touchstart', unlockAudio);

            return () => {
                document.removeEventListener('click', unlockAudio);
                document.removeEventListener('keydown', unlockAudio);
                document.removeEventListener('touchstart', unlockAudio);
            };
        }
    }, [src]);

    const play = useCallback(() => {
        try {
            if (!audioRef.current) {
                audioRef.current = new Audio(src);
            }
            audioRef.current.loop = loop;
            audioRef.current.volume = volume;
            audioRef.current.currentTime = 0;

            // Promise play() có thể bị pause lại nếu userActivations chưa đủ
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                });
            }
        } catch (e) {
            console.warn('[SoundEffect] Lỗi phát âm thanh:', e);
        }
    }, [src, loop, volume]);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, []);


    const startRinging = useCallback(() => {
        play();
        // Rung theo nhịp chuông điện thoại
        const vibrationPattern = [400, 200, 400, 400];
        playVibration(vibrationPattern);
        vibrationTimerRef.current = setInterval(() => {
            playVibration(vibrationPattern);
        }, 1400);
    }, [play, playVibration]);

    const stopRinging = useCallback(() => {
        stop();
        stopVibration();
    }, [stop, stopVibration]);


    const playOnce = useCallback((vibrationPattern = [200]) => {
        play();
        playVibration(vibrationPattern);
    }, [play, playVibration]);


    const playForDuration = useCallback((durationMs, vibrationPattern = [300]) => {
        play();
        playVibration(vibrationPattern);
        setTimeout(() => {
            stop();
            stopVibration();
        }, durationMs);
    }, [play, stop, playVibration, stopVibration]);

    return { play, stop, startRinging, stopRinging, playOnce, playForDuration };
};

export default useSoundEffect;
