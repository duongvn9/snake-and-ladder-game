# 🎲 DL 16 Years Anniversary Game - Cờ Rắn Thang

Game Cờ Rắn Thang (Snakes and Ladders) được phát triển đặc biệt cho sự kiện kỷ niệm 16 năm thành lập DL.

![Angular](https://img.shields.io/badge/Angular-19.2-red?logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![License](https://img.shields.io/badge/License-Private-gray)

## 📖 Giới thiệu

Đây là phiên bản số hóa của trò chơi Cờ Rắn Thang cổ điển, được thiết kế cho các hoạt động team building và sự kiện công ty. Game hỗ trợ nhiều người chơi với hệ thống đội nhóm, bảng xếp hạng real-time và nhiều tính năng tương tác thú vị.

## ✨ Tính năng chính

### 🎮 Gameplay
- **Bàn cờ 10x10** với 100 ô, hiển thị rõ ràng các vị trí rắn và thang
- **Hỗ trợ nhiều người chơi** (tối thiểu 2 người)
- **Hệ thống đội nhóm** với màu sắc phân biệt
- **Xúc xắc tùy chỉnh** - có thể cấu hình số điểm tối đa (mặc định 1-12)
- **Chế độ bản đồ cố định** với vị trí rắn/thang được định sẵn

### 🐍 Rắn và Thang
- **12 thang** giúp người chơi leo lên nhanh hơn
- **6 rắn** khiến người chơi bị trượt xuống
- **Lựa chọn leo thang** - người chơi có thể chọn leo hoặc ở lại (5 giây để quyết định)
- **Tự động trượt rắn** khi đứng vào đầu rắn

### 🏆 Hệ thống xếp hạng
- **Bảng xếp hạng real-time** hiển thị thứ hạng người chơi
- **Vị trí chiến thắng đặc biệt** - Hạng 16 (kỷ niệm 16 năm)
- **Hiệu ứng ăn mừng** khi người chơi về đích

### ⏱️ Tính năng thời gian
- **Đếm ngược 15 giây** cho mỗi lượt tung xúc xắc
- **Đếm ngược 5 giây** cho quyết định leo thang
- **Thông báo hết giờ** khi quá thời gian

### 💾 Lưu trữ
- **Tự động lưu game** vào localStorage
- **Khôi phục game** khi tải lại trang
- **Xử lý lỗi** khi dữ liệu bị hỏng

## 🚀 Cài đặt và Chạy

### Yêu cầu
- Node.js >= 18.x
- npm >= 9.x
- Angular CLI >= 19.x

### Cài đặt

```bash
# Clone repository
git clone <repository-url>
cd DL-16years-game

# Cài đặt dependencies
npm install
```

### Chạy Development Server

```bash
npm start
# hoặc
ng serve
```

Mở trình duyệt và truy cập `http://localhost:4200/`

### Build Production

```bash
npm run build
```

Build artifacts sẽ được lưu trong thư mục `dist/`

## 🎯 Hướng dẫn chơi

### Bước 1: Thiết lập game
1. Truy cập trang chủ
2. Nhập số lượng người chơi (tối thiểu 2)
3. Nhập tên và chọn đội cho từng người chơi
4. Nhấn "Bắt đầu game"

### Bước 2: Chơi game
1. **Người tung xúc xắc** được hiển thị ở panel bên trái
2. **Chọn người di chuyển** từ bảng xếp hạng (có thể chọn bất kỳ ai trong đội)
3. **Nhấn nút tung xúc xắc** để tung
4. Quân cờ sẽ tự động di chuyển theo số điểm
5. Nếu đứng vào thang, chọn leo lên hoặc ở lại
6. Nếu đứng vào đầu rắn, tự động trượt xuống

### Bước 3: Chiến thắng
- Người chơi đầu tiên đến ô 100 sẽ về nhất
- Phải tung đúng số điểm để về đích (không được vượt quá)
- Hạng 16 là vị trí chiến thắng đặc biệt! 🎉

## 🛠️ Cấu trúc dự án

```
src/
├── app/
│   ├── components/          # UI Components
│   │   ├── board/           # Bàn cờ game
│   │   ├── dice-display/    # Hiển thị xúc xắc
│   │   ├── dice-roller-list/# Danh sách người tung
│   │   ├── game-main/       # Component chính
│   │   ├── leaderboard/     # Bảng xếp hạng
│   │   ├── player-setup/    # Thiết lập người chơi
│   │   └── ...
│   ├── constants/           # Cấu hình cố định
│   ├── models/              # Data models
│   ├── services/            # Business logic
│   └── utils/               # Utility functions
├── styles.scss              # Global styles
└── index.html
```

## 📝 Scripts

| Script | Mô tả |
|--------|-------|
| `npm start` | Chạy development server |
| `npm run build` | Build production |
| `npm run watch` | Build với watch mode |
| `npm test` | Chạy unit tests |
| `npm run lint` | Kiểm tra linting |
| `npm run lint:fix` | Tự động fix linting |

## 🔧 Cấu hình xúc xắc

Game cho phép tùy chỉnh số điểm tối đa của xúc xắc:
- Mặc định: 1-12
- Có thể thay đổi trong game qua nút cấu hình
- Áp dụng ngay hoặc từ round tiếp theo

## 🎨 Tech Stack

- **Framework**: Angular 19.2
- **Language**: TypeScript 5.7
- **Styling**: SCSS
- **State Management**: RxJS BehaviorSubject
- **Storage**: localStorage
- **Build Tool**: Angular CLI
- **Testing**: Jasmine + Karma
