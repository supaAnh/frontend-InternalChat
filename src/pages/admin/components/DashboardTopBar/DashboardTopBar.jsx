import React from 'react';
import { Menu as MenuIcon } from 'lucide-react';
import styles from './DashboardTopBar.module.css';

const DashboardTopBar = ({ setSidebarOpen, currentUser }) => {
    return (
        <div className={styles.topBar}>
            <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
                <MenuIcon size={24} />
            </button>
            <div>Dashboard - {currentUser?.displayName || currentUser?.username}
                <span className={`${styles.badge} ${styles[currentUser?.role === 'root-admin' ? 'rootAdmin' : 'admin']}`} style={{ marginLeft: 10 }}>
                    {currentUser?.role === 'root-admin' ? 'Root Admin' : 'Admin'}
                </span>
            </div>
        </div>
    );
};

export default DashboardTopBar;
