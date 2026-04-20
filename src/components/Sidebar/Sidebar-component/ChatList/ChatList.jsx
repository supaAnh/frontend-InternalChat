import React, { useState, useEffect, useRef } from 'react';
import Styles from './ChatList.module.css';
import useSoundEffect from '../../../../hooks/useSoundEffect';
import { API_URL, getAvatarUrl } from '../../../../config/api';

const ChatList = ({ selectedChatId, onSelectChat, onDeleteChat, currentUserId, socket, externalFetchTrigger, activeTab }) => {
    // STATE QUẢN LÝ DANH SÁCH CHAT
    const [chats, setChats] = useState([]);
    const [fetchTrigger, setFetchTrigger] = useState(0);
    const { playOnce: playMessageSound } = useSoundEffect('/SoundEffect/message-incoming.mp3', { volume: 0.8 });

    // STATE CHO CONTEXT MENU VÀ XÁC NHẬN XOÁ
    const [contextMenu, setContextMenu] = useState(null); // { x, y, chatId, chatName }
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [chatToDelete, setChatToDelete] = useState(null);
    const contextMenuRef = useRef(null);

    // GỌI API LẤY DANH SÁCH CHAT KHI COMPONENT MOUNT
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const response = await fetch(`${API_URL}/conversations/chat-list`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();

                    const formattedChats = data.map(chat => ({
                        id: chat._id || chat.id,
                        isGroup: chat.isGroup,
                        displayName: chat.displayName,
                        groupName: chat.groupName,
                        avatar: chat.avatar,
                        lastMessage: chat.lastMessage,
                        lastSenderId: chat.lastSenderId,
                        time: chat.time,
                        timestamp: chat.timestamp || Date.now(),
                        isUnread: chat.isUnread !== undefined ? chat.isUnread : false,
                        // Thêm các field trạng thái và thành viên
                        otherUserId: chat.otherUserId || null,
                        isOnline: chat.isOnline || false,
                        lastActive: chat.lastActive || null,
                        memberCount: chat.memberCount || null,
                        adminId: chat.adminId || null
                    }));

                    setChats(formattedChats);
                }
            } catch (error) {
                console.error("Lỗi lấy danh sách chat trong ChatList:", error);
            }
        };

        if (currentUserId) {
            fetchChats();
        }
    }, [currentUserId, fetchTrigger, externalFetchTrigger]);

    // LẮNG NGHE SỰ KIỆN TIN NHẮN MỚI TỪ SOCKET
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (incomingMessage) => {
            const conversationId = String(incomingMessage.conversationId?._id || incomingMessage.conversationId || '');
            const isCurrentlyOpen = selectedChatId && String(selectedChatId) === conversationId;
            const isTabHidden = document.hidden || !document.hasFocus(); // Tab đang ở chế độ nền hoặc người dùng nhấp ra ngoài trình duyệt

            // Format nội dung text
            let textToShow = incomingMessage.text;
            if (!textToShow && incomingMessage.mediaType && incomingMessage.mediaType !== 'none') {
                const mediaLabels = {
                    image: "[Hình ảnh]",
                    video: "[Video]",
                    audio: "[Tin nhắn thoại]",
                    voice: "[Tin nhắn thoại]",
                    file: "[Tập tin]"
                };
                textToShow = mediaLabels[incomingMessage.mediaType] || "[Tập tin đính kèm]";
            }
            if (incomingMessage.type === 'call') {
                textToShow = `[Cuộc gọi] ${incomingMessage.text || ''}`.trim();
            }

            const messageTime = incomingMessage.createdAt ? new Date(incomingMessage.createdAt) : new Date();
            const timeString = messageTime.toDateString() === new Date().toDateString()
                ? messageTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                : messageTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

            setChats(prevChats => {
                const existingChatIndex = prevChats.findIndex(c => String(c.id) === conversationId);
                let updatedChats = [...prevChats];

                if (existingChatIndex > -1) {
                    const chatToUpdate = { ...updatedChats[existingChatIndex] };

                    // Ghép prefix nhất quán với backend ChatListController
                    const senderName = incomingMessage.senderId?.displayName || incomingMessage.senderId?.username || '';
                    const displayText = chatToUpdate.isGroup && senderName
                        ? `${senderName}: ${textToShow}`
                        : textToShow;

                    chatToUpdate.lastMessage = displayText;
                    chatToUpdate.lastSenderId = incomingMessage.senderId?._id || incomingMessage.senderId;
                    chatToUpdate.time = timeString;
                    chatToUpdate.timestamp = messageTime.getTime();
                    chatToUpdate.isUnread = !isCurrentlyOpen;

                    // Phát âm thanh + rung nếu: Đang không mở chat này HOẶC Tab đang bị ẩn
                    if (!isCurrentlyOpen || isTabHidden) {
                        playMessageSound([100]);
                    }

                    updatedChats.splice(existingChatIndex, 1);
                    return [chatToUpdate, ...updatedChats];
                } else {
                    // Nếu là người mới gửi tin chưa có trong danh sách chat
                    if (!isCurrentlyOpen || isTabHidden) {
                        playMessageSound([100]);
                    }
                    setFetchTrigger(prev => prev + 1);
                    return prevChats;
                }
            });
        };

        socket.on("receive_message", handleReceiveMessage);
        return () => socket.off("receive_message", handleReceiveMessage);
    }, [socket, selectedChatId]);

    // LẮNG NGHE KHI CHÍNH MÌNH GỬI TIN
    useEffect(() => {
        if (!socket) return;

        const handleSentMessage = (outgoingMessage) => {
            const conversationId = String(outgoingMessage.conversationId?._id || outgoingMessage.conversationId || '');

            let textToShow = outgoingMessage.text;
            if (outgoingMessage.type === 'call') {
                textToShow = `[Cuộc gọi] ${textToShow || ''}`.trim();
            } else if (!textToShow && outgoingMessage.mediaType && outgoingMessage.mediaType !== 'text') {
                const mediaLabels = { image: "[Hình ảnh]", video: "[Video]", voice: "[Tin nhắn thoại]", file: "[Tập tin]" };
                textToShow = mediaLabels[outgoingMessage.mediaType] || "[Tập tin đính kèm]";
            }

            const messageTime = outgoingMessage.createdAt ? new Date(outgoingMessage.createdAt) : new Date();
            const timeString = messageTime.toDateString() === new Date().toDateString()
                ? messageTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                : messageTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

            setChats(prevChats => {
                const existingIndex = prevChats.findIndex(c => String(c.id) === conversationId);
                let updatedChats = [...prevChats];

                if (existingIndex > -1) {
                    const chatToUpdate = { ...updatedChats[existingIndex] };
                    chatToUpdate.lastMessage = `Tôi: ${textToShow}`;
                    chatToUpdate.lastSenderId = currentUserId;
                    chatToUpdate.time = timeString;
                    chatToUpdate.timestamp = messageTime.getTime();
                    chatToUpdate.isUnread = false;
                    updatedChats.splice(existingIndex, 1);
                    return [chatToUpdate, ...updatedChats];
                } else {
                    setFetchTrigger(prev => prev + 1);
                    return prevChats;
                }
            });
        };

        socket.on('sent_message', handleSentMessage);
        return () => socket.off('sent_message', handleSentMessage);
    }, [socket, currentUserId]);

    // LẮNG NGHE SỰ KIỆN QUẢN LÝ NHÓM
    useEffect(() => {
        if (!socket) return;

        // Thành viên rời nhóm -> cập nhật memberCount hoặc xoá khỏi list
        const handleGroupMemberLeft = (data) => {
            const convId = String(data.conversationId);
            setChats(prevChats => prevChats.map(c => {
                if (String(c.id) === convId) {
                    const newCount = c.memberCount ? c.memberCount - 1 : null;
                    const systemText = data.systemMessage?.text || '';
                    return {
                        ...c,
                        memberCount: newCount,
                        lastMessage: systemText,
                        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                        timestamp: Date.now()
                    };
                }
                return c;
            }));
        };

        // Nhóm bị xoá -> xoá khỏi danh sách
        const handleGroupDeleted = (data) => {
            const convId = String(data.conversationId);
            setChats(prevChats => prevChats.filter(c => String(c.id) !== convId));
            if (selectedChatId && String(selectedChatId) === convId) {
                if (onDeleteChat) onDeleteChat();
            }
        };

        // Đổi tên nhóm -> cập nhật hiển thị
        const handleGroupRenamed = (data) => {
            const convId = String(data.conversationId);
            setChats(prevChats => prevChats.map(c => {
                if (String(c.id) === convId) {
                    const systemText = data.systemMessage?.text || '';
                    return {
                        ...c,
                        displayName: data.newName,
                        groupName: data.newName,
                        lastMessage: systemText,
                        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                        timestamp: Date.now()
                    };
                }
                return c;
            }));
        };

        // Đổi ảnh nhóm -> cập nhật avatar
        const handleGroupAvatarChanged = (data) => {
            const convId = String(data.conversationId);
            setChats(prevChats => prevChats.map(c => {
                if (String(c.id) === convId) {
                    const systemText = data.systemMessage?.text || '';
                    return {
                        ...c,
                        avatar: data.newAvatar,
                        lastMessage: systemText,
                        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                        timestamp: Date.now()
                    };
                }
                return c;
            }));
        };

        // Thêm thành viên vào nhóm -> cập nhật memberCount
        const handleGroupMemberAdded = (data) => {
            const convId = String(data.conversationId);
            setChats(prevChats => prevChats.map(c => {
                if (String(c.id) === convId) {
                    const newCount = c.memberCount ? c.memberCount + 1 : null;
                    const systemText = data.systemMessage?.text || '';
                    return {
                        ...c,
                        memberCount: newCount,
                        lastMessage: systemText,
                        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                        timestamp: Date.now()
                    };
                }
                return c;
            }));
        };

        // Xoá thành viên khỏi nhóm
        const handleGroupMemberRemoved = (data) => {
            const convId = String(data.conversationId);
            // Nếu mình bị xoá -> xoá khỏi danh sách
            if (data.youWereRemoved) {
                setChats(prevChats => prevChats.filter(c => String(c.id) !== convId));
                if (selectedChatId && String(selectedChatId) === convId) {
                    if (onDeleteChat) onDeleteChat();
                }
                return;
            }
            // Nếu người khác bị xoá -> cập nhật memberCount
            setChats(prevChats => prevChats.map(c => {
                if (String(c.id) === convId) {
                    const newCount = c.memberCount ? c.memberCount - 1 : null;
                    const systemText = data.systemMessage?.text || '';
                    return {
                        ...c,
                        memberCount: newCount,
                        lastMessage: systemText,
                        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                        timestamp: Date.now()
                    };
                }
                return c;
            }));
        };

        // Nhóm mới được tạo -> thêm vào đầu danh sách ngay lập tức
        const handleGroupCreated = (data) => {
            const group = data.group;
            if (!group) return;
            const newChat = {
                id: group._id || group.id,
                isGroup: true,
                displayName: group.groupName,
                groupName: group.groupName,
                avatar: group.groupAvatar || '',
                lastMessage: 'Nhóm vừa được tạo',
                lastSenderId: null,
                time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now(),
                isUnread: true,
                otherUserId: null,
                isOnline: false,
                lastActive: null,
                memberCount: group.members?.length || null,
                adminId: group.adminId || null
            };
            setChats(prevChats => {
                // Không thêm trùng nếu đã có
                if (prevChats.find(c => String(c.id) === String(newChat.id))) return prevChats;
                return [newChat, ...prevChats];
            });
        };

        socket.on("group_member_left", handleGroupMemberLeft);
        socket.on("group_deleted", handleGroupDeleted);
        socket.on("group_renamed", handleGroupRenamed);
        socket.on("group_avatar_changed", handleGroupAvatarChanged);
        socket.on("group_member_added", handleGroupMemberAdded);
        socket.on("group_member_removed", handleGroupMemberRemoved);
        socket.on("group_created", handleGroupCreated);

        return () => {
            socket.off("group_member_left", handleGroupMemberLeft);
            socket.off("group_deleted", handleGroupDeleted);
            socket.off("group_renamed", handleGroupRenamed);
            socket.off("group_avatar_changed", handleGroupAvatarChanged);
            socket.off("group_member_added", handleGroupMemberAdded);
            socket.off("group_member_removed", handleGroupMemberRemoved);
            socket.off("group_created", handleGroupCreated);
        };
    }, [socket, selectedChatId, onDeleteChat]);

    // ĐÓNG CONTEXT MENU KHI CLICK RA NGOÀI
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
                setContextMenu(null);
            }
        };

        if (contextMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [contextMenu]);

    // XỬ LÝ KHI CLICK VÀO 1 ĐOẠN CHAT
    const handleChatClick = (chat) => {
        // Tắt trạng thái chưa đọc
        setChats(prevChats =>
            prevChats.map(c => c.id === chat.id ? { ...c, isUnread: false } : c)
        );
        // Gọi hàm từ Mainpage để hiển thị ChatWindow
        onSelectChat(chat);
    };

    // XỬ LÝ CHUỘT PHẢI ĐỂ HIỆN CONTEXT MENU
    const handleContextMenu = (e, chat) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            chatId: chat.id,
            chatName: chat.isGroup ? chat.groupName : chat.displayName
        });
    };

    // XỬ LÝ XOÁ CUỘC TRÒ CHUYỆN
    const handleDeleteClick = () => {
        const chat = chats.find(c => c.id === contextMenu.chatId);
        setChatToDelete(chat);
        setShowDeleteConfirm(true);
        setContextMenu(null);
    };

    const handleConfirmDelete = async (confirm) => {
        if (!confirm) {
            setShowDeleteConfirm(false);
            setChatToDelete(null);
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_URL}/conversations/${chatToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                // Xoá khỏi danh sách local
                setChats(prevChats => prevChats.filter(c => c.id !== chatToDelete.id));

                // Nếu đang mở chat bị xoá thì đóng ChatWindow
                if (selectedChatId && String(selectedChatId) === String(chatToDelete.id)) {
                    if (onDeleteChat) onDeleteChat();
                }
            } else {
                const errorData = await response.json();
                alert(errorData.message || "Lỗi khi xoá cuộc trò chuyện!");
            }
        } catch (error) {
            console.error("Lỗi xoá cuộc trò chuyện:", error);
            alert("Đã xảy ra lỗi kết nối!");
        }

        setShowDeleteConfirm(false);
        setChatToDelete(null);
    };

    const sortedChats = [...chats].sort((a, b) => b.timestamp - a.timestamp);

    const filteredChats = sortedChats.filter(chat => {
        if (activeTab === 'unread') return chat.isUnread === true;
        if (activeTab === 'group') return chat.isGroup === true;
        return true;
    });

    return (
        <div className={Styles.chatListContainer}>
            {filteredChats.length === 0 && (
                <p style={{ color: '#8B8D93', textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
                    {activeTab === 'unread' && 'Không có tin nhắn chưa đọc'}
                    {activeTab === 'group' && 'Chưa có nhóm nào'}
                    {activeTab === 'all' && 'Chưa có cuộc trò chuyện nào'}
                </p>
            )}
            {filteredChats.map((chat) => {
                const chatId = chat.id;
                // Áp dụng nickname local cho chat 1-1
                let chatName;
                if (chat.isGroup) {
                    chatName = chat.groupName || chat.displayName;
                } else {
                    const nicknameKey = `nickname_${currentUserId}_${chat.otherUserId}`;
                    const savedNickname = localStorage.getItem(nicknameKey);
                    chatName = savedNickname || chat.displayName;
                }
                const displayMessage = chat.lastMessage || '';

                return (
                    <div
                        key={chatId}
                        className={`${Styles.chatItem} ${selectedChatId === chatId ? Styles.chatItemSelection : ''}`}
                        onClick={() => handleChatClick(chat)}
                        onContextMenu={(e) => handleContextMenu(e, chat)}
                    >
                        <div className={Styles.avatarWrapper}>
                            {chat.avatar ? (
                                <img src={getAvatarUrl(chat.avatar)} alt="avatar" className={Styles.avatar} />
                            ) : (
                                <div className={Styles.avatarPlaceholder}></div>
                            )}
                        </div>

                        <div className={Styles.chatInfo}>
                            <h4 className={Styles.chatName}>{chatName}</h4>
                            <p className={`${Styles.chatMessage} ${chat.isUnread ? Styles.unreadText : ''}`}>
                                {displayMessage}
                            </p>
                            {chat.isGroup && chat.memberCount != null && (
                                <span className={Styles.memberCount}>{chat.memberCount} thành viên</span>
                            )}
                        </div>

                        <div className={Styles.chatMeta}>
                            <span className={`${Styles.chatTime} ${chat.isUnread ? Styles.unreadTime : ''}`}>
                                {chat.time}
                            </span>
                            {chat.isUnread && (
                                <span className={Styles.unreadBadge}>Chưa đọc</span>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* --- Context Menu (Chuột phải) --- */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className={Styles.contextMenu}
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button className={Styles.contextMenuItem} onClick={handleDeleteClick}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Xoá cuộc trò chuyện
                    </button>
                </div>
            )}

            {/* --- Popup Xác nhận Xoá --- */}
            {showDeleteConfirm && (
                <div className={Styles.confirmOverlay}>
                    <div className={Styles.confirmBox}>
                        <h3>Xoá cuộc trò chuyện?</h3>
                        <p>
                            Bạn chắc chắn muốn xoá cuộc trò chuyện với <strong>{chatToDelete?.isGroup ? chatToDelete?.groupName : chatToDelete?.displayName}</strong>?
                            Tất cả tin nhắn sẽ bị xoá vĩnh viễn và không thể khôi phục.
                        </p>
                        <div className={Styles.confirmActions}>
                            <button className={Styles.btnCancel} onClick={() => handleConfirmDelete(false)}>Huỷ bỏ</button>
                            <button className={Styles.btnAccept} onClick={() => handleConfirmDelete(true)}>Xoá</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatList;