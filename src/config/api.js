export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_URL = `${BASE_URL}/api`;

export const getAvatarUrl = (url) => {
    if (!url) return '';
    
    // Nếu trong Database bị dính cứng http://localhost:5000 từ lần test local trước đó
    if (url.includes('localhost:5000')) {
        return url.replace(/http:\/\/localhost:5000/g, BASE_URL);
    }
    
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
        return url;
    }
    
    // Nếu Backend chỉ trả về mỗi tên file hoặc đường dẫn tương đối
    if (url.startsWith('uploads/') || url.startsWith('/uploads/') || !url.includes('/')) {
        return `${BASE_URL}${url.startsWith('/') ? '' : '/uploads/'}${url.replace('uploads/', '')}`;
    }
    
    return url;
};
