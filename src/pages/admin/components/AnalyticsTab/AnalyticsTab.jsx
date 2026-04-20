import React from 'react';
import styles from './AnalyticsTab.module.css';

const AnalyticsTab = ({ 
    stats, 
    logs, 
    adminsList, 
    filterAdmin, 
    setFilterAdmin, 
    filterStartDate, 
    setFilterStartDate, 
    filterEndDate, 
    setFilterEndDate 
}) => {
    return (
        <div>
            <h2 className={styles.sectionTitle}>Số liệu thống kê</h2>
            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} glass-panel`}>
                    <h3>Tổng người dùng</h3>
                    <p className={styles.statValue}>{stats.users.total}</p>
                </div>
                <div className={`${styles.statCard} glass-panel`}>
                    <h3>Đang online</h3>
                    <p className={styles.statValue} style={{ color: '#4CAF50' }}>{stats.users.online}</p>
                </div>
                <div className={`${styles.statCard} glass-panel`}>
                    <h3>Tài khoản đã khoá</h3>
                    <p className={styles.statValue} style={{ color: '#F44336' }}>{stats.users.deactivated}</p>
                </div>
                <div className={`${styles.statCard} glass-panel`}>
                    <h3>Tổng tin nhắn</h3>
                    <p className={styles.statValue}>{stats.messages.total}</p>
                </div>
                <div className={`${styles.statCard} glass-panel`}>
                    <h3>Nhóm nội bộ</h3>
                    <p className={styles.statValue}>{stats.conversations.groups}</p>
                </div>
            </div>

            {/* LỊCH SỬ HOẠT ĐỘNG */}
            <h2 className={styles.sectionTitle} style={{ marginTop: '30px' }}>Lịch sử Hoạt động</h2>
            <div className={`${styles.logContainer} glass-panel`}>
                <div className={styles.logFilters}>
                    <select value={filterAdmin} onChange={(e) => setFilterAdmin(e.target.value)} className={styles.roleSelect}>
                        <option value="all">Tất cả Admin chung</option>
                        {adminsList.map(a => <option key={a._id} value={a._id}>{a.username} ({a.role})</option>)}
                    </select>
                    <span style={{ margin: '0 5px' }}>Từ ngày:</span>
                    <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className={styles.dateInput} />
                    <span style={{ margin: '0 5px' }}>Đến ngày:</span>
                    <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className={styles.dateInput} />
                </div>

                <div className={styles.logList}>
                    {logs.map(log => (
                        <div key={log._id} className={styles.logItem}>
                            <div className={styles.logTime}>
                                {new Date(log.createdAt).toLocaleString('vi-VN')} - <strong>{log.adminName}</strong>
                            </div>
                            <div className={styles.logText}>{log.details}</div>
                        </div>
                    ))}
                    {logs.length === 0 && <p style={{ color: '#aaa', padding: '10px 0' }}>Không có lịch sử hoạt động</p>}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsTab;
