import React, { useState, useEffect } from 'react';
import Styles from './Searching.module.css';
import { Search, X } from 'lucide-react';
import '../../../../index.css';

const Searching = ({ onSelectChat }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(15);

  // Chạy tìm kiếm sau khi ngừng gõ 0.5s
  useEffect(() => {
    // Nếu không mở khung search thì không làm gì cả
    if (!isSearching) return;

    // Bật skeleton loading
    setIsLoading(true);

    const delaySearch = setTimeout(async () => {
      try {
        const token = sessionStorage.getItem('token');

        const response = await fetch('http://localhost:5000/api/users/get-all-user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.ok) {
          // Lấy mảng users từ BE 
          let usersList = data.users || data;

          // Nếu người dùng có gõ chữ, tiến hành lọc kết quả
          if (searchText.trim()) {
            const keyword = searchText.toLowerCase();
            usersList = usersList.filter(user => {
              const nameToSearch = user.displayName || user.username || '';
              return nameToSearch.toLowerCase().includes(keyword);
            });
          }

          setSearchResults(usersList);
          setDisplayCount(15);
        }
      } catch (error) {
        console.error("Lỗi khi tìm kiếm người dùng:", error);
      } finally {
        setIsLoading(false); // Tắt skeleton loading
      }
    }, 500);

    return () => clearTimeout(delaySearch);

  }, [searchText, isSearching]); // Effect chạy lại mỗi khi searchText hoặc isSearching thay đổi

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
        setDisplayCount(prev => Math.min(prev + 15, searchResults.length));
    }
  };

  return (
    <div className={Styles.searchWrapper}>
      {/* Khung nhập tìm kiếm */}
      <div className={`${Styles.searchContainer} glass-panel`}>
        <Search className={Styles.searchIcon} size={18} />

        <input
          className={Styles.searchInput}
          type="text"
          placeholder="Tìm kiếm..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onFocus={() => setIsSearching(true)}
        />

        {/* Nếu đang tìm kiếm thì hiện nút X để tắt */}
        {isSearching && (
          <X
            className={Styles.closeIcon}
            size={18}
            onClick={() => {
              setIsSearching(false);
              setSearchText('');
              setSearchResults([]); // Xóa list kết quả khi đóng
            }}
          />
        )}
      </div>

      {isSearching && (
        <div className={Styles.searchOverlay} onScroll={handleScroll}>
          {isLoading ? (
            [1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className={`${Styles.skeletonBox} glass-panel`}></div>
            ))
          ) : searchResults.length > 0 ? (
            /* Render danh sách user tìm được */
            searchResults.slice(0, displayCount).map((user) => (
              <div
                key={user._id || user.id}
                className={`${Styles.userResultItem} glass-panel`}
                onClick={() => {
                  if (onSelectChat) {
                    onSelectChat(user);
                  }
                  setIsSearching(false);
                  setSearchText('');
                  setSearchResults([]);
                }}
              >
                {/* Ưu tiên hiển thị Avatar, nếu không có thì dùng div trống */}
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" className={Styles.resultAvatar} />
                ) : (
                  <div className={Styles.resultAvatarPlaceholder}>
                    {/* Lấy chữ cái đầu tiên của tên làm avatar mặc định */}
                    {(user.displayName || user.username || '?').charAt(0).toUpperCase()}
                  </div>
                )}

                <div className={Styles.resultInfo}>
                  {/* Ưu tiên displayName, không có thì fallback về username */}
                  <p className={Styles.resultName}>
                    {user.displayName || user.username}
                  </p>
                </div>
              </div>
            ))
          ) : (
            /* Trường hợp không tìm thấy ai */
            <p className={Styles.noResultText}>Không tìm thấy người dùng phù hợp.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default Searching;