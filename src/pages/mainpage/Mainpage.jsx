import React, { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '../../components/Sidebar/Sidebar';
import ChatWindow from '../../components/ChatWindow/ChatWindow';
import RightSidebar from '../../components/RightSidebar/RightSidebar';
import CallIncoming from '../../components/Call/CallIncoming/CallIncoming';
import VideoIncoming from '../../components/Call/CallIncoming/VideoIncoming';
import CallPending from '../../components/Call/CallPending/CallPending';
import VoiceCall from '../../components/Call/Calling/VoiceCall/VoiceCall';
import VideoCall from '../../components/Call/Calling/VideoCall/VideoCall';
import styles from './Mainpage.module.css';
import { io } from 'socket.io-client';
import useSoundEffect from '../../hooks/useSoundEffect';
const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

// Khởi tạo kết nối Socket
const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  upgrade: false,
  reconnection: true,
  reconnectionAttempts: 10
});

const Mainpage = () => {
  // --- STATE QUẢN LÝ CƠ BẢN ---
  const [currentUser, setCurrentUser] = useState(null);

  // --- SOUND EFFECTS ---
  const { playForDuration: playPhoneLost } = useSoundEffect('/SoundEffect/phone-lost.mp3', { volume: 1 });
  const [currentChat, setCurrentChat] = useState(null);
  const [isLoadingMessages] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [sidebarFetchTrigger, setSidebarFetchTrigger] = useState(0);

  // --- RESPONSIVE STATE ---
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  // --- STATE VÀ REF CHO WEBRTC & LOGIC CALL ---
  const callIncomingRef = useRef(null);
  const videoIncomingRef = useRef(null);
  const callPendingRef = useRef(null);
  const voiceCallRef = useRef(null);
  const videoCallRef = useRef(null);
  const [callerInfo, setCallerInfo] = useState(null);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [activeCallParticipants, setActiveCallParticipants] = useState([]);

  const [remoteStreams, setRemoteStreams] = useState({}); 
  const [localStream, setLocalStream] = useState(null);   
  const peersRef = useRef({}); 
  const localStreamRef = useRef(null);
  const activeCallParticipantsRef = useRef([]);

  // Lấy thông tin user hiện tại và kết nối Socket
  useEffect(() => {
    const savedUser = sessionStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentUser(parsedUser);

      const userId = parsedUser.id || parsedUser._id;

      if (!socket.connected) {
        socket.connect();
      }

      socket.emit('user_connected', userId);
    }
  }, []);

  useEffect(() => {
    activeCallParticipantsRef.current = activeCallParticipants;
  }, [activeCallParticipants]);

  // Lắng nghe trạng thái Online/Offline Real-time
  useEffect(() => {
    const handleStatusChange = (data) => {
      const { userId, isOnline, lastActive } = data;
      setOnlineUsers((prevUsers) =>
        prevUsers.map((user) =>
          (user.id === userId || user._id === userId)
            ? { ...user, isOnline, lastActive }
            : user
        )
      );
      // Cập nhật currentChat nếu người đang chat là người vừa đổi trạng thái
      setCurrentChat((prevChat) => {
        if (!prevChat || prevChat.isGroup) return prevChat;
        const otherUserId = String(prevChat.otherUserId || prevChat._id || prevChat.id);
        if (otherUserId === String(userId)) {
          return { ...prevChat, isOnline, lastActive };
        }
        return prevChat;
      });
    };

    socket.on("user_status_changed", handleStatusChange);
    return () => socket.off("user_status_changed", handleStatusChange);
  }, []);

  // Gọi API lấy danh sách user cho Sidebar/RightSidebar
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/users/get-sidebar-user', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }

        if (response.ok) {
          const data = await response.json();
          const formattedUsers = data.map(user => ({
            ...user,
            id: user._id || user.id,
            _id: user._id || user.id,
            name: user.displayName || user.username || user.name,
            avatar: user.avatar || '',
            isOnline: user.isOnline,
            lastActive: user.lastActive
          }));
          setOnlineUsers(formattedUsers);
        }
      } catch (error) {
        console.error("Lỗi cập nhật danh sách user:", error);
      }
    };

    fetchUsers();
    const intervalId = setInterval(fetchUsers, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const callerInfoRef = useRef(null);
  const isVideoCallRef = useRef(false);

  // --- DỌN DẸP WEBRTC KHI KẾT THÚC CUỘC GỌI ---
  const destroyConnection = (specificUserId = null) => {
    if (specificUserId) {
        if (peersRef.current[specificUserId]) {
            peersRef.current[specificUserId].close();
            delete peersRef.current[specificUserId];
        }
        setRemoteStreams(prev => {
            const next = { ...prev };
            delete next[specificUserId];
            return next;
        });
        return;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    Object.values(peersRef.current).forEach(pc => pc.close());
    peersRef.current = {};
    setRemoteStreams({});
    setActiveCallParticipants([]);
  };

  const createPeerConnection = (targetId) => {
      if (peersRef.current[targetId]) {
        // Nếu đã tồn tại nhưng chưa có tracks, thữ add lại
        const existing = peersRef.current[targetId];
        if (localStreamRef.current && existing.getSenders().length === 0) {
            localStreamRef.current.getTracks().forEach(track => existing.addTrack(track, localStreamRef.current));
        }
        return existing;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current[targetId] = pc;

      // Gắn tracks ngay khi tạo (nếu đã có stream)
      if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
      }

      pc.ontrack = (e) => {
          if (e.streams && e.streams[0]) {
              setRemoteStreams(prev => ({
                  ...prev,
                  [targetId]: e.streams[0]
              }));
          }
      };

      pc.onicecandidate = (e) => {
          if (e.candidate) {
              socket.emit("call-signal", { targetId, senderId: currentUser?.id || currentUser?._id, signal: { type: 'candidate', candidate: e.candidate } });
          }
      };

      pc.oniceconnectionstatechange = () => {};

      return pc;
  };

  // --- LẮNG NGHE SỰ KIỆN CUỘC GỌI TỪ SOCKET ---
  useEffect(() => {
    if (!socket) return;

    // Người B có cuộc gọi đến
    const handleIncomingCall = (data) => {
      const incomingCaller = { ...data.caller };
      incomingCaller.isGroup = data.isGroup || data.caller.isGroup;
      incomingCaller.name = incomingCaller.groupName || incomingCaller.name || incomingCaller.displayName || incomingCaller.username;
      
      const callType = data.type || 'voice';

      setCallerInfo(incomingCaller);
      setIsVideoCall(callType === 'video');
      isVideoCallRef.current = callType === 'video';
      callerInfoRef.current = incomingCaller;

      if (callType === 'video') {
        if (videoIncomingRef.current) videoIncomingRef.current.showCall();
      } else {
        if (callIncomingRef.current) callIncomingRef.current.showCall();
      }
    };

    // Người B nhận tín hiệu Người A huỷ cuộc gọi trước khi nghe
    const handleCallCancelled = () => {
      if (callIncomingRef.current) callIncomingRef.current.hideCall();
      if (videoIncomingRef.current) videoIncomingRef.current.hideCall();
      destroyConnection();
    };

    // Người A nhận tín hiệu: Người B từ chối cuộc gọi (1-1)
    const handleCallDeclined = () => {
      if (callPendingRef.current && callPendingRef.current.endCall) {
        callPendingRef.current.endCall();
      }
      playPhoneLost(2000, [300, 100, 300]);
      destroyConnection();
    };

    // Group call: 1 người từ chối, vẫn tiếp tục đợi người khác
    const handleCallDeclinedGroup = (_data) => {
      // Không hủy cuộc gọi, chỉ đợi người khác
    };

    // Người A nhận tín hiệu: Người B đã đồng ý (1-1) hoặc Server báo có người chấp nhận trong Group
    const handleCallAccepted = async () => {
      if (callPendingRef.current && callPendingRef.current.endCall) callPendingRef.current.endCall();
      if (callIncomingRef.current) callIncomingRef.current.hideCall();
      if (videoIncomingRef.current) videoIncomingRef.current.hideCall();

      if (currentChat?.isGroup) {
          // Trong group, Host chỉ khởi tạo UI 1 lần duy nhất, KHÔNG TỰ ĐỘNG GỬI OFFER CHO GROUP ID
          if (activeCallParticipantsRef.current.length === 0) {
              if (isVideoCallRef.current && videoCallRef.current) {
                  videoCallRef.current.startCall();
              } else if (!isVideoCallRef.current && voiceCallRef.current) {
                  voiceCallRef.current.startCall();
              }
          }
          return; 
      }

      // TRƯỜNG HỢP GỌI 1-1
      if (isVideoCallRef.current) {
        if (videoCallRef.current) videoCallRef.current.startCall();
      } else {
        if (voiceCallRef.current) voiceCallRef.current.startCall();
      }

      const targetId = currentChat?.otherUserId || currentChat?.id || currentChat?._id;
      const pc = createPeerConnection(targetId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("call-signal", { targetId, senderId: currentUser?.id || currentUser?._id, signal: { type: 'offer', sdp: pc.localDescription } });
    };

    // Helper để làm giàu thông tin user (Avatar, Name)
    const getEnrichedUser = (targetUser) => {
       const uId = String(targetUser.id || targetUser._id);
       let fullUser = null;
       if (currentChat?.members) {
           fullUser = currentChat.members.find(m => String(m.id || m._id) === uId);
       }
       if (!fullUser) {
           fullUser = onlineUsers.find(u => String(u.id || u._id) === uId);
       }
       return fullUser ? { ...targetUser, ...fullUser } : targetUser;
    };

    // Khi bạn nhấc máy cuộc gọi nhóm, nhận danh sách những người đã nhấc máy
    const handleCallAcceptedGroup = async (data) => {
      const { existingParticipants, type } = data;
      if (callPendingRef.current && callPendingRef.current.endCall) callPendingRef.current.endCall();
      if (callIncomingRef.current) callIncomingRef.current.hideCall();
      if (videoIncomingRef.current) videoIncomingRef.current.hideCall();
      if (type === 'video') {
        if (videoCallRef.current) videoCallRef.current.startCall();
      } else {
        if (voiceCallRef.current) voiceCallRef.current.startCall();
      }

      const enrichedParticipants = existingParticipants.map(p => getEnrichedUser(p));
      setActiveCallParticipants(enrichedParticipants);

      // Gửi offer tuần tự cho từng người đã có mặt
      for (const p of enrichedParticipants) {
          const uId = p.id || p._id;
          if (!uId) continue;
          const pc = createPeerConnection(uId);
          try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit("call-signal", { targetId: uId, senderId: currentUser?.id || currentUser?._id, signal: { type: 'offer', sdp: pc.localDescription } });
          } catch (err) {
              console.error('[GROUP CALL] Lỗi tạo offer cho', uId, err);
          }
      }
    };

    // Khi bạn ĐANG trong phòng nhóm mà có người mới nhấc máy
    const handleUserJoined = (data) => {
        const { newUser } = data;
        const newUserId = String(newUser.id || newUser._id);
        const enrichedNewUser = getEnrichedUser(newUser);

        // Tắt pending nếu có (trường hợp chính mình là Host gọi cho nhóm)
        if (callPendingRef.current && callPendingRef.current.endCall) callPendingRef.current.endCall();

        if (activeCallParticipantsRef.current.length === 0) {
            // Đảm bảo giao diện Host được hiển thị nếu chưa (Fallback cho trường hợp Host gọi nhóm)
            if (isVideoCallRef.current && videoCallRef.current) videoCallRef.current.startCall();
            else if (!isVideoCallRef.current && voiceCallRef.current) voiceCallRef.current.startCall();
        }

        setActiveCallParticipants(prev => {
            if (prev.find(p => String(p.id || p._id) === newUserId)) return prev;
            return [...prev, enrichedNewUser];
        });

        // Chủ động tạo RTCPeerConnection chờ người kia gửi Offer tới
        // (người mới vào sẽ nhận call-accepted-group và gửi offer cho những người đã trong phòng)
        createPeerConnection(newUserId);
    };

    const handleUserLeft = (data) => {
        const { userId } = data;
        const remaining = activeCallParticipantsRef.current.filter(
            p => String(p.id || p._id) !== String(userId)
        );

        setActiveCallParticipants(remaining);

        if (remaining.length === 0) {
            // Không còn ai trong phòng → tự thoát call UI
            if (voiceCallRef.current) voiceCallRef.current.forceEnd();
            if (videoCallRef.current) videoCallRef.current.forceEnd();
            destroyConnection();
        } else {
            // Vẫn còn người khác → chỉ xoá peer của người vừa rời
            destroyConnection(String(userId));
        }
    };


    // Xử lý tín hiệu WebRTC
    const handleCallSignal = async (data) => {
      const { signal, senderId } = data;
      if (!senderId) return;

      const pc = createPeerConnection(senderId);

      if (signal.type === 'offer') {
        if (pc.signalingState !== "stable") {
            console.warn(`[WebRTC] Bỏ qua offer, vì state đang là: ${pc.signalingState}`);
            return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("call-signal", { targetId: senderId, senderId: currentUser?.id || currentUser?._id, signal: { type: 'answer', sdp: pc.localDescription } });

      } else if (signal.type === 'answer') {
        if (pc.signalingState !== "have-local-offer") {
            console.warn(`[WebRTC] Bỏ qua answer, vì state đang là: ${pc.signalingState}`);
            return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

      } else if (signal.type === 'candidate') {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (e) {
          console.warn("[SIGNAL] Lỗi addIceCandidate:", e.message);
        }
      }
    };

    // Một trong hai người cúp máy khi đang gọi
    const handleCallEnded = () => {
      if (voiceCallRef.current) voiceCallRef.current.endCall();
      if (videoCallRef.current) videoCallRef.current.forceEnd();
      playPhoneLost(2000, [300, 100, 300]);
      destroyConnection();
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-cancelled", handleCallCancelled);
    socket.on("call-declined", handleCallDeclined);
    socket.on("call-declined-group", handleCallDeclinedGroup);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("call-accepted-group", handleCallAcceptedGroup);
    socket.on("call-signal", handleCallSignal);
    socket.on("call-ended", handleCallEnded);
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-cancelled", handleCallCancelled);
      socket.off("call-declined", handleCallDeclined);
      socket.off("call-declined-group", handleCallDeclinedGroup);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("call-accepted-group", handleCallAcceptedGroup);
      socket.off("call-signal", handleCallSignal);
      socket.off("call-ended", handleCallEnded);
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
    };
  }, [currentChat, callerInfo]);

  const handleUpdateUser = (updatedUserData) => {
    setCurrentUser(updatedUserData);
  };

  const handleSelectChat = (chatData) => {
    let selectedInfo = null;

    if (typeof chatData === 'object' && chatData !== null) {
      selectedInfo = chatData;
    }
    else {
      selectedInfo = onlineUsers.find(user => user.id === chatData || user._id === chatData);
    }

    if (!selectedInfo) return;

    const targetId = selectedInfo.id || selectedInfo._id;

    // Nếu là chat 1-1 từ ChatList (có otherUserId), merge trạng thái online thực từ onlineUsers
    let isOnline = selectedInfo.isOnline || false;
    let lastActive = selectedInfo.lastActive || null;

    if (!selectedInfo.isGroup && selectedInfo.otherUserId) {
      const otherUserId = String(selectedInfo.otherUserId);
      const liveUser = onlineUsers.find(u => String(u.id || u._id) === otherUserId);
      if (liveUser) {
        isOnline = liveUser.isOnline || false;
        lastActive = liveUser.lastActive || null;
      }
    }

    const formattedChat = {
      ...selectedInfo,
      id: targetId,
      _id: targetId,
      name: selectedInfo.name || selectedInfo.displayName || selectedInfo.groupName || selectedInfo.username || "Người dùng",
      avatar: selectedInfo.avatar || '/default-avatar.png',
      isOnline,
      lastActive,
      // Giữ memberCount cho ChatHeader group
      members: selectedInfo.members || (selectedInfo.memberCount ? Array(selectedInfo.memberCount).fill({}) : undefined),
    };

    if (currentChat?.id === formattedChat.id) return;

    setCurrentChat(formattedChat);
    setLeftSidebarOpen(false); // Close sidebar on mobile
  };

  // --- HANDLERS QUẢN LÝ NHÓM ---
  const handleLeaveGroup = () => {
    setCurrentChat(null);
    setSidebarFetchTrigger(prev => prev + 1);
  };

  const handleDeleteGroup = () => {
    setCurrentChat(null);
    setSidebarFetchTrigger(prev => prev + 1);
  };

  const handleGroupUpdated = (updatedChat) => {
    setCurrentChat(prev => ({
      ...prev,
      ...updatedChat
    }));
    setSidebarFetchTrigger(prev => prev + 1);
  };

  const handleReplaceVideoTrack = (newTrack) => {
    // 1. Cập nhật track trong localStream
    if (localStreamRef.current) {
        const oldTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldTrack) {
            oldTrack.stop();
            localStreamRef.current.removeTrack(oldTrack);
        }
        localStreamRef.current.addTrack(newTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    }
    
    // 2. Cập nhật track trên tất cả RTCPeerConnection đang gửi đi
    Object.values(peersRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
            sender.replaceTrack(newTrack).catch(err => {
                console.warn("[WebRTC] Lỗi thay đổi track video:", err);
            });
        }
    });
  };

  // --- HÀM NGƯỜI A BẤM GỌI ---
  const handleStartCall = async (type = 'voice') => {
    if (!currentChat || !currentUser) return;

    // Xác định ID đích
    const callTargetId = currentChat.isGroup ? currentChat.id || currentChat._id : (currentChat.otherUserId || currentChat.id || currentChat._id);

    try {
      // Xin quyền Mic của người A ngay khi bấm gọi
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      localStreamRef.current = stream; // Lưu logic ngầm
      setLocalStream(stream); // Lưu state để UI render
    } catch (err) {
      alert("Lỗi quyền Mic/Cam. Vui lòng kiểm tra trình duyệt!", err);
      return;
    }

    if (type === 'voice' && callPendingRef.current) {
      callPendingRef.current.startVoiceCall();
    } else if (type === 'video' && callPendingRef.current) {
      callPendingRef.current.startVideoCall();
    }

    setIsVideoCall(type === 'video');
    isVideoCallRef.current = type === 'video';
    setActiveCallParticipants([]);

    socket.emit("request-call", {
      receiverId: callTargetId,
      caller: currentUser,
      type: type
    });
  };

  return (
    <div className={styles.mainContainer}>
      {/* --- RENDER CÁC COMPONENT GỌI --- */}
      <CallIncoming
        ref={callIncomingRef}
        callerInfo={callerInfo}
        isVideoCall={false}
        onAccept={async () => {
          let stream;
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;
            setLocalStream(stream);
          } catch (err) {
            alert("Lỗi quyền Mic. Không thể nghe máy!", err);
            return;
          }

          const callerId = callerInfo?.id || callerInfo?._id;
          const isGroupCall = !!(callerInfo?.isGroup || currentChat?.isGroup);
          socket.emit("accept-call", { 
              callerId, 
              conversationId: callerInfo?.roomId || currentChat?.roomId || currentChat?.conversationId || currentChat?.id || currentChat?._id, 
              isGroup: isGroupCall, 
              accepter: currentUser 
          });

          if (!isGroupCall) {
            // 1-1: Tự start call và chờ offer từ caller (handleCallSignal sẽ xử lý)
            if (voiceCallRef.current) voiceCallRef.current.startCall();
            createPeerConnection(callerId);
          }
          // Group: chờ server gửi call-accepted-group
        }}
        onDecline={() => {
          socket.emit("decline-call", {
            callerId: callerInfo?.id || callerInfo?._id,
            receiverId: currentUser?.id || currentUser?._id,
            conversationId: callerInfo?.roomId || currentChat?.roomId || currentChat?.conversationId || currentChat?.id || currentChat?._id,
            isGroup: !!(callerInfo?.isGroup || currentChat?.isGroup),
            type: 'voice'
          });
          destroyConnection();
        }}
      />

      <VideoIncoming
        ref={videoIncomingRef}
        callerInfo={callerInfo}
        onAccept={async () => {
          let stream;
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            localStreamRef.current = stream;
            setLocalStream(stream);
          } catch (err) {
            alert("Lỗi quyền Cam/Mic. Không thể nhận cuộc gọi video!", err);
            return;
          }

          const callerId = callerInfo?.id || callerInfo?._id;
          const isGroupCall = !!(callerInfo?.isGroup || currentChat?.isGroup);
          socket.emit("accept-call", { 
              callerId, 
              conversationId: callerInfo?.roomId || currentChat?.roomId || currentChat?.conversationId || currentChat?.id || currentChat?._id, 
              isGroup: isGroupCall, 
              accepter: currentUser 
          });

          if (!isGroupCall) {
            // 1-1: Tự start call và chờ offer từ caller
            if (videoCallRef.current) videoCallRef.current.startCall();
            createPeerConnection(callerId);
          }
          // Group: chờ server gửi call-accepted-group
        }}
        onDecline={() => {
          socket.emit("decline-call", {
            callerId: callerInfo?.id || callerInfo?._id,
            receiverId: currentUser?.id || currentUser?._id,
            conversationId: callerInfo?.roomId || currentChat?.roomId || currentChat?.conversationId || currentChat?.id || currentChat?._id,
            isGroup: !!(callerInfo?.isGroup || currentChat?.isGroup),
            type: 'video'
          });
          destroyConnection();
        }}
      />

      <CallPending
        ref={callPendingRef}
        currentChat={currentChat}
        onCancelCall={() => {
          if (currentChat) {
            socket.emit("cancel-call", {
              receiverId: currentChat.otherUserId || currentChat.id || currentChat._id,
              callerId: currentUser?.id || currentUser?._id,
              conversationId: currentChat.roomId || currentChat.conversationId || currentChat.id || currentChat._id,
              type: isVideoCall ? 'video' : 'voice',
              isGroup: currentChat.isGroup
            });
          }
          destroyConnection();
        }}
      />

      <VoiceCall
        ref={voiceCallRef}
        currentChat={callerInfo || currentChat}
        remoteStreams={remoteStreams}
        localStream={localStream}
        isGroup={(callerInfo || currentChat)?.isGroup}
        currentUser={currentUser}
        activeCallParticipants={activeCallParticipants}
        onEndCall={(callDuration) => {
          const isReceiver = !!callerInfo;
          const callerId = isReceiver ? (callerInfo.id || callerInfo._id) : (currentUser?.id || currentUser?._id);
          const targetConv = isReceiver ? callerInfo : currentChat;
          const partnerId = targetConv?.isGroup ? targetConv?.id : (isReceiver ? callerId : (currentChat?.id || currentChat?._id));

          socket.emit("end-call", {
            partnerId,
            callerId, 
            receiverId: currentUser?.id || currentUser?._id,
            conversationId: targetConv?.roomId || targetConv?.conversationId || targetConv?.id || targetConv?._id,
            type: 'voice', callDuration,
            isGroup: targetConv?.isGroup
          });
          destroyConnection();
        }}
      />

      <VideoCall
        ref={videoCallRef}
        currentChat={callerInfo || currentChat}
        remoteStreams={remoteStreams}
        localStream={localStream}
        isGroup={(callerInfo || currentChat)?.isGroup}
        currentUser={currentUser}
        activeCallParticipants={activeCallParticipants}
        onReplaceVideoTrack={handleReplaceVideoTrack}
        onEndCall={(callDuration) => {
          const isReceiver = !!callerInfo;
          const callerId = isReceiver ? (callerInfo.id || callerInfo._id) : (currentUser?.id || currentUser?._id);
          const targetConv = isReceiver ? callerInfo : currentChat;
          const partnerId = targetConv?.isGroup ? targetConv?.id : (isReceiver ? callerId : (currentChat?.id || currentChat?._id));

          socket.emit("end-call", {
            partnerId,
            callerId, 
            receiverId: currentUser?.id || currentUser?._id,
            conversationId: targetConv?.roomId || targetConv?.conversationId || targetConv?.id || targetConv?._id,
            type: 'video', callDuration,
            isGroup: targetConv?.isGroup
          });
          destroyConnection();
        }}
      />

      {/* Overlay Mobile */}
      {(leftSidebarOpen || rightSidebarOpen) && (
        <div 
          className={styles.mobileOverlay} 
          onClick={() => {
            setLeftSidebarOpen(false);
            setRightSidebarOpen(false);
          }}
        ></div>
      )}

      <div className={`${styles.sidebarWrapper} ${leftSidebarOpen ? styles.open : ''}`}>
        <Sidebar
          chats={[]}
          selectedChatId={currentChat?.id}
          onSelectChat={handleSelectChat}
          onDeleteChat={() => setCurrentChat(null)}
          currentUser={currentUser}
          onUpdateUser={handleUpdateUser}
          socket={socket}
          externalFetchTrigger={sidebarFetchTrigger}
        />
      </div>

      <div className={styles.chatWrapper}>
        {currentChat ? (
          <ChatWindow
            key={currentChat.id || currentChat._id}
            currentChat={currentChat}
            isLoading={isLoadingMessages}
            currentUser={currentUser}
            socket={socket}
            onStartCall={handleStartCall}
            onLeaveGroup={handleLeaveGroup}
            onDeleteGroup={handleDeleteGroup}
            onGroupUpdated={handleGroupUpdated}
            onOpenLeftSidebar={() => setLeftSidebarOpen(true)}
            onOpenRightSidebar={() => setRightSidebarOpen(true)}
          />
        ) : (
          <div className={styles.emptyState}>
            <button className={styles.mobileMenuBtn} onClick={() => setLeftSidebarOpen(true)}>
              <Menu size={28} />
            </button>
            <div style={{ color: 'white', textAlign: 'center' }}>
              Hãy chọn một đoạn chat hoặc tìm kiếm người dùng để bắt đầu
            </div>
          </div>
        )}
      </div>

      <div className={`${styles.rightSidebarWrapper} ${rightSidebarOpen ? styles.open : ''}`}>
        <RightSidebar
          onlineUsers={onlineUsers}
          onSelectContact={handleSelectChat}
          selectedChatId={currentChat?.id}
        />
      </div>
    </div>
  );
}

export default Mainpage;