import React, { useState } from 'react';
import Titles from './Sidebar-component/Titles/Titles';
import Styles from './Sidebar.module.css';
import Search from './Sidebar-component/Search/Searching';
import OptionChat from './Sidebar-component/OptionChat/OptionChat';
import ChatList from './Sidebar-component/ChatList/ChatList';
import { Plus } from 'lucide-react';
import CreateGroupChat from './Sidebar-component/CreateGroupChat/CreateGroupChat';

function Sidebar({ selectedChatId, onSelectChat, onDeleteChat, currentUser, onUpdateUser, socket, externalFetchTrigger }) {

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // activeTab OptionChat và ChatList dùng chung
  const [activeTab, setActiveTab] = useState('all');

  const handleGroupCreated = (newGroup) => {
    setFetchTrigger(prev => prev + 1);
    if (onSelectChat) {
      const formattedGroup = {
        ...newGroup,
        id: newGroup._id || newGroup.id,
        _id: newGroup._id || newGroup.id,
        isGroup: true,
        name: newGroup.groupName || 'Nhóm mới',
        displayName: newGroup.groupName || 'Nhóm mới',
        groupName: newGroup.groupName || 'Nhóm mới',
        avatar: newGroup.groupAvatar || '',
      };
      onSelectChat(formattedGroup);
    }
  };

  const handleOpenCreateGroup = () => {
    setIsCreateGroupOpen(true);
  };

  return (
    <div className={Styles.sidebarContainer}>

      <Titles
        currentUser={currentUser}
        onUpdateUser={onUpdateUser}
      />

      <Search onSelectChat={onSelectChat} />

      <OptionChat
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <ChatList
        selectedChatId={selectedChatId}
        onSelectChat={onSelectChat}
        onDeleteChat={onDeleteChat}
        currentUserId={currentUser?.id || currentUser?._id}
        socket={socket}
        externalFetchTrigger={(fetchTrigger + (externalFetchTrigger || 0))}
        activeTab={activeTab}
      />

      <button
        className={`${Styles.createGroupBtn} glass-panel`}
        onClick={handleOpenCreateGroup}
        title="Tạo nhóm chat mới"
      >
        <Plus size={24} color="#ffffff" />
      </button>

      <CreateGroupChat
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={handleGroupCreated}
        socket={socket}
      />

    </div>
  );
}

export default Sidebar;