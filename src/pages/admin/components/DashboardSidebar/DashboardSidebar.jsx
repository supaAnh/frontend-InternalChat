import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ArrowLeft, X as XIcon } from 'lucide-react';
import styles from './DashboardSidebar.module.css';

const DashboardSidebar = ({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab }) => {
    const navigate = useNavigate();

    return (
        <>
            {/* Overlay mobile */}
            {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)}></div>}

            {/* Sidebar */}
            <div className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''} glass-panel`}>
                <div className={styles.sidebarHeader}>
                    <h2>Bảng Điều Khiển</h2>
                    <button className={styles.closeMenuBtn} onClick={() => setSidebarOpen(false)}>
                        <XIcon size={20} />
                    </button>
                </div>

                <div className={styles.sidebarNav}>
                    <div
                        className={`${styles.navItem} ${activeTab === 'analytics' ? styles.active : ''}`}
                        onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }}
                    >
                        <LayoutDashboard size={18} style={{ marginRight: 8 }} /> Tổng quan
                    </div>
                    <div
                        className={`${styles.navItem} ${activeTab === 'users' ? styles.active : ''}`}
                        onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}
                    >
                        <Users size={18} style={{ marginRight: 8 }} /> Quản lý Nhân sự
                    </div>
                </div>

                <button className={`${styles.backHomeBtn} glass-panel`} onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowLeft size={18} style={{ marginRight: 8 }} /> Quay lại Chat
                </button>
            </div>
        </>
    );
};

export default DashboardSidebar;
