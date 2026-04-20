# Lowkey Chat (Internal Chat) - Frontend

Đây là thư mục lưu trữ mã nguồn Frontend cho dự án **Lowkey Chat** - một ứng dụng trò chuyện trực tuyến bảo mật, thời gian thực và đa năng.

Dự án được xây dựng với mục tiêu mang lại trải nghiệm tương tác liền mạch, giao diện tối giản (dark theme), và cung cấp đầy đủ các tính năng liên lạc hiện đại như một nền tảng chuyên nghiệp.

## Công nghệ sử dụng

- **React.js (Vite)**: Quản lý UI Components và State linh hoạt.
- **Socket.IO-Client**: Giao tiếp thời gian thực, xử lý tin nhắn, trạng thái online/offline.
- **WebRTC**: Hạ tầng truyền phát media P2P hỗ trợ cuộc gọi Video và Voice Chat.
- **Lucide-React**: Cung cấp bộ Icon hiện đại, nhẹ và sắc nét.
- **Vanilla CSS (Modules)**: Đảm bảo không bị đụng độ class và tối ưu kích thước bundle.

## Tính năng chính

### 1. Trò chuyện thời gian thực (Real-time Messaging)

- **Chat 1-1 và Chat Nhóm**: Gửi/nhận tin nhắn không có độ trễ nhờ Socket.
- **Quản lý đa phương tiện**: Hỗ trợ đính kèm ảnh, video, ghi âm (voice message) và các tệp tin (tài liệu, tập tin nén) với khả năng ép tải xuống an toàn.
- **Mã hoá (Decryption Layer)**: Tin nhắn được xử lý bảo mật kết hợp với bộ lọc cho các Tin nhắn hệ thống (System & Call).
- **Trạng thái gõ phím**: Đang gõ (Typing indicator).
- **Bộ lọc thông minh**: Lọc danh sách người dùng theo: Quét tất cả, Chưa đọc, hoặc chỉ hiển thị Nhóm.

### 2. Cuộc gọi Tiên tiến (WebRTC Video & Voice Calls)

- **Cuộc gọi Audio và Video (1-1 & Nhóm)**: Chất lượng cao, hỗ trợ nhiều luồng kết nối camera với nhau (Grid layout).
- **Thông báo đa thiết bị**: Đổ nhạc chuông, Auto-bypass background policy (cho phép đánh thức và rung trên các thiết bị hỗ trợ).
- **Quản lý Vòng đời cuộc gọi**: Lưu trữ Lịch sử thành công/bỏ lỡ vào cơ sở dữ liệu. Tự động đóng phòng và dọn dẹp băng thông (Destroy Connection) khi cuộc gọi trống.

### 3. Quản lý Nhóm (Group Management)

- Tạo nhóm trò chuyện nhanh gọn.
- Cập nhật Tên nhóm, Ảnh đại diện nhóm (Avatar).
- Quản lý siêu thành viên (Thêm/Xoá thành viên, thông báo tự động "Ai đã tham gia/bị xoá" cho toàn box).

### 4. Thiết kế Giao diện (UI/UX)

- **Tương thích (Responsive)**: Sử dụng các thuộc tính tuỳ biến trên nhiều thiết bị (Desktop, màn hình Tablet, và Mobile).
- **Menu Ngữ cảnh (Context Menu)**: Nhấp chuột phải vào đoạn chat để hiện option điều khiển (Xoá trò chuyện, Tuỳ chọn,...).
- Bổ sung Confirm Modal để ngăn người dùng thao tác nhầm.
- Sử dụng bộ font chữ "Be Vietnam Pro".

## Cấu trúc thư mục cốt lõi

src/
├── components/ # Cấu trúc Component được Modun hoá
│ ├── Auth/ # Đăng nhập, Đăng ký, Cập nhật thông tin User
│ ├── Call/ # Chia nhỏ luồng Cuộc gọi: Đang đổ chuông (Incoming/Pending) vs Đang trong cuộc gọi (Calling)
│ ├── ChatWindow/ # Khung đọc/gửi tin nhắn, danh sách bong bóng (Bubbles) và Upload tệp tin.
│ └── Sidebar/ # Cột danh bạ, OptionChat, ContextMenu
├── hooks/ # Custom Hooks
│ └── useSoundEffect.js# Quản lý âm thanh bằng Web Audio API, bypass Chrome Policy
├── pages/ # Tích hợp layout Web RTC và Socket
│ └── mainpage/ # Render layout chính
└── App.jsx

## Hướng dẫn chạy cục bộ (Local Development)

Đảm bảo bạn đã khởi động Backend Server (Port `:5000`) trước khi bật Frontend.

1. Khôi phục các thư viện:
   npm install

2. Khởi động môi trường phát triển (Dev Server):
   npm run dev

Sau khi server báo hoàn tất, bạn có thể truy cập `http://localhost:5173` để trải nghiệm app.
