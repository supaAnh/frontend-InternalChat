import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import styles from './Dashboard.module.css';

// Vùng imports các module/components con
import DashboardSidebar from './components/DashboardSidebar/DashboardSidebar';
import DashboardTopBar from './components/DashboardTopBar/DashboardTopBar';
import AnalyticsTab from './components/AnalyticsTab/AnalyticsTab';
import UsersTab from './components/UsersTab/UsersTab';

const Dashboard = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(sessionStorage.getItem('user'));

    // Nếu là user thường, sẽ chỉ thấy màn hình setup
    const isSetupMode = currentUser?.role === 'user';

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('analytics');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [logs, setLogs] = useState([]);
    const [adminsList, setAdminsList] = useState([]);
    const [filterAdmin, setFilterAdmin] = useState('all');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Socket Setup for Real-time Admin Logs
    useEffect(() => {
        const socket = io('http://localhost:5000', { transports: ['websocket'] });
        socket.on('new_admin_log', () => {
            // Kích hoạt auto reload logs và users table
            setRefreshTrigger(prev => prev + 1);
        });
        return () => socket.disconnect();
    }, []);

    useEffect(() => {
        if (refreshTrigger > 0) {
            fetchData();
        }
    }, [refreshTrigger]);

    // Auth Check on mount
    useEffect(() => {
        if (!currentUser) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        if (currentUser && !isSetupMode) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [isSetupMode]);

    const fetchLogs = async () => {
        try {
            const token = sessionStorage.getItem('token');
            let url = `http://localhost:5000/api/admin/logs?`;
            if (filterAdmin !== 'all') url += `adminId=${filterAdmin}&`;
            if (filterStartDate) url += `startDate=${filterStartDate}&`;
            if (filterEndDate) url += `endDate=${filterEndDate}&`;

            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
                setAdminsList(data.admins || []);
            }
        } catch (e) {
            console.error("Lỗi lấy logs");
        }
    };

    useEffect(() => {
        if (currentUser && !isSetupMode) fetchLogs();
    }, [filterAdmin, filterStartDate, filterEndDate]);

    const fetchData = async () => {
        setLoading(true);
        fetchLogs();
        const token = sessionStorage.getItem('token');
        try {
            // Fetch Stats
            const statsRes = await fetch('http://localhost:5000/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (statsRes.ok) setStats(await statsRes.json());

            // Fetch Users
            const usersRes = await fetch('http://localhost:5000/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (usersRes.ok) setUsers(await usersRes.json());

        } catch (error) {
            console.error("Lỗi lấy dữ liệu Admin:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (targetId, newRole) => {
        const token = sessionStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${targetId}/role`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ targetUserId: targetId, newRole })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                fetchData();
            } else {
                alert(data.message || 'Lỗi phân quyền');
            }
        } catch (error) {
            alert('Lỗi khi đổi role');
        }
    };

    const handleToggleStatus = async (targetId, currentStatus) => {
        const token = sessionStorage.getItem('token');
        const newStatus = !currentStatus;
        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${targetId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ targetUserId: targetId, isActive: newStatus })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                fetchData();
            } else {
                alert(data.message || 'Lỗi thao tác');
            }
        } catch (error) {
            alert('Lỗi hệ thống');
        }
    };

    const handleSetupRoot = async () => {
        const token = sessionStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5000/api/admin/setup-root`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                alert("Nâng cấp thành công! Vui lòng đăng xuất và đăng nhập lại để cập nhật quyền hạn.");
                // Cập nhật session storage tạm thời
                const updatedUser = { ...currentUser, role: 'root-admin' };
                sessionStorage.setItem('user', JSON.stringify(updatedUser));
                window.location.reload();
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert("Lỗi");
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <DashboardSidebar 
                sidebarOpen={sidebarOpen} 
                setSidebarOpen={setSidebarOpen} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
            />

            {/* Main Content */}
            <div className={`${styles.mainContent} glass-panel`}>
                <DashboardTopBar 
                    setSidebarOpen={setSidebarOpen} 
                    currentUser={currentUser} 
                />

                <div className={styles.contentArea}>
                    {loading ? (
                        <p>Đang tải dữ liệu...</p>
                    ) : isSetupMode ? (
                        <div style={{ textAlign: 'center', marginTop: '50px' }}>
                            <h2 style={{ color: '#fff', marginBottom: 20 }}>Hệ thống chưa có Quản trị viên</h2>
                            <p style={{ color: '#aaa', marginBottom: 30 }}>Bạn có thể nâng cấp tài khoản của chính mình lên Root-Admin để quản lý hệ thống. Sau khi bấm, vui lòng refresh lại web.</p>
                            <button className={`${styles.actionBtn} ${styles.makeRootBtn}`} style={{ padding: '12px 24px', fontSize: '1rem' }} onClick={handleSetupRoot}>
                                Kích hoạt quyền Root-Admin
                            </button>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'analytics' && stats && (
                                <AnalyticsTab 
                                    stats={stats}
                                    logs={logs}
                                    adminsList={adminsList}
                                    filterAdmin={filterAdmin}
                                    setFilterAdmin={setFilterAdmin}
                                    filterStartDate={filterStartDate}
                                    setFilterStartDate={setFilterStartDate}
                                    filterEndDate={filterEndDate}
                                    setFilterEndDate={setFilterEndDate}
                                />
                            )}

                            {activeTab === 'users' && (
                                <UsersTab 
                                    users={users}
                                    currentUser={currentUser}
                                    fetchData={fetchData}
                                    handleRoleChange={handleRoleChange}
                                    handleToggleStatus={handleToggleStatus}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
