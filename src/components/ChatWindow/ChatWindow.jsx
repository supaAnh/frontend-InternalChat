import React, { useState, useRef, useEffect } from 'react';
import Styles from './ChatWindow.module.css';
import ChatHeader from './ChatWindow-component/ChatHeader/ChatHeader';
import MessageList from './ChatWindow-component/MessageList/MessageList';
import ChatInput from './ChatWindow-component/ChatInput/ChatInput';
import TypingIndicator from './ChatWindow-component/TypingIndicator/TypingIndicator';
import { API_URL } from '../../config/api';

const ChatWindow = ({ currentChat, currentUser, socket, onStartCall, onLeaveGroup, onDeleteGroup, onGroupUpdated, onOpenLeftSidebar, onOpenRightSidebar }) => {
  const [messages, setMessages] = useState([]);
  const [internalLoading, setInternalLoading] = useState(false); 
  const [typingUsers, setTypingUsers] = useState([]);

  // Dùng useRef để lưu giá trị mới nhất của currentChat
  const currentChatRef = useRef(currentChat);

  useEffect(() => {
    currentChatRef.current = currentChat;
  }, [currentChat]);

  // Lấy lịch sử tin nhắn khi mở khung chat
  useEffect(() => {
    if (!currentChat || !currentUser) return;

    let isCurrentChat = true; 

    const fetchChatHistory = async () => {
      setInternalLoading(true);
      setMessages([]); // Làm sạch màn hình ngay lập tức

      try {
        // ƯU TIÊN SỬ DỤNG ROOM ID / CONVERSATION ID
        const targetId = currentChat.roomId || currentChat.conversationId || currentChat.id || currentChat._id;
        const token = sessionStorage.getItem('token');
        
        if (!targetId) {
            console.error("Lỗi: Không tìm thấy ID để lấy lịch sử chat.");
            setInternalLoading(false);
            return;
        }

        const [response] = await Promise.all([
          fetch(`${API_URL}/messages/${targetId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          new Promise(resolve => setTimeout(resolve, 500))
        ]);

        if (!isCurrentChat) return;

        if (response.ok) {
          const data = await response.json();
          const messageArray = Array.isArray(data) ? data : (data.messages || []);
          setMessages(messageArray);
        } else {
          console.error("Lỗi khi gọi API lấy tin nhắn:", await response.text());
        }
      } catch (error) {
        console.error("Lỗi lấy lịch sử tin nhắn:", error);
      } finally {
        if (isCurrentChat) {
          setInternalLoading(false);
        }
      }
    };

    fetchChatHistory();

    return () => {
      isCurrentChat = false; 
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChat?.roomId, currentChat?.conversationId, currentChat?.id, currentChat?._id, currentUser?.id]); 

  // Lắng nghe tin nhắn mới từ Socket
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (newMessage) => {
      const chat = currentChatRef.current;
      if (!chat) return;

      // Xác định ID đại diện cho khung chat hiện tại
      const currentChatId = chat.roomId || chat.conversationId || chat.id || chat._id;
      
      const senderId = newMessage.senderId?._id || newMessage.senderId;
      const receiverId = newMessage.receiverId?._id || newMessage.receiverId;
      const msgConversationId = newMessage.conversationId?._id || newMessage.conversationId;
      
      const isBelongToCurrentChat = 
        msgConversationId === currentChatId || 
        senderId === currentChatId || 
        receiverId === currentChatId || 
        newMessage.chatId === currentChatId ||
        (chat.members && chat.members.includes(senderId));

      if (isBelongToCurrentChat) {
        setMessages((prevMessages) => {
          const isExist = prevMessages.some(
            msg => (msg._id && msg._id === newMessage._id) || (msg.id && msg.id === newMessage.id)
          );
          if (isExist) return prevMessages;
          
          return [...prevMessages, newMessage];
        });

        // NÊU ĐANG XEM CHAT NÀY -> BÁO CHO NGƯỜI GỬI LÀ ĐÃ XEM NGAY LẬP TỨC
        // Nếu không phải tin nhắn của mình gửi
        if (senderId !== (currentUser?.id || currentUser?._id)) {
            socket.emit('mark_seen', {
                conversationId: msgConversationId || currentChatId,
                receiverId: senderId,
                senderId: currentUser?.id || currentUser?._id
            });
        }
      }
    };

    const handleMessageSeen = (payload) => {
        const chat = currentChatRef.current;
        if (!chat) return;
        const currentChatId = chat.roomId || chat.conversationId || chat.id || chat._id;
        const payloadChatId = payload.conversationId || payload.receiverId;
        
        if (payloadChatId === currentChatId || payload.senderId === currentChatId) {
            // Cập nhật trạng thái đã xem
            setMessages(prev => prev.map(m => ({...m, isSeen: true})));
        }
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_seen", handleMessageSeen);

    const checkBelongsToCurrentChat = (payload) => {
        const chat = currentChatRef.current;
        if (!chat) return false;
        const currentChatId = chat.roomId || chat.conversationId || chat.id || chat._id;
        const targetId = payload.conversationId || payload.receiverId;
        return targetId === currentChatId || payload.senderId === currentChatId;
    };

    const handleTypingStart = (payload) => {
        if (checkBelongsToCurrentChat(payload)) {
            setTypingUsers(prev => {
                if (prev.find(u => u.id === payload.senderId)) return prev;
                return [...prev, { id: payload.senderId, name: payload.senderName }];
            });
        }
    };

    const handleTypingStop = (payload) => {
        if (checkBelongsToCurrentChat(payload)) {
            setTypingUsers(prev => prev.filter(u => u.id !== payload.senderId));
        }
    };

    socket.on("typing_start", handleTypingStart);
    socket.on("typing_stop", handleTypingStop);

    // === LẮNG NGHE SỰ KIỆN QUẢN LÝ NHÓM ===

    // Thành viên rời nhóm -> thêm tin nhắn hệ thống vào chat
    const handleGroupMemberLeft = (data) => {
        const chat = currentChatRef.current;
        if (!chat) return;
        const currentChatId = chat.roomId || chat.conversationId || chat.id || chat._id;
        if (String(data.conversationId) === String(currentChatId) && data.systemMessage) {
            setMessages(prev => [...prev, data.systemMessage]);
        }
    };

    // Đổi tên nhóm -> thêm tin nhắn hệ thống
    const handleGroupRenamed = (data) => {
        const chat = currentChatRef.current;
        if (!chat) return;
        const currentChatId = chat.roomId || chat.conversationId || chat.id || chat._id;
        if (String(data.conversationId) === String(currentChatId)) {
            if (data.systemMessage) {
                setMessages(prev => [...prev, data.systemMessage]);
            }
            // Cập nhật tên nhóm trong currentChat
            if (onGroupUpdated) {
                onGroupUpdated({
                    ...chat,
                    name: data.newName,
                    groupName: data.newName
                });
            }
        }
    };

    // Đổi ảnh nhóm -> thêm tin nhắn hệ thống
    const handleGroupAvatarChanged = (data) => {
        const chat = currentChatRef.current;
        if (!chat) return;
        const currentChatId = chat.roomId || chat.conversationId || chat.id || chat._id;
        if (String(data.conversationId) === String(currentChatId)) {
            if (data.systemMessage) {
                setMessages(prev => [...prev, data.systemMessage]);
            }
            // Cập nhật ảnh nhóm trong currentChat
            if (onGroupUpdated) {
                onGroupUpdated({
                    ...chat,
                    avatar: data.newAvatar,
                    groupAvatar: data.newAvatar
                });
            }
        }
    };

    // Nhóm bị xoá
    const handleGroupDeleted = (data) => {
        const chat = currentChatRef.current;
        if (!chat) return;
        const currentChatId = chat.roomId || chat.conversationId || chat.id || chat._id;
        if (String(data.conversationId) === String(currentChatId)) {
            alert(`Nhóm "${data.groupName}" đã bị trưởng nhóm xoá.`);
            if (onDeleteGroup) onDeleteGroup();
        }
    };

    // Thêm thành viên -> thêm tin nhắn hệ thống
    const handleGroupMemberAdded = (data) => {
        const chat = currentChatRef.current;
        if (!chat) return;
        const currentChatId = chat.roomId || chat.conversationId || chat.id || chat._id;
        if (String(data.conversationId) === String(currentChatId) && data.systemMessage) {
            setMessages(prev => [...prev, data.systemMessage]);
        }
    };

    // Xoá thành viên -> thêm tin nhắn hệ thống hoặc đóng chat nếu mình bị xoá
    const handleGroupMemberRemoved = (data) => {
        const chat = currentChatRef.current;
        if (!chat) return;
        const currentChatId = chat.roomId || chat.conversationId || chat.id || chat._id;
        if (String(data.conversationId) === String(currentChatId)) {
            if (data.youWereRemoved) {
                alert('Bạn đã bị xoá khỏi nhóm.');
                if (onDeleteGroup) onDeleteGroup();
                return;
            }
            if (data.systemMessage) {
                setMessages(prev => [...prev, data.systemMessage]);
            }
        }
    };

    socket.on("group_member_left", handleGroupMemberLeft);
    socket.on("group_renamed", handleGroupRenamed);
    socket.on("group_avatar_changed", handleGroupAvatarChanged);
    socket.on("group_deleted", handleGroupDeleted);
    socket.on("group_member_added", handleGroupMemberAdded);
    socket.on("group_member_removed", handleGroupMemberRemoved);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_seen", handleMessageSeen);
      socket.off("typing_start", handleTypingStart);
      socket.off("typing_stop", handleTypingStop);
      socket.off("group_member_left", handleGroupMemberLeft);
      socket.off("group_renamed", handleGroupRenamed);
      socket.off("group_avatar_changed", handleGroupAvatarChanged);
      socket.off("group_deleted", handleGroupDeleted);
      socket.off("group_member_added", handleGroupMemberAdded);
      socket.off("group_member_removed", handleGroupMemberRemoved);
    };
  }, [socket]);

  // KHI MỞ CHAT -> ĐÁNH DẤU ĐÃ XEM TẤT CẢ TIN NHẮN
  useEffect(() => {
      if (socket && currentChat && currentUser) {
          const targetId = currentChat.roomId || currentChat.conversationId || currentChat.id || currentChat._id;
          socket.emit('mark_seen', {
              conversationId: targetId,
              receiverId: targetId, // fallback for 1-1
              senderId: currentUser?.id || currentUser?._id
          });
      }
  }, [currentChat, currentUser, socket]);

  // XỬ LÝ GỬI TIN NHẮN
  const handleSendMessage = async (messageData) => {
    const receiverIdToUse = currentChat?.roomId || currentChat?.conversationId || currentChat?.id || currentChat?._id;

    if (!receiverIdToUse) {
        alert("Lỗi: Không tìm thấy ID của người nhận! Vui lòng chọn lại đoạn chat.");
        return;
    }

    const currentUserId = currentUser?.id || currentUser?._id;
    const tempId = `temp-${Date.now()}`;

    // Tạo URL xem trước tạm thời cho File/Ảnh
    let tempPreviewUrl = messageData.previewUrl || "";
    if (messageData.file && !tempPreviewUrl) {
        tempPreviewUrl = URL.createObjectURL(messageData.file);
    }

    // Hiển thị tin nhắn ngay lập tức lên màn hình
    const optimisticMessage = {
      id: tempId,
      _id: tempId,
      senderId: currentUserId,
      text: messageData.text,
      type: messageData.type || 'text',
      mediaType: messageData.type || 'text',
      mediaUrl: tempPreviewUrl,
      fileName: messageData.file?.name || messageData.fileName || "",
      fileMimeType: messageData.file?.type || "",
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, optimisticMessage]);

    // Gửi File & Data lên Backend
    try {
      const token = sessionStorage.getItem('token');
      
      // Khởi tạo FormData
      const formData = new FormData();
      formData.append('receiverId', receiverIdToUse);
      
      if (messageData.text) {
          formData.append('text', messageData.text);
      }
      
      if (messageData.file) {
          formData.append('file', messageData.file); 
      }

      const response = await fetch(`${API_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
          const errorText = await response.text();
          console.error(`Lỗi API (${response.status}):`, errorText);
          setMessages(prev => prev.filter(msg => msg._id !== tempId));
          return;
      }

      // Backend trả về tin nhắn thật đã lưu database 
      const savedDbMessage = await response.json();

      const socketPayload = {
        ...savedDbMessage,
        receiverId: receiverIdToUse,
        senderId: {
            _id: currentUserId,
            id: currentUserId,
            displayName: currentUser?.displayName || currentUser?.name || currentUser?.username,
            avatar: currentUser?.avatar
        }
      };

      // Thay thế tin nhắn tạm bằng tin nhắn thật từ DB
      setMessages(prev => prev.map(msg => 
        msg._id === tempId ? socketPayload : msg
      ));

      if (socket && socket.connected) {
        socket.emit("send_message", socketPayload);
      } else {
        console.warn("Socket chưa kết nối, người nhận có thể không thấy tin nhắn.");
      }
    } catch (error) {
      console.error("Lỗi mạng khi gửi tin nhắn:", error);
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
    }
  };

  const handleTyping = (isTyping) => {
      if (!socket || !currentChat || !currentUser) return;
      
      const targetId = currentChat.roomId || currentChat.conversationId || currentChat.id || currentChat._id;
      const payload = {
          conversationId: targetId,
          receiverId: targetId,
          senderId: currentUser?.id || currentUser?._id,
          senderName: currentUser?.displayName || currentUser?.name || currentUser?.username
      };

      if (isTyping) {
          socket.emit('typing_start', payload);
      } else {
          socket.emit('typing_stop', payload);
      }
  };

  // Xử lý cập nhật nhóm từ ChatHeader (thêm system message vào chat)
  const handleGroupUpdated = (updatedChat, systemMessage) => {
      if (systemMessage) {
          setMessages(prev => [...prev, systemMessage]);
      }
      if (onGroupUpdated) {
          onGroupUpdated(updatedChat);
      }
  };

  return (
    <div className={Styles.chatWindowContainer}>
      <ChatHeader 
        currentChat={currentChat} 
        onStartCall={onStartCall}
        currentUser={currentUser}
        socket={socket}
        onLeaveGroup={onLeaveGroup}
        onDeleteGroup={onDeleteGroup}
        onGroupUpdated={handleGroupUpdated}
        onOpenLeftSidebar={onOpenLeftSidebar}
        onOpenRightSidebar={onOpenRightSidebar}
      />

      <MessageList 
        messages={messages} 
        typingUsers={typingUsers}
        isLoading={internalLoading}
        currentChat={currentChat} 
        currentUser={currentUser}
        onStartCall={onStartCall}
      />

      {/* HIỂN THỊ ĐANG NHẬP... Ở NGAY TRÊN INPUT */}
      <TypingIndicator typingUsers={typingUsers} />

      <ChatInput 
        onSendMessage={handleSendMessage} 
        onTyping={handleTyping}
        isLoading={internalLoading}
      />
    </div>
  );
};

export default ChatWindow;