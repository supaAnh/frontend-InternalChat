import React from 'react';
import { Download, FileText } from 'lucide-react';
import styles from './MessageAttachment.module.css';

const MessageAttachment = ({ fileUrl, fileName, fileSize, fileType }) => {
  // Kiểm tra xem file đính kèm có phải là hình ảnh không
    const isImage = fileType && fileType.startsWith('image/');

  // Click để mở sang tab mới
    if (isImage) {
        return (
        <div className={styles['attachment-image-wrapper']}>
            <a 
                href={fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Nhấn để xem ảnh gốc"
            >
                <img src={fileUrl} alt={fileName} className={styles['attachment-image']} />
            </a>
        </div>
        );
    }

    const handleDownload = async (e) => {
        // Ngăn trình duyệt tự ý chuyển trang / mở tab
        e.preventDefault(); 
        try {
            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const blob = await response.blob();
            // Tạo 1 đường link giả URL nội bộ
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName || 'downloaded_file';
            document.body.appendChild(link);
            link.click();
            
            // Dọn dẹp
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.warn("Không thể ép tải xuống do CORS, fallback mở link thường:", error);
            window.open(fileUrl, '_blank'); // Nếu lỗi CORS thì mở tab phụ
        }
    };

  // Nếu file khác giao diện File Card có nút Download
    return (
        <div className={`${styles['attachment-file-card']} glass-panel`}>
            <div className={styles['file-icon-wrapper']}>
                <FileText size={24} strokeWidth={2} />
            </div>

            <div className={styles['file-details']}>
                <span className={styles['file-name']}>{fileName}</span>
                <span className={styles['file-size']}>{fileSize}</span>
            </div>

            <a 
                href={fileUrl} 
                onClick={handleDownload}
                className={styles['file-download-btn']} 
                title="Tải xuống"
            >
                <Download size={20} strokeWidth={2} />
            </a>
        </div>
    );
};

export default MessageAttachment;